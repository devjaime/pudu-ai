import type { MessageId } from "../i18n/en.js";

export const WORK_KINDS = ["code", "video", "image", "transcription", "chat"] as const;
export type WorkKind = (typeof WORK_KINDS)[number];

export type TaskScope = "installed" | "all";
export type TaskPriority = "speed" | "balanced" | "quality";

export type TaskAnswers = {
  kinds: WorkKind[];
  scope: TaskScope;
  priority: TaskPriority;
};

export type TaskDef = {
  id: string;
  kind: WorkKind;
  useCases: string[];
  titleKey: MessageId;
  promptKey: MessageId;
  harnessId: string;
};

export type ModelTaskPlan = {
  modelId: string;
  modelName: string;
  installed: boolean;
  origin: "measured" | "estimated";
  grade?: string;
  kinds: WorkKind[];
  tasks: Array<{
    id: string;
    harnessId: string;
    kind: WorkKind;
    title: string;
    prompt: string;
  }>;
};
