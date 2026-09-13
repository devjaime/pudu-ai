import { Box, Text } from "ink";
import type { ReactElement, ReactNode } from "react";
import { t } from "../i18n/index.js";
import { useCols } from "./width.js";

const NAV: Array<{ key: string; label: string; color: "yellow" | "green" | "cyan" | "magenta" | "blue" | "red" | "white" }> = [
  { key: "S", label: "Setup", color: "yellow" },
  { key: "B", label: "Bench", color: "green" },
  { key: "M", label: "Models", color: "cyan" },
  { key: "R", label: "Rec", color: "magenta" },
  { key: "T", label: "Tasks", color: "blue" },
  { key: "G", label: "Graph", color: "magenta" },
  { key: "H", label: "HW", color: "white" },
  { key: "C", label: "Cmp", color: "green" },
  { key: "L", label: "Log", color: "cyan" },
  { key: "Q", label: "Quit", color: "red" },
];

export function Frame({ children }: { children: ReactNode }): ReactElement {
  const cols = useCols();
  return (
    <Box flexDirection="column" width={cols} paddingX={1} paddingY={0}>
      {children}
    </Box>
  );
}

export function Header(): ReactElement {
  const cols = useCols();
  const compact = cols < 72;
  return (
    <Box flexDirection="column" marginBottom={1} width={cols}>
      <Box
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Text bold color="cyan">
            {t("appTitle")}
          </Text>
          <Text dimColor>  {t("appSubtitle")}</Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap">
          {NAV.map((item) => (
            <Box key={item.key} marginRight={compact ? 1 : 2}>
              <Text color={item.color} bold>
                [{item.key}]
              </Text>
              {compact ? null : <Text dimColor> {item.label}</Text>}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function Panel(props: {
  title: string;
  color?: "cyan" | "magenta" | "yellow" | "green" | "blue";
  children: ReactNode;
}): ReactElement {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={props.color ?? "cyan"}
      paddingX={1}
      marginBottom={1}
    >
      <Text bold color={props.color ?? "cyan"}>
        {props.title}
      </Text>
      {props.children}
    </Box>
  );
}

export function Kv(props: {
  label: string;
  value: string;
  color?: "cyan" | "green" | "yellow" | "magenta" | "red" | "white";
}): ReactElement {
  return (
    <Box>
      <Box width={16}>
        <Text dimColor>{props.label}</Text>
      </Box>
      <Text color={props.color}>{props.value}</Text>
    </Box>
  );
}
