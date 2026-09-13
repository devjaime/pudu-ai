import { Box, Text, useInput } from "ink";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { buildRepoGraph } from "../../agent-lab/graph.js";
import { pickHarnessModel } from "../../agent-lab/harness.js";
import type { CodeGraph } from "../../agent-lab/types.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { Panel } from "../layout.js";
import { fit } from "../width.js";

type Phase = "build" | "prompt" | "done" | "error";

export function GraphView({ session }: { session: Session }): ReactElement {
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

  useInput((input, key) => {
    if (phase !== "prompt") return;
    if (key.return) {
      setPhase("done");
      return;
    }
    if (key.backspace || key.delete) {
      setPrompt((value) => value.slice(0, -1));
      return;
    }
    if (input && !key.ctrl && !key.meta && input !== "\t") {
      setPrompt((value) => `${value}${input}`.slice(0, 240));
    }
  });

  const pick = useMemo(() => (graph ? pickHarnessModel(session, graph.effort) : undefined), [graph, session]);

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
              {pick.modelName}  {pick.grade ?? "—"}  {pick.measuredTps != null ? `${pick.measuredTps} t/s` : t("notTested")}
            </Text>
          ) : (
            <Text color="yellow">{pick?.reason ?? "N/A"}</Text>
          )}
          <Text dimColor>{pick?.reason}</Text>
        </Panel>
      )}
    </>
  );
}
