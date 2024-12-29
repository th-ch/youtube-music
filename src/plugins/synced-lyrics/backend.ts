import { createBackend } from "@/utils";

// Japanese
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import _Kuroshiro_ from "kuroshiro";
const Kuroshiro = _Kuroshiro_.default; // cjs -> esm issue

// Mandarin
import pinyin from "pinyin/esm/pinyin";
import { LyricResult } from "./types";

export const backend = createBackend({
  async start({ ipc }) {
    const kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer());

    const hasJapanese = async (lines: string[]) =>
      lines.some((line) =>
        Kuroshiro.Util.hasHiragana(line) ||
        Kuroshiro.Util.hasKatakana(line)
      );

    ipc.handle(
      "synced-lyrics:has-japanese",
      async (data: string) => {
        const lyric = JSON.parse(data) as LyricResult;
        if (!lyric || (!lyric.lines && !lyric.lyrics)) return false;
        const lines = Array.isArray(lyric.lines)
          ? lyric.lines.map(({ text }) => text)
          : lyric.lyrics!.split("\n");
        return hasJapanese(lines);
      },
    );

    ipc.handle(
      "synced-lyrics:romaji",
      async (line: string) =>
        await kuroshiro.convert(line, {
          to: "romaji",
          mode: "spaced",
        }),
    );

    ipc.handle(
      "synced-lyrics:pinyin",
      async (line: string) =>
        line.replaceAll(
          /[\u4E00-\u9FFF]+/g,
          (text) =>
            pinyin(text, {
              heteronym: true,
              segment: true,
              group: true,
            }).flat()
              .join(" "),
        ).replaceAll(/\s+/g, " "),
    );
  },
});
