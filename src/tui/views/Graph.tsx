import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { buildRepoGraph } from "../../agent-lab/graph.js";
import { pickHarnessModel } from "../../agent-lab/harness.js";
import type { CodeGraph } from "../../agent-lab/types.js";
import { t } from "../../i18n/index.js";
import type { HarnessLaunchRequest } from "../../integrations/harness-launch.js";
import type { IntegrationId } from "../../integrations/types.js";
import type { Session } from "../../session/load.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

type Phase = "build" | "prompt" | "pick" | "error";

const TOOLS: Array<{ key: string; id: IntegrationId; label: string }> = [
  { key: "1", id: "opencode", label: "OpenCode" },
  { key: "2", id: "hermes", label: "Hermes" },
  { key: "3", id: "openclaw", label: "OpenClaw" },
];

export function GraphView(props: {
  session: Session;
  onLaunch: (req: HarnessLaunchRequest) => void;
}): ReactElement {
  const [phase, setPhase] = useState<Phase>("build");
  const [graph, setGraph] = useState<CodeGraph | undefined>();
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const repo = process.cwd();

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const result = await buildRepoGraph(repo);
        if (!live) return;
        setGraph(result);
        setPhase("prompt");
      } catch (err) {
        if (!live) return;
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      }
    })();
    return () => {
      live = false;
    };
  }, [repo]);

  const pick = useMemo(() => (graph ? pickHarnessModel(props.session, graph.effort) : undefined), [graph, props.session]);

  useInput((input, key) => {
    if (phase === "prompt") {
      if (key.return) {
        setPhase("pick");
        return;
      }
      if (key.backspace || key.delete) {
        setPrompt((value) => value.slice(0, -1));
        return;
      }
      if (input && !key.ctrl && !key.meta && input !== "\t") {
        setPrompt((value) => `${value}${input}`.slice(0, 240));
      }
      return;
    }
    if (phase !== "pick" || !pick?.modelId) return;
    const tool = TOOLS.find((item) => item.key === input)?.id ?? (key.return ? "opencode" : undefined);
    if (!tool) return;
    if (!pick.ollamaTag) {
      setError(t("repoHarnessNoTag"));
      setPhase("error");
      return;
    }
    props.onLaunch({
      tool,
      repo,
      task: prompt,
      modelId: pick.modelId,
      ollamaTag: pick.ollamaTag,
    });
  });

  if (phase === "build") {
    return (
      <Panel title={t("repoGraphTitle")} color="magenta">
        <Text>{t("repoGraphBuilding")}</Text>
        <Text dimColor>{repo}</Text>
      </Panel>
    );
  }

  if (phase === "error") {
    return (
      <Panel title={t("repoGraphTitle")} color="magenta">
        <Text color="red">{error}</Text>
      </Panel>
    );
  }

  if (!graph) return <Text> </Text>;

  const degree = new Map<string, number>();
  for (const edge of graph.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
  }
  const top = [...graph.nodes]
    .filter((node) => node.type === "file" || node.type === "function" || node.type === "test")
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .slice(0, 8);

  return (
    <>
      <Panel title={t("repoGraphTitle")} color="magenta">
        <Text dimColor>{fit(graph.repo, 80)}</Text>
        <Text>
          {t("repoGraphFiles")} {graph.metrics.fileCount}  {t("repoGraphNodes")} {graph.metrics.nodeCount}  {t("repoGraphEdges")}{" "}
          {graph.metrics.edgeCount}  ({graph.metrics.origin})
        </Text>
        {top.map((node) => (
          <Box key={node.id}>
            <Text color="cyan">{fit(node.file ?? node.name, 36)}</Text>
            <Text>  {fit(node.name, 18)}  </Text>
            <Text dimColor>{degree.get(node.id) ?? 0}</Text>
          </Box>
        ))}
        {!top.length ? <Text dimColor>{t("repoGraphEmpty")}</Text> : null}
      </Panel>
      <Panel title={t("repoEffortTitle")} color="yellow">
        <Text>
          {graph.effort.label}  {graph.effort.score0to100}/100  ({graph.effort.origin})
        </Text>
        <Text dimColor>
          {t("repoTokens")} {graph.metrics.tokenEstimate ?? "N/A"} ({graph.metrics.tokenOrigin ?? "N/A"})
        </Text>
      </Panel>
      {phase === "prompt" ? (
        <Panel title={t("repoHarnessPrompt")} color="blue">
          <Text>
            {prompt || t("repoHarnessPromptHint")}
            <Text color="cyan">▍</Text>
          </Text>
          <Text dimColor>{t("repoHarnessEnter")}</Text>
        </Panel>
      ) : (
        <Panel title={t("repoHarnessModel")} color="green">
          <Text dimColor>{prompt || t("repoHarnessNoPrompt")}</Text>
          {pick?.modelName ? (
            <Text>
              {pick.modelName}  {pick.ollamaTag ?? "—"}  {pick.grade ?? "—"}  {pick.measuredTps != null ? `${pick.measuredTps} t/s` : t("notTested")}
            </Text>
          ) : (
            <Text color="yellow">{pick?.reason ?? "N/A"}</Text>
          )}
          <Text dimColor>{pick?.reason}</Text>
          {pick?.ollamaTag ? <Text color="cyan">{t("repoHarnessKeys")}</Text> : <Text color="yellow">{t("repoHarnessNoTag")}</Text>}
        </Panel>
      )}
    </>
  );
}
