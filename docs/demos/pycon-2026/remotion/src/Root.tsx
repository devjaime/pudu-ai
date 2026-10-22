import {Composition} from "remotion";
import {PyConAgentLab} from "./PyConAgentLab";
import {FRAME_RATE, HEIGHT, TOTAL_FRAMES, WIDTH} from "./timeline";

export const RemotionRoot = () => (
  <Composition
    id="PyConAgentLab"
    component={PyConAgentLab}
    durationInFrames={TOTAL_FRAMES}
    fps={FRAME_RATE}
    width={WIDTH}
    height={HEIGHT}
  />
);
