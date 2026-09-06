import { Box, Text, useApp, useInput } from "ink";
import { useMemo, useState, type ReactElement } from "react";
import type { Session } from "../session/load.js";
import { Dashboard } from "./views/Dashboard.js";
import { ModelsView } from "./views/Models.js";
import { HardwareView } from "./views/Hardware.js";
import { RecommendView } from "./views/Recommend.js";
import { CompareView } from "./views/Compare.js";
import { BenchmarkView } from "./views/Benchmark.js";

type Screen = "home" | "models" | "hardware" | "recommend" | "compare" | "benchmark";

export function App(props: { session: Session; preset?: string }): ReactElement {
  const { exit } = useApp();
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState(0);
  const benchable = useMemo(
    () => props.session.models.filter((m) => Boolean(m.artifactPath)),
    [props.session.models],
  );

  useInput((input, key) => {
    if (screen === "benchmark") return;
    const letter = input.toLowerCase();
    if (letter === "q" || key.escape) exit();
    if (letter === "b") setScreen("benchmark");
    if (letter === "m") setScreen("models");
    if (letter === "r") setScreen("recommend");
    if (letter === "h") setScreen("hardware");
    if (letter === "c") setScreen("compare");
    if (key.return && screen === "home") setScreen("benchmark");
  });

  return (
    <Box flexDirection="column" padding={1}>
      {screen === "home" && <Dashboard session={props.session} />}
      {screen === "models" && <ModelsView session={props.session} />}
      {screen === "hardware" && <HardwareView session={props.session} />}
      {screen === "recommend" && <RecommendView session={props.session} />}
      {screen === "compare" && <CompareView session={props.session} />}
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
      {screen !== "benchmark" && (
        <Box marginTop={1}>
          <Text dimColor>[B] Benchmark  [M] Models  [R] Recommend  [H] Hardware  [C] Compare  [Q] Quit</Text>
        </Box>
      )}
    </Box>
  );
}
