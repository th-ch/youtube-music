import { createBackend } from "@/utils";

import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

export const backend = createBackend({
  async start({ ipc }) {
    const kuroshiro = new Kuroshiro.default();
    {
      await kuroshiro.init(new KuromojiAnalyzer());
    }

    ipc.handle("synced-lyrics:romanize-line", async (line: string) => {
      let out = line;

      if (Kuroshiro.default.Util.hasJapanese(line)) {
        out = await kuroshiro.convert(line, {
          to: "romaji",
          mode: "spaced",
        });
      }

      return out;
    });
  },
});
