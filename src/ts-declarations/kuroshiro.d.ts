// Stolen from https://github.com/hexenq/kuroshiro/pull/93
// Credit goes to https://github.com/ALOHACREPES345 and https://github.com/lcsvcn
declare class Kuroshiro {
  constructor();
  _analyzer: import('kuroshiro-analyzer-kuromoji') | null;
  init(analyzer: import('kuroshiro-analyzer-kuromoji')): Promise<void>;
  convert(
    str: string,
    options?: {
      to?: 'hiragana' | 'katakana' | 'romaji';
      mode?: 'normal' | 'spaced' | 'okurigana' | 'furigana';
      romajiSystem?: 'nippon' | 'passport' | 'hepburn';
      delimiter_start?: string;
      delimiter_end?: string;
    },
  ): Promise<string>;

  static Util: {
    isHiragana: (ch: string) => boolean;
    isKatakana: (ch: string) => boolean;
    isKana: (ch: string) => boolean;
    isKanji: (ch: string) => boolean;
    isJapanese: (ch: string) => boolean;
    hasHiragana: (str: string) => boolean;
    hasKatakana: (str: string) => boolean;
    hasKana: (str: string) => boolean;
    hasKanji: (str: string) => boolean;
    hasJapanese: (str: string) => boolean;
    kanaToHiragana: (str: string) => string;
    kanaToKatakana: (str: string) => string;
    kanaToRomaji: (
      str: string,
      system: 'nippon' | 'passport' | 'hepburn',
    ) => string;
  };
}

declare module 'kuroshiro' {
  export = Kuroshiro;
}
