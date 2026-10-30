import {decode as decodePNG} from 'fast-png';
export interface Box {
  z?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export interface FontAlternative {family:string;weight:FontWeight;italic:boolean;score:number;size?:number;spacing?:number;}
export interface TextRun {start:number;end:number;fontFamily?:string;fontWeight?:FontWeight;fontItalic?:boolean;color?:string;}
export interface FontOverride {layerId:string;fontFamily:string;fontWeight:FontWeight;fontItalic:boolean;previousWidth:number;widthChange:number;}
export interface TextLayer extends Box {
  id: string;
  type: "text";
  name: string;
  text: string;
  fontFamily: string;
  fontCssFamily?: string;
  fontStyle?: string;
  wordOffsets?: number[];
  ocrAlternatives?: string[];
  fontSize: number;
  fontWeight: FontWeight;
  fontItalic?: boolean;
  color: string;
  lineHeight: number;
  confidence: number;
  letterSpacing: number;
  baseline: number;
  inkX?: number;
  inkY?: number;
  useOriginal?: boolean;
  original?: { data: string; bounds: Box };
  matchError?: number;
  alternatives?: FontAlternative[];
  textAlignHorizontal?: 'LEFT'|'CENTER'|'RIGHT';
  runs?: TextRun[];
  blockId?: string;
  widthChanged?: boolean;
}
export interface ShapeLayer extends Box {
  id: string;
  type: "shape";
  name: string;
  color: string;
  radius: number;
  cornerRadii?: [number, number, number, number];
  strokeColor?: string;
  strokeWidth?: number;
}
export interface VectorLayer extends Box {
  id: string;
  type: "vector";
  name: string;
  svg: string;
}
export interface ImageLayer extends Box {
  id: string;
  type: "image";
  name: string;
  data: string;
}
export type Layer = TextLayer | ShapeLayer | VectorLayer | ImageLayer;
export interface ImageScreen {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: Layer[];
  warnings: string[];
  reference?: string;
  fontOverrides?: FontOverride[];
}
export interface ImagePackage {
  format: "pixelframe";
  version: 1;
  screens: ImageScreen[];
}
export const limits = {
  fileBytes: 25_000_000,
  pixels: 20_000_000,
  side: 12000,
  analysisSide: 4096,
  analysisPixels: 4_000_000,
  files: 8,
  layers: 5000,
  packageChars: 80_000_000,
};
export function decodeBase64(raw:string):Uint8Array {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const out=new Uint8Array(Math.floor(raw.replace(/=+$/,'').length*6/8));let bits=0,buffer=0,i=0;
  for(const ch of raw.replace(/=+$/,'')){const v=alphabet.indexOf(ch);if(v<0)throw Error('Invalid base64 image');buffer=(buffer<<6)|v;bits+=6;if(bits>=8){bits-=8;out[i++]=(buffer>>bits)&255;}}
  return out;
}

/** Validate decoded content before accepting a PNG, not claimed JSON metadata. */
export function inspectImageData(data:string) {
  if(!data.startsWith('data:image/png;'))return;
  const bytes=decodeBase64(data.split(',')[1]??'');
  if(bytes.length<33)throw Error('Invalid PNG image data');
  const view=new DataView(bytes.buffer),width=view.getUint32(16),height=view.getUint32(20);
  if(!width||!height||width>limits.side||height>limits.side||width*height>limits.pixels)throw Error('Decoded image exceeds pixel limits');
  const decoded=decodePNG(bytes,{checkCrc:true}),n=decoded.width*decoded.height;
  const alpha=(i:number)=>decoded.palette ? (decoded.palette[decoded.data[i]]?.[3]??255) : decoded.channels===4||decoded.channels===2 ? decoded.data[i*decoded.channels+decoded.channels-1]/(decoded.depth===16?257:1) : decoded.transparency?.length===decoded.channels&&decoded.transparency.every((v,ch)=>decoded.data[i*decoded.channels+ch]===v)?0:255;
  // A bounded sample screens obvious vacant PNGs; count fully near the 2% edge
  // so fine icons aligned between sample points are never rejected by chance.
  const step=Math.max(1,Math.floor(n/4096));let sampled=0,visible=0;
  for(let i=0;i<n;i+=step){sampled++;if(alpha(i)>=24)visible++;}
  let coverage=visible/sampled,visiblePixels=coverage*n;
  if(coverage<.04||visiblePixels<48){visiblePixels=0;for(let i=0;i<n;i++)if(alpha(i)>=24)visiblePixels++;coverage=visiblePixels/n;}
  if(coverage<.02||visiblePixels<24)throw Error('Vacant image layer: visible alpha coverage is below 2% or 24 pixels. Reconvert this older package with the updated Pixelframe extension.');
  return {width,height,coverage,visiblePixels};
}

export function validatePackage(value: unknown, options:{deferImageContent?:boolean}={}): ImagePackage {
  const p = value as ImagePackage;
  if (
    !p ||
    p.format !== "pixelframe" ||
    p.version !== 1 ||
    !Array.isArray(p.screens) ||
    !p.screens.length ||
    p.screens.length > limits.files
  )
    throw new Error("Choose a Pixelframe image package.");
  const finite = (v: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const str = (v: string, max: number) =>
    typeof v === "string" && v.length <= max;
  const color = (v: string) => /^#[a-f\d]{6}$/i.test(v);
  const data = (v: string) =>
    str(v, 30_000_000) &&
    /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(v);
  let total = 0;
  const ids = new Set<string>(),
    screenIds = new Set<string>();
  for (const s of p.screens) {
    if (!s || typeof s !== "object" || screenIds.has(s.id))
      throw new Error("Invalid or duplicate image screen.");
    screenIds.add(s.id);
    if (
      !str(s.id, 100) ||
      !str(s.name, 300) ||
      !finite(s.width, 1, limits.side) ||
      !finite(s.height, 1, limits.side) ||
      s.width * s.height > limits.pixels ||
      !Array.isArray(s.layers) ||
      !Array.isArray(s.warnings) ||
      s.warnings.length > 100 ||
      s.warnings.some((w) => !str(w, 2000)) ||
      (s.reference !== undefined && !data(s.reference))
    )
      throw new Error("Invalid image screen.");
    for (const l of s.layers) {
      if (!l || typeof l !== "object") throw new Error("Invalid image layer.");
      if (
        ++total > limits.layers ||
        !str(l.id, 150) ||
        ids.has(l.id) ||
        !str(l.name, 300) ||
        !finite(l.x, -100, limits.side) ||
        !finite(l.y, -100, limits.side) ||
        !finite(l.width, 0.1, limits.side) ||
        !finite(l.height, 0.1, limits.side) ||
        (l.z!==undefined&&!finite(l.z,-1e6,1e6))
      )
        throw new Error("Invalid image layer.");
      ids.add(l.id);
      if (l.type === "text") {
        if (
          !str(l.text, 100000) ||
          !str(l.fontFamily, 100) ||
          (l.fontCssFamily !== undefined && !str(l.fontCssFamily, 150)) ||
          (l.fontStyle !== undefined && !str(l.fontStyle, 100)) ||
          (l.ocrAlternatives !== undefined && (!Array.isArray(l.ocrAlternatives) || l.ocrAlternatives.length > 4 || l.ocrAlternatives.some(v=>!str(v,100000)))) ||
          (l.wordOffsets !== undefined && (!Array.isArray(l.wordOffsets) || l.wordOffsets.length !== l.text.split(" ").length || l.wordOffsets.some(v=>!finite(v,-100,limits.side)))) ||
          !finite(l.fontSize, 1, 1000) ||
          !finite(l.lineHeight, 1, 2000) ||
          !finite(l.letterSpacing, -100, 100) ||
          !finite(l.baseline, 0, 2000) ||
          (l.inkX !== undefined && !finite(l.inkX, -100, limits.side)) ||
          (l.inkY !== undefined && !finite(l.inkY, -100, limits.side)) ||
          ![100, 200, 300, 400, 500, 600, 700, 800, 900].includes(
            l.fontWeight,
          ) ||
          (l.fontItalic !== undefined && typeof l.fontItalic !== "boolean") ||
          !color(l.color) ||
          !finite(l.confidence, 0, 100)
        )
          throw new Error("Invalid text layer.");
        if (l.useOriginal !== undefined && typeof l.useOriginal !== "boolean")
          throw new Error("Invalid text mode");
        if (l.useOriginal && !l.original)
          throw new Error("Missing original text image");
        if (
          l.original &&
          (!data(l.original.data) ||
            !l.original.bounds ||
            !finite(l.original.bounds.x, 0, limits.side) ||
            !finite(l.original.bounds.y, 0, limits.side) ||
            !finite(l.original.bounds.width, 1, limits.side) ||
            !finite(l.original.bounds.height, 1, limits.side))
        )
          throw new Error("Invalid original text image");
        if (l.matchError !== undefined && !finite(l.matchError, 0, 2))
          throw new Error("Invalid font match");
        if(l.textAlignHorizontal!==undefined&&!['LEFT','CENTER','RIGHT'].includes(l.textAlignHorizontal))throw Error('Invalid text alignment');
        if(l.alternatives!==undefined&&(!Array.isArray(l.alternatives)||l.alternatives.length>5||l.alternatives.some(a=>!a||!str(a.family,100)||![100,200,300,400,500,600,700,800,900].includes(a.weight)||typeof a.italic!=='boolean'||!finite(a.score,0,2)||(a.size!==undefined&&!finite(a.size,1,1000))||(a.spacing!==undefined&&!finite(a.spacing,-100,100)))))throw Error('Invalid font alternatives');
        if(l.blockId!==undefined&&!str(l.blockId,150)||l.widthChanged!==undefined&&typeof l.widthChanged!=='boolean')throw Error('Invalid typography review metadata');
        if(l.runs!==undefined&&(!Array.isArray(l.runs)||l.runs.length>1000||l.runs.some((r,i)=>!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<0||r.end<=r.start||r.end>l.text.length||(i>0&&r.start<l.runs![i-1].end)||(r.fontFamily!==undefined&&!str(r.fontFamily,100))||(r.fontWeight!==undefined&&![100,200,300,400,500,600,700,800,900].includes(r.fontWeight))||(r.fontItalic!==undefined&&typeof r.fontItalic!=='boolean')||(r.color!==undefined&&!color(r.color)))))throw Error('Invalid text runs');
      } else if (l.type === "shape") {
        if (!color(l.color) || !finite(l.radius, 0, 6000))
          throw new Error("Invalid shape layer.");
        if (l.cornerRadii !== undefined && (!Array.isArray(l.cornerRadii) || l.cornerRadii.length !== 4 || l.cornerRadii.some(r=>!finite(r,0,6000)))) throw new Error("Invalid corner radii.");
        if (l.strokeColor !== undefined && !color(l.strokeColor)) throw new Error("Invalid stroke colour.");
        if (l.strokeWidth !== undefined && !finite(l.strokeWidth,0,100)) throw new Error("Invalid stroke width.");
      } else if (l.type === "image") {
        if (!data(l.data)) throw new Error("Invalid image data.");
        if(!options.deferImageContent)inspectImageData(l.data);
      } else if (l.type === "vector") {
        // The generator emits a single path with a solid fill, no arbitrary SVG.
        if (
          !str(l.svg, 300000) ||
          !/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 [\d.]+ [\d.]+"><path fill="#[a-f\d]{6}" fill-rule="evenodd" d="[MLZ\d. ,\-]+"\/><\/svg>$/.test(
            l.svg,
          )
        )
          throw new Error("Invalid vector data.");
      } else throw new Error("Unsupported layer type.");
    }
    if(s.fontOverrides!==undefined&&(!Array.isArray(s.fontOverrides)||s.fontOverrides.length>limits.layers||s.fontOverrides.some((o,i)=>!o||!s.layers.some(l=>l.id===o.layerId&&l.type==='text')||s.fontOverrides!.findIndex(v=>v?.layerId===o.layerId)!==i||!str(o.fontFamily,100)||![100,200,300,400,500,600,700,800,900].includes(o.fontWeight)||typeof o.fontItalic!=='boolean'||!finite(o.previousWidth,.1,limits.side)||!finite(o.widthChange,-1,1000))))throw Error('Invalid font overrides');
  }
  return p;
}
