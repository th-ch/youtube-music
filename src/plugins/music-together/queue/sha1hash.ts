export function SHA1Hash(): {
  reset: () => void,
  update: (message: string | number[], length?: number) => void,
  digest: () => number[],
  digestString: () => string
} {
  let hash: number[];

  function initialize(): void {
    hash = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
    totalLength = currentLength = 0;
  }

  function processBlock(block: number[]): void {
    const words: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      words[i / 4] = (block[i] << 24) | (block[i + 1] << 16) | (block[i + 2] << 8) | block[i + 3];
    }

    for (let i = 16; i < 80; i++) {
      const temp = words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16];
      words[i] = ((temp << 1) | (temp >>> 31)) & 4294967295;
    }

    let a = hash[0],
      b = hash[1],
      c = hash[2],
      d = hash[3],
      e = hash[4];
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) {
        f = d ^ (b & (c ^ d));
        k = 1518500249;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 1859775393;
      } else if (i < 60) {
        f = (b & c) | (d & (b | c));
        k = 2400959708;
      } else {
        f = b ^ c ^ d;
        k = 3395469782;
      }
      const temp = (((a << 5) | (a >>> 27)) & 4294967295) + f + e + k + words[i] & 4294967295;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) & 4294967295;
      b = a;
      a = temp;
    }
    hash[0] = hash[0] + a & 4294967295;
    hash[1] = hash[1] + b & 4294967295;
    hash[2] = hash[2] + c & 4294967295;
    hash[3] = hash[3] + d & 4294967295;
    hash[4] = hash[4] + e & 4294967295;
  }

  function update(message: string | number[], length?: number): void {
    if ('string' === typeof message) {
      // HACK: to decode UTF-8
      message = unescape(encodeURIComponent(message));
      const bytes: number[] = [];
      for (let i = 0, len = message.length; i < len; ++i)
        bytes.push(message.charCodeAt(i));
      message = bytes;
    }
    length || (length = message.length);
    let i = 0;
    if (0 == currentLength)
      for (; i + 64 < length;) {
        processBlock(message.slice(i, i + 64));
        i += 64;
        totalLength += 64;
      }
    for (; i < length;) {
      if (buffer[currentLength++] = message[i++], totalLength++, 64 == currentLength)
        for (currentLength = 0, processBlock(buffer); i + 64 < length;) {
          processBlock(message.slice(i, i + 64));
          i += 64;
          totalLength += 64;
        }
      }
  }

  function finalize(): number[] {
    const result: number[] = [];
    let bits = 8 * totalLength;
    if (currentLength < 56) {
      update(padding, 56 - currentLength);
    } else {
      update(padding, 64 - (currentLength - 56));
    }
    for (let i = 63; i >= 56; i--) {
      buffer[i] = bits & 255;
      bits >>>= 8;
    }
    processBlock(buffer);
    for (let i = 0; i < 5; i++) {
      for (let j = 24; j >= 0; j -= 8) {
        result.push((hash[i] >> j) & 255);
      }
    }
    return result;
  }

  const buffer: number[] = [];
  const padding: number[] = [128];
  let totalLength: number;
  let currentLength: number;

  for (let i = 1; i < 64; ++i) {
    padding[i] = 0;
  }

  initialize();
  return {
    reset: initialize,
    update: update,
    digest: finalize,
    digestString: function(): string {
      const hash = finalize();
      let hex = '';
      for (let i = 0; i < hash.length; i++)
        hex += '0123456789ABCDEF'.charAt(Math.floor(hash[i] / 16)) + '0123456789ABCDEF'.charAt(hash[i] % 16);
      return hex;
    }
  };
}
