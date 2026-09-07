import { Box, useApp, useInput } from "ink";
import { useMemo, useRef, useState, type ReactElement } from "react";
import type { Session } from "../session/load.js";
import { Dashboard } from "./views/Dashboard.js";
import { ModelsView } from "./views/Models.js";
import { HardwareView } from "./views/Hardware.js";
import { RecommendView } from "./views/Recommend.js";
import { CompareView } from "./views/Compare.js";
import { BenchmarkView } from "./views/Benchmark.js";
import { HistoryView } from "./views/History.js";
import { TasksView } from "./views/Tasks.js";
import { handleAppKey, type Screen } from "./keys.js";
import { Chrome } from "./Welcome.js";

export function App(props: { session: Session; preset?: string; start?: Screen }): ReactElement {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>(props.start ?? "home");
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const [selected, setSelected] = useState(0);
  const benchable = useMemo(
    () => props.session.models.filter((m) => Boolean(m.artifactPath)),
    [props.session.models],
  );

  useInput((input, key) => {
    const result = handleAppKey(screenRef.current, input, key);
    if (result.type === "quit") exit();
    if (result.type === "home") setScreen("home");
    if (result.type === "screen") setScreen(result.screen);
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {screen !== "benchmark" && <Chrome />}
      {screen === "home" && <Dashboard session={props.session} />}
      {screen === "models" && <ModelsView session={props.session} />}
      {screen === "hardware" && <HardwareView session={props.session} />}
      {screen === "recommend" && <RecommendView session={props.session} />}
      {screen === "compare" && <CompareView session={props.session} />}
      {screen === "history" && <HistoryView session={props.session} />}
      {screen === "tasks" && <TasksView session={props.session} />}
      {screen === "benchmark" && (
        <BenchmarkView
          session={props.session}
          models={benchable}
          selected={selected}
          setSelected={setSelected}
          preset={props.preset}
          onBack={() => setScreen("home")}
        />
      )}
    </Box>
  );
}
