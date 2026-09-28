// Runs the stage list through one engine FilterSession. A session processes one frame at a
// time; the renderer (ui/useRenderer.js) serialises calls.
import { createFilterSession, glAvailable } from "@gyng/ditherer-filters";
import { resolveOptions } from "./keyframes.js";

export const createPipeline = () => {
  const session = createFilterSession([], {
    wasmAcceleration: true,
    webglAcceleration: glAvailable(),
  });

  return {
    async render({ input, stages, t, frameIndex, animating }) {
      session.setChain(
        stages.map((s) => ({
          id: s.id,
          filter: s.filter,
          displayName: s.displayName,
          enabled: s.enabled,
          options: resolveOptions(s, t),
        })),
      );
      const result = await session.process(input, {
        frameIndex,
        isAnimating: animating,
        hasVideoInput: animating,
        retainStepCanvases: false,
      });
      return result.canvas;
    },
    resetTemporal: () => session.reset(),
    dispose: () => session.dispose(),
  };
};
