export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FRAME_RATE = 30;
export const TOTAL_DURATION_SECONDS = 90;
export const TOTAL_FRAMES = FRAME_RATE * TOTAL_DURATION_SECONDS;
export const TRANSITION_FRAMES = 15;

export type SceneId =
  | "thesis"
  | "fixture-search"
  | "graph-query"
  | "evidence-boundary"
  | "worker-diagram"
  | "takeaway";

export type SceneSpec = {
  id: SceneId;
  title: string;
  subtitle: string;
  durationSeconds: number;
};

export const SCENES: SceneSpec[] = [
  {id: "thesis", title: "LLMs frente a repositorios gigantes", subtitle: "Primero evidencia local. Después, interpretación.", durationSeconds: 7},
  {id: "fixture-search", title: "validate_user", subtitle: "Búsqueda literal · fixture público python-small", durationSeconds: 18},
  {id: "graph-query", title: "Relaciones extraídas del código", subtitle: "python-ast · 8 nodos · 9 aristas", durationSeconds: 20},
  {id: "evidence-boundary", title: "Evidencia medida, no garantía", subtitle: "No inventamos aristas; los tiempos pueden variar.", durationSeconds: 17},
  {id: "worker-diagram", title: "Un worker local, con límites explícitos", subtitle: "Contexto · ruteo · verificación · telemetría", durationSeconds: 20},
  {id: "takeaway", title: "Primero estructura verificable", subtitle: "Después, una pregunta mejor para el agente.", durationSeconds: 8},
];

export type CaptionCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export const CAPTIONS: CaptionCue[] = [
  {startSeconds: 0, endSeconds: 7, text: "LLMs frente a repositorios gigantes. Que cada paso se apoye en evidencia visible."},
  {startSeconds: 7, endSeconds: 12, text: "Abrimos el fixture Python público: tests/fixtures/repos/python-small."},
  {startSeconds: 12, endSeconds: 19, text: "La consulta literal validate_user produjo 4 coincidencias con rg."},
  {startSeconds: 19, endSeconds: 25, text: "Incluye una mención en notes.txt y tres líneas de auth.py."},
  {startSeconds: 25, endSeconds: 33, text: "El grafo se extrajo con python-ast: 8 nodos y 9 aristas."},
  {startSeconds: 33, endSeconds: 45, text: "Dos relaciones de llamada resueltas apuntan a validate_user: authenticate y UserService.check."},
  {startSeconds: 45, endSeconds: 54, text: "Son resultados de herramientas y del fixture; no una garantía de verdad."},
  {startSeconds: 54, endSeconds: 62, text: "El tiempo medido cambia entre ejecuciones; no lo presentamos como promesa."},
  {startSeconds: 62, endSeconds: 72, text: "El diagrama existente muestra el worker local y su contexto acotado."},
  {startSeconds: 72, endSeconds: 82, text: "También representa ruteo, verificación y telemetría en el flujo."},
  {startSeconds: 82, endSeconds: 90, text: "CLI primero: evidencia concreta para formular mejores preguntas."},
];

export const STORYBOARD_DURATION = SCENES.reduce((total, scene) => total + scene.durationSeconds, 0);

export const isTransitionLegal = (transitionFrames: number, shortestSceneSeconds: number) =>
  Number.isInteger(transitionFrames) &&
  transitionFrames > 0 &&
  transitionFrames * 2 <= shortestSceneSeconds * FRAME_RATE;

export const getSceneFrames = (index: number) =>
  SCENES[index]!.durationSeconds * FRAME_RATE + (index < SCENES.length - 1 ? TRANSITION_FRAMES : 0);

export const getCaptionAtTime = (seconds: number) =>
  CAPTIONS.find((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds) ?? CAPTIONS.at(-1)!;
