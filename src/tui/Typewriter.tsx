import { Text } from "ink";
import { useEffect, useState, type ReactElement } from "react";

const finished = new Set<string>();

export function Typewriter(props: {
  text: string;
  ms?: number;
  color?: string;
  dimColor?: boolean;
  bold?: boolean;
  once?: boolean;
}): ReactElement {
  const start = props.once && finished.has(props.text) ? props.text.length : 0;
  const [n, setN] = useState(start);
  useEffect(() => {
    if (props.once && finished.has(props.text)) {
      setN(props.text.length);
      return;
    }
    setN(0);
  }, [props.text, props.once]);
  useEffect(() => {
    if (n >= props.text.length) return;
    const timer = setTimeout(() => {
      setN((v) => {
        const next = v + 1;
        if (props.once && next >= props.text.length) finished.add(props.text);
        return next;
      });
    }, props.ms ?? 16);
    return () => clearTimeout(timer);
  }, [n, props.text, props.ms, props.once]);
  const done = n >= props.text.length;
  return (
    <Text color={props.color} dimColor={props.dimColor} bold={props.bold}>
      {props.text.slice(0, n)}
      {done ? null : (
        <Text color="cyan" bold>
          ▍
        </Text>
      )}
    </Text>
  );
}
