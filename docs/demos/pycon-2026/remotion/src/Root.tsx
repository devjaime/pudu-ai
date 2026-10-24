import {Composition} from "remotion";
import {PyConAgentLab} from "./PyConAgentLab";
import {FRAME_RATE, HEIGHT, TOTAL_FRAMES, WIDTH} from "./timeline";
import {PyConTransformersDemo} from "./PyConTransformersDemo";
import {FRAME_RATE as TRANSFORMERS_FPS, HEIGHT as TRANSFORMERS_HEIGHT, TOTAL_FRAMES as TRANSFORMERS_FRAMES, WIDTH as TRANSFORMERS_WIDTH} from "./transformersTimeline";

export const RemotionRoot = () => (
  <>
    <Composition
      id="PyConAgentLab"
      component={PyConAgentLab}
      durationInFrames={TOTAL_FRAMES}
      fps={FRAME_RATE}
      width={WIDTH}
      height={HEIGHT}
    />
    <Composition
      id="PyConTransformersDemo"
      component={PyConTransformersDemo}
      durationInFrames={TRANSFORMERS_FRAMES}
      fps={TRANSFORMERS_FPS}
      width={TRANSFORMERS_WIDTH}
      height={TRANSFORMERS_HEIGHT}
    />
  </>
);
