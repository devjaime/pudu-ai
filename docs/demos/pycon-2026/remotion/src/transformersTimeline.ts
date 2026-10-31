export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FRAME_RATE = 30;
export const TOTAL_DURATION_SECONDS = 90;
export const TOTAL_FRAMES = FRAME_RATE * TOTAL_DURATION_SECONDS;
export const TRANSITION_FRAMES = 15;
export const PINNED_REVISION = "18329f1065382e54db698e242cf98bd3f3e5a766";

export type SceneId = "thesis" | "search-problem" | "ast-evidence" | "candidate-graph" | "bounded-context" | "model-roles" | "verification" | "limitations" | "takeaway";
export type SceneSpec = {id: SceneId; title: string; subtitle: string; durationSeconds: number};
export const SCENES: SceneSpec[] = [
  {id:"thesis",title:"LLMs frente a repositorios gigantes",subtitle:"Transformers · investigación estática y acotada",durationSeconds:7},
  {id:"search-problem",title:"Un símbolo no cuenta toda la historia",subtitle:"Búsqueda literal: motivación del problema · no ejecutada en este informe",durationSeconds:10},
  {id:"ast-evidence",title:"AST: evidencia Python observada",subtitle:"huggingface/transformers · v5.20.2",durationSeconds:12},
  {id:"candidate-graph",title:"Relaciones candidatas, no certeza de runtime",subtitle:"Definición · llamada de pipeline · herencia declarada · referencias de tests",durationSeconds:13},
  {id:"bounded-context",title:"Un contexto acotado, con su costo visible",subtitle:"13 archivos · 3.682 bytes vs 816.502 bytes · 99,55% · no son tokens ni equivalencia semántica",durationSeconds:12},
  {id:"model-roles",title:"Roles de modelos: arquitectura, no medición",subtitle:"Etapas de runtime y modelo: NOT_RUN",durationSeconds:10},
  {id:"verification",title:"Qué verificó esta evidencia",subtitle:"Identidad fijada · análisis AST acotado · reporte reproducible",durationSeconds:10},
  {id:"limitations",title:"Lo que el análisis no puede demostrar",subtitle:"Sin dispatch dinámico completo, ejecución de tests ni prueba de impacto",durationSeconds:9},
  {id:"takeaway",title:"Primero evidencia. Después, una pregunta mejor.",subtitle:"Un mapa de candidatos ayuda; no reemplaza la verificación",durationSeconds:7},
];
export type CaptionCue = {startSeconds:number;endSeconds:number;text:string;sceneId:SceneId};
export const CAPTIONS: CaptionCue[] = [
  {startSeconds:0,endSeconds:7,sceneId:"thesis",text:"LLMs frente a repositorios gigantes: una investigación estática sobre Transformers."},
  {startSeconds:7,endSeconds:17,sceneId:"search-problem",text:"La búsqueda literal puede ser ruidosa. Es la motivación; ripgrep no se ejecutó en este informe."},
  {startSeconds:17,endSeconds:29,sceneId:"ast-evidence",text:"Checkout verificado en Transformers v5.20.2."},
  {startSeconds:29,endSeconds:42,sceneId:"candidate-graph",text:"El análisis AST encontró definiciones, una llamada de pipeline, herencia declarada y referencias de tests."},
  {startSeconds:42,endSeconds:54,sceneId:"bounded-context",text:"Trece archivos citados: 3.682 bytes de metadatos frente a 816.502 bytes de fuentes."},
  {startSeconds:54,endSeconds:64,sceneId:"model-roles",text:"Ejecución de tests y análisis de modelo: NOT_RUN. No medimos esas etapas."},
  {startSeconds:64,endSeconds:74,sceneId:"verification",text:"Identidad y reporte verificados; el análisis AST quedó acotado a conjuntos configurados."},
  {startSeconds:74,endSeconds:83,sceneId:"limitations",text:"Reducción de bytes del 99,55%; no son tokens ni equivalencia semántica. AST no prueba impacto completo."},
  {startSeconds:83,endSeconds:90,sceneId:"takeaway",text:"Las relaciones candidatas orientan la investigación; no certifican causalidad. Valide rutas concretas antes de concluir."},
];
export const STORYBOARD_DURATION = SCENES.reduce((total, scene) => total + scene.durationSeconds, 0);
export const getSceneAtTime = (seconds:number) => {
  let start = 0;
  for (const scene of SCENES) {
    const end = start + scene.durationSeconds;
    if (seconds >= start && seconds < end) return scene;
    start = end;
  }
  return SCENES.at(-1)!;
};
export const isTransitionLegal = (frames:number, shortestSeconds:number) => Number.isInteger(frames) && frames > 0 && frames * 2 <= shortestSeconds * FRAME_RATE;
export const getSceneFrames = (index:number) => SCENES[index]!.durationSeconds * FRAME_RATE + (index < SCENES.length - 1 ? TRANSITION_FRAMES : 0);
export const getCaptionAtTime = (seconds:number) => CAPTIONS.find((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds) ?? CAPTIONS.at(-1)!;
