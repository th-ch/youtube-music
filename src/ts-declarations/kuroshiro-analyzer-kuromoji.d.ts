// Stolen from https://github.com/hexenq/kuroshiro-analyzer-kuromoji/pull/7
// Credit goes to https://github.com/ALOHACREPES345

declare class KuromojiAnalyzer {
  constructor(dictPath?: { dictPath: string });
  init(): Promise<void>;
  parse(str: string): Promise<any>;
}

declare module "kuroshiro-analyzer-kuromoji" {
  export = KuromojiAnalyzer;
}
