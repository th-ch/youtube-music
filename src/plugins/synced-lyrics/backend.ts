import { createBackend } from "@/utils";

// Japanese
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

// Mandarin
import pinyin from "pinyin/esm/pinyin";

export const backend = createBackend({
  async start({ ipc }) {
    const kuroshiro = new Kuroshiro.default();
    {
      await kuroshiro.init(new KuromojiAnalyzer());
    }

    ipc.handle("synced-lyrics:romanize-line", async (line: string) => {
      let out = line;

      // in the edge case where the line is only kanji, it will be treated as chinese, sadly I can't do anything about that
      // in any other case it should work properly??
      // TODO: Figure out a better way to detect if a line is chinese or japanese
      if (
        !(Kuroshiro.default.Util.hasHiragana(out) ||
          Kuroshiro.default.Util.hasKatakana(out)) &&
        /[\u4E00-\u9FFF]+/.test(out)
      ) {
        out = out.replaceAll(
          /[\u4E00-\u9FFF]+/g,
          (text) =>
            pinyin(text, { heteronym: true, segment: true, group: true }).flat()
              .join(" "),
        ).replaceAll(/\s+/g, " ");
      } else if (Kuroshiro.default.Util.hasJapanese(out)) {
        out = await kuroshiro.convert(out, {
          to: "romaji",
          mode: "spaced",
        });
      }

      return out;
    });
  },
});
