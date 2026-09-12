export type MetricOrigin = "MEASURED" | "ESTIMATED" | "DERIVED";

export type SearchIntent = "TEXT" | "STRUCTURAL" | "RELATIONSHIP" | "IMPACT" | "SEMANTIC" | "UNKNOWN";

export type SearchStrategy = "rg" | "ast-grep" | "graph" | "hybrid";

export type AgentRole = "scout" | "graph" | "context" | "builder" | "verifier";

export type ToolAvailability = {
  available: boolean;
  path: string | null;
  version: string | null;
};

export type SearchMatch = {
  file: string;
  line: number | null;
  column: number | null;
  endLine: number | null;
  endColumn: number | null;
  text: string;
  strategy: "rg" | "ast-grep";
  language: string | null;
  metavariables: Record<string, string>;
};

export type SearchResult = {
  schemaVersion: 1;
  ok: boolean;
  op: "search";
  repo: string;
  query: string | null;
  structuralPattern: string | null;
  intent: SearchIntent;
  strategy: SearchStrategy;
  matches: SearchMatch[];
  tools: {
    rg: ToolAvailability;
    astGrep: ToolAvailability;
    graph: ToolAvailability;
  };
  errors: Array<{ tool: string; message: string; origin: MetricOrigin }>;
  metrics: {
    durationMs: number;
    matchCount: number;
    rgQueries: number;
    astQueries: number;
    graphQueries: number;
    origin: MetricOrigin;
  };
  unavailable: string[];
};

export type ContextPackSymbol = {
  name: string;
  file: string;
  line: number | null;
  endLine: number | null;
  kind: string | null;
};

export type ContextPackFile = {
  path: string;
  startLine: number | null;
  endLine: number | null;
  reason: string | null;
  tokenEstimate: number | null;
  tokenOrigin: MetricOrigin | null;
};

export type ContextPack = {
  schemaVersion: 1;
  task: string;
  strategy: SearchStrategy;
  symbols: ContextPackSymbol[];
  files: ContextPackFile[];
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    confidence: "EXTRACTED" | "RESOLVED" | "INFERRED";
  }>;
  tests: ContextPackFile[];
  tokenEstimate: number | null;
  tokenOrigin: MetricOrigin | null;
  contextWindow: number | null;
  contextUtilization: number | null;
  searchTrace: SearchResult[];
};

export type AgentRun = {
  role: AgentRole;
  model: string | null;
  startedAt: string;
  endedAt: string | null;
  toolCalls: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  contextWindow: number | null;
  contextUtilizationPct: number | null;
  editedFiles: string[];
  status: "ok" | "error" | "skipped";
  error: string | null;
};

export type TaskTrace = {
  schemaVersion: 1;
  taskId: string;
  sessionId: string | null;
  repository: string;
  gitCommit: string | null;
  task: string;
  startedAt: string;
  endedAt: string | null;
  strategy: SearchStrategy;
  agents: AgentRun[];
  models: Array<{ agent: AgentRole | string; model: string | null }>;
  search: {
    rgQueries: number | null;
    astQueries: number | null;
    graphQueries: number | null;
  };
  context: {
    repositoryEstimatedTokens: number | null;
    selectedTokens: number | null;
    contextWindow: number | null;
    utilizationPct: number | null;
    reductionPct: number | null;
    origin: MetricOrigin | null;
  };
  llm: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    origin: MetricOrigin | null;
  };
  tools: {
    calls: number | null;
    failures: number | null;
  };
  execution: {
    wallTimeMs: number | null;
    retries: number | null;
  };
  files: {
    searched: number | null;
    opened: number | null;
    edited: number | null;
  };
  verification: {
    testsTotal: number | null;
    testsPassed: number | null;
    lintPassed: boolean | null;
    buildPassed: boolean | null;
  };
};

export type TaskEffortLabel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type TaskMetrics = {
  schemaVersion: 1;
  taskScore: number | null;
  taskScoreOrigin: MetricOrigin | null;
  dimensions: {
    verificationSuccess: number | null;
    taskRubric: number | null;
    contextEfficiency: number | null;
    toolEfficiency: number | null;
    retryPenalty: number | null;
  };
  effort: {
    label: TaskEffortLabel | null;
    score0to100: number | null;
    origin: "DERIVED" | null;
    humanBaselineMinutes: number | null;
    agentRuntimeMinutes: number | null;
    humanInterventionMinutes: number | null;
    potentialTimeReductionPct: number | null;
  };
  contextWindow: {
    window: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    usedTokens: number | null;
    utilizationPct: number | null;
    remainingTokens: number | null;
    origin: MetricOrigin | null;
  };
};
