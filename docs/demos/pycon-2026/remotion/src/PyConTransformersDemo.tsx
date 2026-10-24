import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {CAPTIONS, FRAME_RATE, PINNED_REVISION, SCENES, TOTAL_FRAMES, TRANSITION_FRAMES, WIDTH, HEIGHT, getCaptionAtTime, getSceneFrames} from "./transformersTimeline";
import type {SceneSpec} from "./transformersTimeline";

const C={bg:"#07111f",panel:"#0e1d2e",edge:"#31506a",text:"#f4f8fc",muted:"#b7c7d5",cyan:"#63d9ec",mint:"#66e4b4",amber:"#ffd27e",red:"#ff9caa"};
const MONO="'SFMono-Regular',Consolas,'Liberation Mono',monospace";
const facts:Record<string,string[]>={
  thesis:["huggingface/transformers","Pregunta: superficie candidata si cambia GenerationMixin.generate","Fuente: reporte de evidencia verificado"],
  "search-problem":["Problema: un nombre literal puede aparecer en más de un rol","La búsqueda textual es contexto de motivación, no una salida medida aquí","ripgrep · ast-grep: NOT_RUN"],
  "ast-evidence":["GenerationMixin.generate · definición confirmada","text-generation pipeline · llamada léxica confirmada","Commit y tag verificados por el colector"],
  "candidate-graph":["Pipeline → model.generate · relación léxica confirmada","8 clases declaran herencia de GenerationMixin · INFERRED","8 referencias léxicas en tests · tests NOT_RUN"],
  "bounded-context":["3.682 bytes · metadatos de evidencia","816.502 bytes · fuentes citadas (13 archivos)","99,55% de reducción determinista de bytes","No son tokens ni equivalencia semántica"],
  "model-roles":["Modelo local: NOT_RUN","Modelo frontier: NOT_RUN","Roles de arquitectura no equivalen a resultados observados"],
  verification:["Identidad exacta de checkout, tag y commit · VERIFIED","Escaneo AST en conjuntos acotados · COMPLETED","Reporte y medición sobre 13 fuentes citadas · COMPLETED"],
  limitations:["AST no resuelve dispatch dinámico, registros ni extensiones nativas","Candidatos no prueban participación real en runtime","Sin tests ejecutados ni garantía de impacto completo"],
  takeaway:["Las relaciones candidatas orientan la investigación; no certifican causalidad","Validá rutas concretas en el contexto de ejecución antes de concluir"],
};

const Scene=({scene,index}:{scene:SceneSpec;index:number})=>{
  const frame=useCurrentFrame(); const {fps}=useVideoConfig();
  const enter=spring({frame:Math.max(0,frame-3),fps,config:{damping:180,stiffness:95}});
  const shift=interpolate(enter,[0,1],[18,0]); const lines=facts[scene.id]??[];
  return <div style={{position:"absolute",inset:0,boxSizing:"border-box",padding:"58px 86px 180px",background:C.bg,color:C.text,fontFamily:"Inter,'Aptos','Helvetica Neue',Arial,sans-serif",overflow:"hidden"}}>
    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:MONO,fontSize:20,color:C.cyan,letterSpacing:2}}><span>PYCON · TRANSFORMERS EVIDENCE</span><span>{String(index+1).padStart(2,"0")} / {SCENES.length}</span></header>
    <div style={{marginTop:86,transform:`translateY(${shift}px)`}}>
      <div style={{fontSize:scene.id==="thesis"?63:52,fontWeight:820,lineHeight:1.08,letterSpacing:-1.3,maxWidth:1580}}>{scene.title}</div>
      <div style={{fontSize:26,color:C.muted,marginTop:17}}>{scene.subtitle}</div>
      {scene.id==="ast-evidence"&&<div style={{display:"flex",alignItems:"baseline",gap:12,fontFamily:MONO,color:C.amber,fontSize:25,marginTop:16}}><strong style={{fontSize:20,letterSpacing:1}}>COMMIT</strong><span>{PINNED_REVISION}</span></div>}
    </div>
    {scene.id==="bounded-context"?<div style={{position:"absolute",left:86,right:86,top:340,display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
      {lines.slice(0,3).map((line,i)=><div key={line} style={{background:C.panel,border:`1px solid ${C.edge}`,borderRadius:20,padding:28,minHeight:112}}><div style={{fontFamily:MONO,fontSize:i===2?48:40,fontWeight:800,color:i===2?C.mint:C.cyan}}>{line.split(" · ")[0]}</div><div style={{fontSize:21,color:C.muted,marginTop:7}}>{line.split(" · ")[1]}</div></div>)}
      <div style={{gridColumn:"1 / -1",background:"#392d1d",border:"2px solid #9e7740",borderRadius:18,padding:"18px 25px",fontSize:23,fontWeight:750,color:C.amber}}>{lines[3]}</div>
    </div>:<div style={{position:"absolute",left:86,right:86,top:338,bottom:206,display:"flex",flexDirection:"column",justifyContent:"center",gap:18}}>
      {lines.map((line,i)=><div key={line} style={{display:"flex",alignItems:"center",gap:20,background:C.panel,border:`1px solid ${C.edge}`,borderRadius:18,padding:"20px 28px",fontSize:27,fontWeight:680,lineHeight:1.22}}><span style={{fontFamily:MONO,fontSize:18,fontWeight:900,color:line.includes("NOT_RUN")||line.includes("NOT_RUN")?C.red:i===0?C.cyan:C.mint}}>{line.includes("NOT_RUN")?"NOT_RUN":line.includes("INFERRED")?"INFERRED":"EVIDENCIA"}</span><span>{line}</span></div>)}
    </div>}
  </div>;
};

const Caption=({frame}:{frame:number})=>{const cue=getCaptionAtTime(frame/FRAME_RATE);return <div style={{position:"absolute",zIndex:5,left:70,right:70,bottom:38,minHeight:112,display:"flex",alignItems:"center",justifyContent:"center",padding:"17px 38px",boxSizing:"border-box",border:"1px solid #a8bacb",borderRadius:18,background:"rgba(2,8,15,.97)",color:"#fff",fontSize:30,fontWeight:760,lineHeight:1.25,textAlign:"center",textShadow:"0 2px 2px #000"}}>{cue.text}</div>};

export const PyConTransformersDemo=()=>{const frame=useCurrentFrame();const scenes=SCENES.flatMap((scene,index)=>{const part=<TransitionSeries.Sequence key={scene.id} durationInFrames={getSceneFrames(index)}><Scene scene={scene} index={index}/></TransitionSeries.Sequence>;return index===SCENES.length-1?[part]:[part,<TransitionSeries.Transition key={`transition-${scene.id}`} presentation={fade()} timing={linearTiming({durationInFrames:TRANSITION_FRAMES})}/>];});return <div style={{width:WIDTH,height:HEIGHT,position:"relative",overflow:"hidden",background:C.bg}}><TransitionSeries>{scenes}</TransitionSeries><div style={{position:"absolute",zIndex:6,top:0,left:0,right:0,height:5,background:"#1b2b3c"}}><div style={{height:5,width:`${frame/TOTAL_FRAMES*100}%`,background:C.cyan}}/></div><Caption frame={frame}/></div>};
