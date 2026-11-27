import { system } from "@minecraft/server";

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

const INIT = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
];

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B64_MAP = new Map(Array.from(B64, (char, index) => [char, index]));

export function utf8Encode(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(bytes);
}

export function concatBytes(...arrays) {
  let length = 0;
  for (const array of arrays) length += array.length;
  const result = new Uint8Array(length);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

function rotr(value, bits) {
  return (value >>> bits) | (value << (32 - bits));
}

export function sha256(input) {
  const message = Uint8Array.from(input);
  const bitLength = message.length * 8;
  const paddedLength = ((message.length + 72) >> 6) << 6;
  const data = new Uint8Array(paddedLength);
  data.set(message);
  data[message.length] = 0x80;
  const view = new DataView(data.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  const words = new Array(64);
  const result = new Uint8Array(32);
  const state = INIT.slice();
  for (let offset = 0; offset < data.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const x = words[i - 15];
      const y = words[i - 2];
      const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
      const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }
    let a = state[0];
    let b = state[1];
    let c = state[2];
    let d = state[3];
    let e = state[4];
    let f = state[5];
    let g = state[6];
    let h = state[7];
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + K[i] + words[i]) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    state[0] = (state[0] + a) >>> 0;
    state[1] = (state[1] + b) >>> 0;
    state[2] = (state[2] + c) >>> 0;
    state[3] = (state[3] + d) >>> 0;
    state[4] = (state[4] + e) >>> 0;
    state[5] = (state[5] + f) >>> 0;
    state[6] = (state[6] + g) >>> 0;
    state[7] = (state[7] + h) >>> 0;
  }
  for (let i = 0; i < 8; i++) {
    result[i * 4] = (state[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (state[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (state[i] >>> 8) & 0xff;
    result[i * 4 + 3] = state[i] & 0xff;
  }
  return result;
}

export function hmacSha256(key, message) {
  let normalized = key;
  if (normalized.length > 64) normalized = sha256(normalized);
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const byte = i < normalized.length ? normalized[i] : 0;
    inner[i] = byte ^ 0x36;
    outer[i] = byte ^ 0x5c;
  }
  return sha256(concatBytes(outer, sha256(concatBytes(inner, message))));
}

export function pbkdf2Sha256(password, salt, iterations, length = 32) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error("invalid iteration count");
  if (!Number.isInteger(length) || length < 1 || length > 255) throw new Error("invalid key length");
  const blocks = Math.ceil(length / 32);
  const output = new Uint8Array(blocks * 32);
  for (let block = 1; block <= blocks; block++) {
    const counter = new Uint8Array(4);
    new DataView(counter.buffer).setUint32(0, block, false);
    let current = hmacSha256(password, concatBytes(salt, counter));
    const start = (block - 1) * 32;
    output.set(current, start);
    for (let round = 1; round < iterations; round++) {
      current = hmacSha256(password, current);
      for (let i = 0; i < 32; i++) output[start + i] ^= current[i];
    }
  }
  return output.slice(0, length);
}

export function bytesToHex(bytes) {
  let result = "";
  for (const byte of bytes) result += byte.toString(16).padStart(2, "0");
  return result;
}

export function base64urlEncode(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : -1;
    const c = i + 2 < bytes.length ? bytes[i + 2] : -1;
    const value = (a << 16) | ((b < 0 ? 0 : b) << 8) | (c < 0 ? 0 : c);
    result += B64[(value >>> 18) & 63] + B64[(value >>> 12) & 63];
    if (b >= 0) result += B64[(value >>> 6) & 63];
    if (c >= 0) result += B64[value & 63];
  }
  return result;
}

export function base64urlDecode(text) {
  const clean = String(text).replace(/=+$/, "");
  const bytes = [];
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64_MAP.get(clean[i]);
    const b = B64_MAP.get(clean[i + 1]);
    const c = B64_MAP.get(clean[i + 2]);
    const d = B64_MAP.get(clean[i + 3]);
    if (a === undefined || b === undefined) break;
    const value = (a << 18) | (b << 12) | ((c === undefined ? 0 : c) << 6) | (d === undefined ? 0 : d);
    bytes.push((value >>> 16) & 255);
    if (c !== undefined) bytes.push((value >>> 8) & 255);
    if (d !== undefined) bytes.push(value & 255);
  }
  return Uint8Array.from(bytes);
}

export function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

export function makeSalt(seed) {
  return sha256(utf8Encode(seed)).slice(0, 16);
}

export function derivePasswordHash(password, salt, accountKey, iterations = 120000) {
  const material = concatBytes(utf8Encode(accountKey + "\u0000"), utf8Encode(password));
  return pbkdf2Sha256(material, salt, iterations, 32);
}

export function createPasswordRecord(password, saltSeed, accountKey, iterations = 120000) {
  const salt = makeSalt(saltSeed);
  const hash = derivePasswordHash(password, salt, accountKey, iterations);
  return {
    salt: base64urlEncode(salt),
    hash: base64urlEncode(hash),
    iterations,
    version: 1
  };
}

export function verifyPasswordRecord(password, record, accountKey) {
  const salt = base64urlDecode(record.salt);
  const expected = base64urlDecode(record.hash);
  const actual = derivePasswordHash(password, salt, accountKey, record.iterations || 120000);
  return timingSafeEqual(actual, expected);
}

export function derivePasswordHashAsync(password, salt, accountKey, iterations, done) {
  const material = concatBytes(utf8Encode(accountKey + "\u0000"), utf8Encode(password));
  pbkdf2Sha256Async(material, salt, iterations, 32, done);
}

function pbkdf2Sha256Async(password, salt, iterations, length, done) {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error("invalid iteration count");
  if (!Number.isInteger(length) || length < 1 || length > 255) throw new Error("invalid key length");
  const blocks = Math.ceil(length / 32);
  const output = new Uint8Array(blocks * 32);
  let block = 1;
  let current = null;
  let start = 0;
  let round = 0;
  const beginBlock = () => {
    const counter = new Uint8Array(4);
    new DataView(counter.buffer).setUint32(0, block, false);
    current = hmacSha256(password, concatBytes(salt, counter));
    start = (block - 1) * 32;
    output.set(current, start);
    round = 1;
  };
  const step = () => {
    const budget = Math.min(4000, iterations - round);
    for (let index = 0; index < budget; index++) {
      current = hmacSha256(password, current);
      for (let i = 0; i < 32; i++) output[start + i] ^= current[i];
      round++;
    }
    if (round < iterations) {
      system.run(step);
      return;
    }
    if (block < blocks) {
      block++;
      beginBlock();
      system.run(step);
      return;
    }
    done(output.slice(0, length));
  };
  beginBlock();
  system.run(step);
}

export function createPasswordRecordAsync(password, saltSeed, accountKey, iterations, done) {
  const salt = makeSalt(saltSeed);
  derivePasswordHashAsync(password, salt, accountKey, iterations, (hash) => {
    done({
      salt: base64urlEncode(salt),
      hash: base64urlEncode(hash),
      iterations,
      version: 1
    });
  });
}

export function verifyPasswordRecordAsync(password, record, accountKey, done) {
  const salt = base64urlDecode(record.salt);
  const expected = base64urlDecode(record.hash);
  derivePasswordHashAsync(password, salt, accountKey, record.iterations || 120000, (actual) => {
    done(timingSafeEqual(actual, expected));
  });
}
