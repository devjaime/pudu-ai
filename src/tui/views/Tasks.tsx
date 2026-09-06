import { Box, Text, useInput } from "ink";
import { useMemo, useState, type ReactElement } from "react";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { planTasks, tasksText } from "../../tasks/plan.js";
import { WORK_KINDS, type TaskPriority, type TaskScope, type WorkKind } from "../../tasks/types.js";

const KIND_LABEL: Record<WorkKind, "tasksOptCode" | "tasksOptVideo" | "tasksOptImage" | "tasksOptTranscription" | "tasksOptChat"> =
  {
    code: "tasksOptCode",
    video: "tasksOptVideo",
    image: "tasksOptImage",
    transcription: "tasksOptTranscription",
    chat: "tasksOptChat",
  };

export function TasksView({ session }: { session: Session }): ReactElement {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [cursor, setCursor] = useState(0);
  const [kinds, setKinds] = useState<WorkKind[]>(["code", "chat"]);
  const [scope, setScope] = useState<TaskScope>("installed");
  const [priority, setPriority] = useState<TaskPriority>("balanced");

  const plans = useMemo(
    () => planTasks(session, { kinds, scope, priority }),
    [session, kinds, scope, priority],
  );

  useInput((input, key) => {
    if (step === 0) {
      if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
      if (key.downArrow) setCursor((c) => Math.min(WORK_KINDS.length - 1, c + 1));
      if (input === " " || input === "x") {
        const kind = WORK_KINDS[cursor];
        if (!kind) return;
        setKinds((current) =>
          current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind],
        );
      }
      if (key.return && kinds.length) setStep(1);
    } else if (step === 1) {
      if (key.upArrow || key.downArrow) setScope((s) => (s === "installed" ? "all" : "installed"));
      if (key.return) setStep(2);
    } else if (step === 2) {
      const order: TaskPriority[] = ["speed", "balanced", "quality"];
      if (key.upArrow) setPriority(order[Math.max(0, order.indexOf(priority) - 1)] ?? "speed");
      if (key.downArrow) setPriority(order[Math.min(2, order.indexOf(priority) + 1)] ?? "quality");
      if (key.return) setStep(3);
    }
  });

  if (step === 3) {
    return (
      <Box flexDirection="column">
        <Text>{tasksText(plans, { kinds, scope, priority })}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        {t("tasksTitle")}
      </Text>
      {step === 0 && (
        <>
          <Text>{t("tasksQ1")}</Text>
          {WORK_KINDS.map((kind, i) => (
            <Text key={kind} color={i === cursor ? "cyan" : undefined}>
              {i === cursor ? "❯ " : "  "}
              [{kinds.includes(kind) ? "x" : " "}] {t(KIND_LABEL[kind])}
            </Text>
          ))}
        </>
      )}
      {step === 1 && (
        <>
          <Text>{t("tasksQ2")}</Text>
          <Text color={scope === "installed" ? "cyan" : undefined}>
            {scope === "installed" ? "❯ " : "  "}
            {t("tasksOptInstalled")}
          </Text>
          <Text color={scope === "all" ? "cyan" : undefined}>
            {scope === "all" ? "❯ " : "  "}
            {t("tasksOptAll")}
          </Text>
        </>
      )}
      {step === 2 && (
        <>
          <Text>{t("tasksQ3")}</Text>
          {(["speed", "balanced", "quality"] as const).map((item) => (
            <Text key={item} color={priority === item ? "cyan" : undefined}>
              {priority === item ? "❯ " : "  "}
              {item === "speed" ? t("tasksOptSpeed") : item === "quality" ? t("tasksOptQuality") : t("tasksOptBalanced")}
            </Text>
          ))}
        </>
      )}
    </Box>
  );
}
