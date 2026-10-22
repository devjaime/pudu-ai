import {
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {
  CAPTIONS,
  FRAME_RATE,
  HEIGHT,
  SCENES,
  TOTAL_FRAMES,
  TRANSITION_FRAMES,
  WIDTH,
  getCaptionAtTime,
  getSceneFrames,
} from "./timeline";
import type {SceneId, SceneSpec} from "./timeline";

const COLORS = {
  background: "#07111f",
  panel: "#0d1b2b",
  panelBright: "#12253a",
  border: "#274059",
  text: "#f3f7fb",
  muted: "#a9bacb",
  cyan: "#55d6e8",
  mint: "#55e0ae",
  amber: "#ffd17a",
  rose: "#ff8293",
};

const mono = "'SFMono-Regular', Consolas, 'Liberation Mono', monospace";
const sans = "Inter, 'Aptos', 'Helvetica Neue', Arial, sans-serif";

const card: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(18,37,58,.96), rgba(8,22,36,.97))",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 24,
  boxShadow: "0 24px 70px rgba(0,0,0,.24)",
};

const SmallLabel = ({children, color = COLORS.cyan}: {children: React.ReactNode; color?: string}) => (
  <div style={{fontFamily: mono, fontSize: 21, letterSpacing: 2, fontWeight: 800, color, textTransform: "uppercase"}}>
    {children}
  </div>
);

const CodePanel = ({children, style = {}}: {children: React.ReactNode; style?: React.CSSProperties}) => (
  <div style={{...card, padding: 30, fontFamily: mono, color: COLORS.text, fontSize: 25, lineHeight: 1.45, ...style}}>
    {children}
  </div>
);

const SceneVisual = ({scene, index}: {scene: SceneSpec; index: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({frame: Math.max(0, frame - 4), fps, config: {damping: 190, stiffness: 90}});
  const lift = interpolate(entrance, [0, 1], [22, 0]);
  const sceneStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    padding: "64px 90px 180px",
    boxSizing: "border-box",
    color: COLORS.text,
    fontFamily: sans,
    overflow: "hidden",
    opacity: interpolate(frame, [0, 5], [0.72, 1], {extrapolateRight: "clamp"}),
  };
  const artStyle: React.CSSProperties = {
    position: "absolute",
    left: 90,
    right: 90,
    top: 286,
    bottom: 206,
    transform: `translateY(${lift}px)`,
  };

  return (
    <div style={{...sceneStyle, background: COLORS.background}}>
      <header style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
        <div style={{display: "flex", alignItems: "center", gap: 14}}>
          <span style={{width: 14, height: 14, borderRadius: "50%", background: COLORS.cyan, boxShadow: `0 0 20px ${COLORS.cyan}`}} />
          <SmallLabel>Agent Lab · PyCon 2026</SmallLabel>
        </div>
        <div style={{fontFamily: mono, fontSize: 20, color: COLORS.muted}}>
          {String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
        </div>
      </header>

      {scene.id === "worker-diagram" ? (
        <WorkerDiagram frame={frame} durationFrames={getSceneFrames(index)} title={scene.title} />
      ) : (
        <>
          <div style={{marginTop: 98, maxWidth: 1560, transform: `translateY(${lift}px)`}}>
            <div style={{fontSize: scene.id === "thesis" ? 68 : 50, fontWeight: 850, lineHeight: 1.08, letterSpacing: -1.8}}>
              {scene.title}
            </div>
            <div style={{marginTop: 18, fontSize: 28, color: COLORS.muted, lineHeight: 1.35}}>
              {scene.subtitle}
            </div>
          </div>
          <div style={artStyle}>
            {scene.id === "thesis" && <ThesisCard />}
            {scene.id === "fixture-search" && <SearchResult />}
            {scene.id === "graph-query" && <GraphResult />}
            {scene.id === "evidence-boundary" && <EvidenceBoundary />}
            {scene.id === "takeaway" && <Takeaway />}
          </div>
        </>
      )}
    </div>
  );
};

const ThesisCard = () => (
  <div style={{...card, width: 1140, padding: 48, borderColor: "#246078", marginTop: 40}}>
    <SmallLabel>Demostración determinista</SmallLabel>
    <div style={{fontSize: 41, fontWeight: 760, lineHeight: 1.2, marginTop: 22}}>
      Del símbolo encontrado a las relaciones visibles.
    </div>
    <div style={{display: "flex", gap: 16, marginTop: 34}}>
      {["fixture público", "CLI local", "salida observable"].map((label) => (
        <span key={label} style={{border: `1px solid ${COLORS.border}`, borderRadius: 999, padding: "12px 18px", fontFamily: mono, fontSize: 19, color: COLORS.muted}}>
          {label}
        </span>
      ))}
    </div>
  </div>
);

const SearchResult = () => {
  const matches = [
    ["notes.txt", "L2", "mención en comentario"],
    ["auth.py", "L1", "def validate_user(...)"],
    ["auth.py", "L7", "authenticate → validate_user"],
    ["auth.py", "L12", "UserService.check → validate_user"],
  ];
  return (
    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26, height: "100%"}}>
      <CodePanel>
        <SmallLabel>Consulta ejecutada</SmallLabel>
        <div style={{marginTop: 30, color: COLORS.mint, fontSize: 22}}>$ pudu-ai repo search</div>
        <div style={{fontSize: 29, fontWeight: 800, marginTop: 6}}>validate_user</div>
        <div style={{fontSize: 19, color: COLORS.muted, marginTop: 18, wordBreak: "break-word"}}>
          --repo tests/fixtures/repos/python-small --json
        </div>
        <div style={{marginTop: 32, borderTop: `1px solid ${COLORS.border}`, paddingTop: 22, color: COLORS.muted}}>
          estrategia <strong style={{color: COLORS.text}}>rg</strong> · coincidencias{" "}
          <strong style={{color: COLORS.cyan}}>4</strong> · origen <strong style={{color: COLORS.mint}}>MEASURED</strong>
        </div>
      </CodePanel>
      <div style={{...card, padding: 28, display: "flex", flexDirection: "column", gap: 13}}>
        <SmallLabel color={COLORS.amber}>Coincidencias observadas</SmallLabel>
        {matches.map(([file, line, detail]) => (
          <div key={file + line} style={{display: "grid", gridTemplateColumns: "150px 72px 1fr", alignItems: "center", gap: 14, padding: "15px 12px", borderBottom: `1px solid ${COLORS.border}`}}>
            <span style={{fontFamily: mono, fontSize: 22, color: COLORS.cyan}}>{file}</span>
            <span style={{fontFamily: mono, fontSize: 19, color: COLORS.amber}}>{line}</span>
            <span style={{fontSize: 22, color: COLORS.text}}>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const GraphResult = () => (
  <div style={{...card, height: 450, padding: 34, position: "relative", overflow: "hidden"}}>
    <SmallLabel color={COLORS.mint}>Llamadas resueltas · auth.py</SmallLabel>
    <svg viewBox="0 0 1500 270" width="100%" height="290" style={{position: "absolute", top: 100, left: 45}}>
      <defs>
        <marker id="arrow" markerWidth="11" markerHeight="11" refX="8" refY="5.5" orient="auto">
          <path d="M0,0 L11,5.5 L0,11 z" fill={COLORS.cyan} />
        </marker>
      </defs>
      {[0, 1].map((row) => {
        const y = 55 + row * 118;
        return <g key={row}>
          <rect x="50" y={y} width="360" height="72" rx="16" fill="#12253a" stroke={COLORS.border} strokeWidth="2" />
          <text x="230" y={y + 45} fill={COLORS.text} fontSize="28" textAnchor="middle" fontFamily={mono}>
            {row === 0 ? "authenticate" : "UserService.check"}
          </text>
          <line x1="430" y1={y + 36} x2="1010" y2={y + 36} stroke={COLORS.cyan} strokeWidth="4" markerEnd="url(#arrow)" />
          <text x="725" y={y + 22} fill={COLORS.muted} fontSize="20" textAnchor="middle" fontFamily={mono}>RESOLVED · validate_user</text>
        </g>;
      })}
      <rect x="1040" y="110" width="400" height="84" rx="18" fill="#0c302e" stroke={COLORS.mint} strokeWidth="3" />
      <text x="1240" y="162" fill={COLORS.text} fontSize="31" fontWeight="700" textAnchor="middle" fontFamily={mono}>validate_user</text>
    </svg>
    <div style={{position: "absolute", right: 38, bottom: 26, fontFamily: mono, fontSize: 20, color: COLORS.muted}}>
      python-ast · 8 nodos · 9 aristas
    </div>
  </div>
);

const EvidenceBoundary = () => (
  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, height: "100%"}}>
    <div style={{...card, padding: 42, borderColor: "#426b65"}}>
      <SmallLabel color={COLORS.mint}>Lo que observamos</SmallLabel>
      <div style={{fontSize: 39, fontWeight: 800, lineHeight: 1.2, marginTop: 26}}>4 coincidencias literales</div>
      <div style={{fontSize: 27, color: COLORS.muted, marginTop: 15}}>Dos llamadas resueltas hacia validate_user.</div>
      <div style={{marginTop: 34, fontFamily: mono, fontSize: 21, color: COLORS.mint}}>backend: python-ast</div>
    </div>
    <div style={{...card, padding: 42, borderColor: "#694552"}}>
      <SmallLabel color={COLORS.rose}>Lo que no afirmamos</SmallLabel>
      <div style={{fontSize: 38, fontWeight: 800, lineHeight: 1.2, marginTop: 26}}>No inventamos aristas.</div>
      <div style={{fontSize: 27, color: COLORS.muted, marginTop: 15}}>Una salida estructural no garantiza verdad factual.</div>
      <div style={{marginTop: 34, fontFamily: mono, fontSize: 21, color: COLORS.amber}}>durationMs: variable</div>
    </div>
  </div>
);

const WorkerDiagram = ({frame, durationFrames, title}: {frame: number; durationFrames: number; title: string}) => {
  const zoom = interpolate(frame, [0, durationFrames], [0.92, 0.99], {extrapolateRight: "clamp"});
  const pan = interpolate(frame, [0, durationFrames], [30, -30], {extrapolateRight: "clamp"});
  return (
    <>
      <div style={{position: "absolute", top: 115, left: 90, right: 90, zIndex: 2}}>
        <div style={{fontSize: 44, fontWeight: 850}}>{title}</div>
        <div style={{fontSize: 25, color: COLORS.muted, marginTop: 10}}>Diagrama de flujo existente · vista oscura</div>
      </div>
      <div style={{position: "absolute", left: 60, right: 60, top: 250, bottom: 178, overflow: "hidden", border: `1px solid ${COLORS.border}`, borderRadius: 18, background: "#060d18"}}>
        <img
          src={staticFile("assets/worker-diagram-dark.png")}
          alt="Diagrama oscuro del trabajador local de tareas"
          style={{
            position: "absolute",
            width: 2048,
            height: 1320,
            left: "50%",
            top: -145,
            objectFit: "cover",
            transform: `translateX(calc(-50% + ${pan}px)) scale(${zoom})`,
            transformOrigin: "50% 0%",
          }}
        />
      </div>
    </>
  );
};

const Takeaway = () => (
  <div style={{...card, maxWidth: 1440, padding: 40, marginTop: 22, borderColor: "#246078"}}>
    <SmallLabel>CLI · fixture local</SmallLabel>
    <div style={{fontFamily: mono, fontSize: 29, marginTop: 20, color: COLORS.mint}}>
      pudu-ai repo search validate_user --repo tests/fixtures/repos/python-small
    </div>
    <div style={{fontSize: 34, fontWeight: 780, marginTop: 34}}>
      Primero estructura verificable. Después, mejores preguntas.
    </div>
  </div>
);

const CaptionBar = ({frame}: {frame: number}) => {
  const seconds = frame / FRAME_RATE;
  const cue = getCaptionAtTime(seconds);
  const activeIndex = CAPTIONS.indexOf(cue);
  return (
    <div style={{
      position: "absolute",
      zIndex: 20,
      left: 72,
      right: 72,
      bottom: 46,
      minHeight: 112,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "18px 42px",
      boxSizing: "border-box",
      border: "1px solid rgba(169,186,203,.48)",
      borderRadius: 20,
      background: "rgba(3,9,17,.96)",
      color: "#ffffff",
      fontFamily: sans,
      fontSize: 32,
      lineHeight: 1.26,
      fontWeight: 760,
      textAlign: "center",
      textShadow: "0 2px 2px #000",
    }}>
      <span>{cue.text}</span>
      <div style={{position: "absolute", height: 4, left: 18, right: 18, bottom: 8, display: "flex", gap: 4}}>
        {CAPTIONS.map((caption, index) => (
          <div key={caption.startSeconds} style={{flex: caption.endSeconds - caption.startSeconds, borderRadius: 8, background: index <= activeIndex ? COLORS.cyan : "#344254"}} />
        ))}
      </div>
    </div>
  );
};

export const PyConAgentLab = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scenes = SCENES.flatMap((scene, index) => {
    const sequence = (
      <TransitionSeries.Sequence key={scene.id} durationInFrames={getSceneFrames(index)}>
        <SceneVisual scene={scene} index={index} />
      </TransitionSeries.Sequence>
    );
    if (index === SCENES.length - 1) return [sequence];
    return [sequence, (
      <TransitionSeries.Transition
        key={"transition-" + scene.id}
        presentation={index === 2 ? slide({direction: "from-right"}) : fade()}
        timing={index === 4
          ? springTiming({durationInFrames: TRANSITION_FRAMES, config: {damping: 200}})
          : linearTiming({durationInFrames: TRANSITION_FRAMES})}
      />
    )];
  });

  return (
    <div style={{width: WIDTH, height: HEIGHT, background: COLORS.background, overflow: "hidden", position: "relative"}}>
      <TransitionSeries>{scenes}</TransitionSeries>
      <div style={{position: "absolute", zIndex: 20, left: 0, right: 0, top: 0, height: 5, background: "#172536"}}>
        <div style={{width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: COLORS.cyan}} />
      </div>
      <CaptionBar frame={frame} />
    </div>
  );
};
