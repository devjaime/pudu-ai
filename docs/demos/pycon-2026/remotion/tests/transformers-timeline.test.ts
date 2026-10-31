import {describe, expect, it} from "vitest";
import {
  CAPTIONS, FRAME_RATE, HEIGHT, isTransitionLegal, SCENES,
  TOTAL_DURATION_SECONDS, TOTAL_FRAMES, WIDTH, getSceneAtTime, PINNED_REVISION,
} from "../src/transformersTimeline";

describe("Transformers PyCon timeline contract", () => {
  it("is exactly 90 seconds at 1920x1080 and 30fps", () => {
    expect([WIDTH, HEIGHT, FRAME_RATE, TOTAL_DURATION_SECONDS, TOTAL_FRAMES]).toEqual([1920, 1080, 30, 90, 2700]);
  });

  it("orders an evidence-safe story and uses legal transitions", () => {
    expect(SCENES.map(({id}) => id)).toEqual([
      "thesis", "search-problem", "ast-evidence", "candidate-graph", "bounded-context",
      "model-roles", "verification", "limitations", "takeaway",
    ]);
    expect(SCENES.reduce((sum, scene) => sum + scene.durationSeconds, 0)).toBe(90);
    expect(isTransitionLegal(15, 7)).toBe(true);
    expect(isTransitionLegal(106, 7)).toBe(false);
  });

  it("includes pinned evidence and explicitly labels unrun stages", () => {
    const content = SCENES.map(({title, subtitle}) => `${title} ${subtitle}`).join(" ") + PINNED_REVISION;
    for (const claim of ["v5.20.2", "18329f1065382e54db698e242cf98bd3f3e5a766", "13 archivos", "3.682 bytes", "816.502 bytes", "99,55%", "NOT_RUN", "no son tokens ni equivalencia semántica"]) {
      expect(content).toContain(claim);
    }
    expect(content).toContain("AST");
    expect(content).toContain("candidato");
    expect(content).not.toContain("ripgrep ejecutado");
  });

  it("keeps Spanish captions ordered, non-overlapping and bounded to the runtime", () => {
    expect(CAPTIONS[0]?.startSeconds).toBe(0);
    expect(CAPTIONS.at(-1)?.endSeconds).toBe(TOTAL_DURATION_SECONDS);
    for (let index = 0; index < CAPTIONS.length; index += 1) {
      const cue = CAPTIONS[index]!;
      expect(cue.endSeconds).toBeGreaterThan(cue.startSeconds);
      expect(cue.startSeconds).toBeGreaterThanOrEqual(0);
      expect(cue.endSeconds).toBeLessThanOrEqual(TOTAL_DURATION_SECONDS);
      if (index) expect(cue.startSeconds).toBeGreaterThanOrEqual(CAPTIONS[index - 1]!.endSeconds);
    }
  });

  it("aligns each caption's meaning with its visual scene window", () => {
    const expected = ["thesis", "search-problem", "ast-evidence", "candidate-graph", "bounded-context", "model-roles", "verification", "limitations", "takeaway"];
    expect(CAPTIONS.map((cue) => cue.sceneId)).toEqual(expected);
    for (const cue of CAPTIONS) {
      const midpoint = (cue.startSeconds + cue.endSeconds) / 2;
      expect(getSceneAtTime(midpoint).id).toBe(cue.sceneId);
      expect(getSceneAtTime(cue.startSeconds).id).toBe(cue.sceneId);
      expect(getSceneAtTime(cue.endSeconds - 0.001).id).toBe(cue.sceneId);
    }
  });

  it("keeps the VTT synchronized with the burned-in captions", async () => {
    const {readFile} = await import("node:fs/promises");
    const source = await readFile(new URL("../../transformers-demo.captions.es.vtt", import.meta.url), "utf8");
    const cues = [...source.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\n([^\n]+)/g)];
    expect(source.startsWith("WEBVTT")).toBe(true);
    expect(cues).toHaveLength(CAPTIONS.length);
    expect(cues.at(-1)?.[2]).toBe("00:01:30.000");
    expect(cues.map((cue) => cue[3])).toEqual(CAPTIONS.map((cue) => cue.text));
    const timestamp = (seconds:number) => `00:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.000`;
    expect(cues.map((cue) => [cue[1], cue[2]])).toEqual(CAPTIONS.map(({startSeconds, endSeconds}) => [timestamp(startSeconds), timestamp(endSeconds)]));
  });

  it("uses neutral Spanish in captions and on-screen copy", async () => {
    const {readFile} = await import("node:fs/promises");
    const component = await readFile(new URL("../src/PyConTransformersDemo.tsx", import.meta.url), "utf8");
    const copy = [component, ...CAPTIONS.map((cue) => cue.text), ...SCENES.map(({title, subtitle}) => `${title} ${subtitle}`)].join("\n");
    expect(copy).not.toMatch(/Validá/);
    expect(CAPTIONS.at(-1)?.text).toContain("Valide rutas concretas");
  });
});
