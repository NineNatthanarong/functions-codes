/**
 * Compact pure-JS MD5 (RFC 1321). Public-domain-style implementation.
 * Accepts a string (encoded as UTF-8 via TextEncoder) or raw bytes,
 * returns the digest as a lowercase hex string.
 *
 * Processes full 64-byte blocks directly from the source buffer, so no
 * full copy of the input is made (only a tiny tail buffer for padding) —
 * safe for hashing large File ArrayBuffers.
 */

// Per-round left-rotate amounts
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// K[i] = floor(abs(sin(i + 1)) * 2^32)
const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function wordToHex(w: number): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ((w >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
  }
  return out;
}

export function md5Hex(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = bytes.length;

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const M = new Uint32Array(16);

  const processBlock = (buf: Uint8Array, offset: number) => {
    for (let j = 0; j < 16; j++) {
      const o = offset + j * 4;
      M[j] = buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16) | (buf[o + 3] << 24);
    }
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) & 15;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) & 15;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) & 15;
      }
      const tmp = D;
      D = C;
      C = B;
      const sum = (A + F + K[i] + M[g]) | 0;
      B = (B + ((sum << S[i]) | (sum >>> (32 - S[i])))) | 0;
      A = tmp;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  };

  // Full 64-byte blocks straight from the source buffer
  const fullBlocks = Math.floor(len / 64);
  for (let b = 0; b < fullBlocks; b++) {
    processBlock(bytes, b * 64);
  }

  // Tail: remaining bytes + 0x80 + zero padding + 64-bit little-endian bit length
  const rem = len - fullBlocks * 64;
  const tailLen = rem < 56 ? 64 : 128;
  const tail = new Uint8Array(tailLen);
  tail.set(bytes.subarray(fullBlocks * 64));
  tail[rem] = 0x80;

  const bitLo = (len * 8) >>> 0;
  const bitHi = Math.floor(len / 0x20000000) >>> 0; // (len * 8) / 2^32
  tail[tailLen - 8] = bitLo & 0xff;
  tail[tailLen - 7] = (bitLo >>> 8) & 0xff;
  tail[tailLen - 6] = (bitLo >>> 16) & 0xff;
  tail[tailLen - 5] = (bitLo >>> 24) & 0xff;
  tail[tailLen - 4] = bitHi & 0xff;
  tail[tailLen - 3] = (bitHi >>> 8) & 0xff;
  tail[tailLen - 2] = (bitHi >>> 16) & 0xff;
  tail[tailLen - 1] = (bitHi >>> 24) & 0xff;

  for (let o = 0; o < tailLen; o += 64) {
    processBlock(tail, o);
  }

  return wordToHex(a0 >>> 0) + wordToHex(b0 >>> 0) + wordToHex(c0 >>> 0) + wordToHex(d0 >>> 0);
}
