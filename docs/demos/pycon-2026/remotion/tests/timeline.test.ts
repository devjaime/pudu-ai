import {describe, expect, it} from "vitest";
import {
  CAPTIONS,
  FRAME_RATE,
  HEIGHT,
  isTransitionLegal,
  getSceneFrames,
  SCENES,
  TOTAL_DURATION_SECONDS,
  TOTAL_FRAMES,
  TRANSITION_FRAMES,
  WIDTH,
} from "../src/timeline";

describe("PyCon demo timeline", () => {
  it("defines the requested 90-second 1080p30 canvas", () => {
    expect([WIDTH, HEIGHT, FRAME_RATE, TOTAL_DURATION_SECONDS, TOTAL_FRAMES]).toEqual([1920, 1080, 30, 90, 2700]);
  });

  it("uses legal transitions and keeps the six storyboard sections in order", () => {
    expect(TRANSITION_FRAMES).toBeGreaterThan(0);
    expect(TRANSITION_FRAMES).toBeLessThanOrEqual(Math.min(...SCENES.map((scene) => scene.durationSeconds * FRAME_RATE / 2)));
    expect(SCENES.map((scene) => scene.id)).toEqual([
      "thesis", "fixture-search", "graph-query", "evidence-boundary", "worker-diagram", "takeaway",
    ]);
    expect(SCENES.map((scene) => scene.durationSeconds)).toEqual([7, 18, 20, 17, 20, 8]);
    expect(SCENES.reduce((sum, scene) => sum + scene.durationSeconds, 0)).toBe(TOTAL_DURATION_SECONDS);
    expect(SCENES.reduce((sum, _scene, index) => sum + getSceneFrames(index), 0) - (SCENES.length - 1) * TRANSITION_FRAMES).toBe(TOTAL_FRAMES);
    expect(isTransitionLegal(TRANSITION_FRAMES, 7)).toBe(true);
    expect(isTransitionLegal(106, 7)).toBe(false);
    expect(isTransitionLegal(0, 7)).toBe(false);
  });

  it("keeps Spanish captions ordered, contained, and aligned to the timeline", () => {
    expect(CAPTIONS.length).toBeGreaterThanOrEqual(6);
    expect(CAPTIONS[0]?.startSeconds).toBe(0);
    expect(CAPTIONS.at(-1)?.endSeconds).toBe(TOTAL_DURATION_SECONDS);
    for (let index = 0; index < CAPTIONS.length; index += 1) {
      const cue = CAPTIONS[index]!;
      expect(cue.endSeconds).toBeGreaterThan(cue.startSeconds);
      expect(cue.startSeconds).toBeGreaterThanOrEqual(0);
      expect(cue.endSeconds).toBeLessThanOrEqual(TOTAL_DURATION_SECONDS);
      if (index > 0) {
        expect(cue.startSeconds).toBeGreaterThanOrEqual(CAPTIONS[index - 1]!.endSeconds);
      }
    }
  });

  it("includes code-backed fixture and evidence-boundary content", () => {
    const text = SCENES.map((scene) => scene.title + scene.subtitle).join(" ");
    expect(text).toContain("validate_user");
    expect(text).toContain("python-small");
    expect(text).toContain("No inventamos");
    expect(text).toContain("variar");
  });
});


describe("WebVTT sidecar", () => {
  it("matches the ordered captions and ends at 90 seconds", async () => {
    const {readFile} = await import("node:fs/promises");
    const source = await readFile(new URL("../../captions.es.vtt", import.meta.url), "utf8");
    const cues = [...source.matchAll(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\n([^\n]+)/g)];
    expect(source.startsWith("WEBVTT")).toBe(true);
    expect(cues).toHaveLength(CAPTIONS.length);
    expect(cues.at(-1)?.[2]).toBe("00:01:30.000");
    expect(cues.map((cue) => cue[3])).toEqual(CAPTIONS.map((cue) => cue.text));
  });
});
