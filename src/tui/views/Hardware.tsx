import { Text } from "ink";
import type { ReactElement } from "react";
import { formatBytes } from "../../shared/bytes.js";
import { memoryLabel } from "../../hardware/types.js";
import { t } from "../../i18n/index.js";
import type { Session } from "../../session/load.js";
import { Kv, Panel } from "../layout.js";

export function HardwareView({ session }: { session: Session }): ReactElement {
  const h = session.hardware;
  const ram = formatBytes(h.memory.totalBytes, 0);
  const avail = h.memory.availableBytes ? formatBytes(h.memory.availableBytes) : "N/A";
  return (
    <>
      <Panel title={t("machine")}>
        <Kv label="Model" value={h.machineModel ?? t("unknownMachine")} />
        <Kv label="CPU" value={h.cpu.name ?? t("cpuNa")} />
        <Kv
          label="Cores"
          value={`${h.cpu.physicalCores ?? "N/A"}  (${h.cpu.performanceCores ?? "?"}P / ${h.cpu.efficiencyCores ?? "?"}E)`}
        />
        <Kv label="GPU" value={h.gpu.name ?? "N/A"} />
        <Kv label={memoryLabel(h)} value={ram} color="cyan" />
        <Kv label="Available" value={avail} />
        <Kv label="OS" value={`${h.os} ${h.osVersion ?? h.arch}`} />
      </Panel>
      <Panel title={t("runtimes")} color="green">
        {session.runtimes.map((r) => (
          <Kv
            key={r.id}
            label={r.label}
            value={r.detected ? r.version ?? t("detected") : t("notDetected")}
            color={r.detected ? "green" : undefined}
          />
        ))}
      </Panel>
      <Text color="yellow">{t("hardwareHint")}</Text>
    </>
  );
}
