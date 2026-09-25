/**
 * PDF Standard Security Handler (Revision 3, 128-bit RC4)
 * Implements ISO 32000-1 / Adobe PDF Reference 1.7 Sections 3.5.1 - 3.5.3
 * 100% Client-side, zero external dependencies.
 */

// PDF standard 32-byte padding string
const PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

// Self-contained fast MD5 implementation
function md5(data: Uint8Array): Uint8Array {
  function safeAdd(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const n = data.length;
  const numBlocks = ((n + 8) >> 6) + 1;
  const blocks = new Int32Array(numBlocks * 16);
  for (let i = 0; i < n; i++) {
    blocks[i >> 2] |= (data[i] & 0xff) << ((i % 4) * 8);
  }
  blocks[n >> 2] |= 0x80 << ((n % 4) * 8);
  blocks[numBlocks * 16 - 2] = (n * 8) & 0xffffffff;
  blocks[numBlocks * 16 - 1] = Math.floor((n * 8) / 0x100000000);

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < blocks.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = ff(a, b, c, d, blocks[i + 0], 7, -680876936);
    d = ff(d, a, b, c, blocks[i + 1], 12, -389564586);
    c = ff(c, d, a, b, blocks[i + 2], 17, 606105819);
    b = ff(b, c, d, a, blocks[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, blocks[i + 4], 7, -176418897);
    d = ff(d, a, b, c, blocks[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, blocks[i + 6], 17, -1473231341);
    b = ff(b, c, d, a, blocks[i + 7], 22, -45705983);
    a = ff(a, b, c, d, blocks[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, blocks[i + 9], 12, -1958414417);
    c = ff(c, d, a, b, blocks[i + 10], 17, -42063);
    b = ff(b, c, d, a, blocks[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, blocks[i + 12], 7, 1804603682);
    d = ff(d, a, b, c, blocks[i + 13], 12, -40341101);
    c = ff(c, d, a, b, blocks[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, blocks[i + 15], 22, 1236535329);

    a = gg(a, b, c, d, blocks[i + 1], 5, -165796510);
    d = gg(d, a, b, c, blocks[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, blocks[i + 11], 14, 643717713);
    b = gg(b, c, d, a, blocks[i + 0], 20, -373897302);
    a = gg(a, b, c, d, blocks[i + 5], 5, -701558691);
    d = gg(d, a, b, c, blocks[i + 10], 9, 38016083);
    c = gg(c, d, a, b, blocks[i + 15], 14, -660478335);
    b = gg(b, c, d, a, blocks[i + 4], 20, -405537848);
    a = gg(a, b, c, d, blocks[i + 9], 5, 568446438);
    d = gg(d, a, b, c, blocks[i + 14], 9, -1019803690);
    c = gg(c, d, a, b, blocks[i + 3], 14, -187363961);
    b = gg(b, c, d, a, blocks[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, blocks[i + 13], 5, -1444681467);
    d = gg(d, a, b, c, blocks[i + 2], 9, -51403784);
    c = gg(c, d, a, b, blocks[i + 7], 14, 1735328473);
    b = gg(b, c, d, a, blocks[i + 12], 20, -1926607734);

    a = hh(a, b, c, d, blocks[i + 5], 4, -378558);
    d = hh(d, a, b, c, blocks[i + 8], 11, -2022574463);
    c = hh(c, d, a, b, blocks[i + 11], 16, 1839030562);
    b = hh(b, c, d, a, blocks[i + 14], 23, -35309556);
    a = hh(a, b, c, d, blocks[i + 1], 4, -1530992060);
    d = hh(d, a, b, c, blocks[i + 4], 11, 1272893353);
    c = hh(c, d, a, b, blocks[i + 7], 16, -155497632);
    b = hh(b, c, d, a, blocks[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, blocks[i + 13], 4, 681279174);
    d = hh(d, a, b, c, blocks[i + 0], 11, -358537222);
    c = hh(c, d, a, b, blocks[i + 3], 16, -722521979);
    b = hh(b, c, d, a, blocks[i + 6], 23, 76029189);
    a = hh(a, b, c, d, blocks[i + 9], 4, -640364487);
    d = hh(d, a, b, c, blocks[i + 12], 11, -421815835);
    c = hh(c, d, a, b, blocks[i + 15], 16, 530742520);
    b = hh(b, c, d, a, blocks[i + 2], 23, -995338651);

    a = ii(a, b, c, d, blocks[i + 0], 6, -198630844);
    d = ii(d, a, b, c, blocks[i + 7], 10, 1126891415);
    c = ii(c, d, a, b, blocks[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, blocks[i + 5], 21, -57434055);
    a = ii(a, b, c, d, blocks[i + 12], 6, 1700485571);
    d = ii(d, a, b, c, blocks[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, blocks[i + 10], 15, -1051523);
    b = ii(b, c, d, a, blocks[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, blocks[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, blocks[i + 15], 10, -30611744);
    c = ii(c, d, a, b, blocks[i + 6], 15, -1560198380);
    b = ii(b, c, d, a, blocks[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, blocks[i + 4], 6, -145523070);
    d = ii(d, a, b, c, blocks[i + 11], 10, -1120210379);
    c = ii(c, d, a, b, blocks[i + 2], 15, 718787259);
    b = ii(b, c, d, a, blocks[i + 9], 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const out = new Uint8Array(16);
  const words = [a, b, c, d];
  for (let i = 0; i < 4; i++) {
    out[i * 4 + 0] = words[i] & 0xff;
    out[i * 4 + 1] = (words[i] >> 8) & 0xff;
    out[i * 4 + 2] = (words[i] >> 16) & 0xff;
    out[i * 4 + 3] = (words[i] >> 24) & 0xff;
  }
  return out;
}

// RC4 (ARC4) symmetric stream cipher
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
  }
  let i = 0;
  j = 0;
  const out = new Uint8Array(data.length);
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
    out[k] = data[k] ^ s[(s[i] + s[j]) % 256];
  }
  return out;
}

function padPassword(pwd: string): Uint8Array {
  const bytes = new TextEncoder().encode(pwd);
  const out = new Uint8Array(32);
  if (bytes.length >= 32) {
    out.set(bytes.subarray(0, 32));
  } else {
    out.set(bytes);
    out.set(PADDING.subarray(0, 32 - bytes.length), bytes.length);
  }
  return out;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function toHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export interface ProtectOptions {
  userPassword: string;
  ownerPassword?: string;
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
  allowAnnotating?: boolean;
}

/**
 * Encrypt a PDF Uint8Array buffer with Standard 128-bit PDF Encryption (Revision 3)
 */
export async function protectPDF(pdfBytes: Uint8Array, options: ProtectOptions): Promise<Uint8Array> {
  const userPwd = options.userPassword;
  const ownerPwd = options.ownerPassword || options.userPassword;

  // Compute permissions flag P
  // Bits: 3=print, 4=modify, 5=copy, 6=add/modify annotations
  // Unused bits 7-8 must be 1, bits 13-32 must be 1 in 32-bit signed integer
  let p = -4; // default all allowed: 1111...11111100
  if (!options.allowPrinting) p &= ~4;
  if (!options.allowModifying) p &= ~8;
  if (!options.allowCopying) p &= ~16;
  if (!options.allowAnnotating) p &= ~32;

  const pBytes = new Uint8Array(4);
  pBytes[0] = p & 0xff;
  pBytes[1] = (p >> 8) & 0xff;
  pBytes[2] = (p >> 16) & 0xff;
  pBytes[3] = (p >> 24) & 0xff;

  // Generate 16-byte random document ID
  const docId = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(docId);
  } else {
    for (let i = 0; i < 16; i++) docId[i] = Math.floor(Math.random() * 256);
  }

  // 1. Compute Owner Entry /O (Algorithm 3.3)
  const paddedOwner = padPassword(ownerPwd);
  let ownerHash = md5(paddedOwner);
  for (let i = 0; i < 50; i++) {
    ownerHash = md5(ownerHash.subarray(0, 16));
  }
  const ownerKey = ownerHash.subarray(0, 16);
  let oVal = rc4(ownerKey, padPassword(userPwd));
  for (let i = 1; i <= 19; i++) {
    const roundKey = new Uint8Array(16);
    for (let k = 0; k < 16; k++) roundKey[k] = ownerKey[k] ^ i;
    oVal = rc4(roundKey, oVal);
  }

  // 2. Compute Encryption Key (Algorithm 3.2)
  const paddedUser = padPassword(userPwd);
  let encDigest = md5(concat(paddedUser, oVal, pBytes, docId));
  for (let i = 0; i < 50; i++) {
    encDigest = md5(encDigest.subarray(0, 16));
  }
  const encKey = encDigest.subarray(0, 16);

  // 3. Compute User Entry /U (Algorithm 3.4 / 3.5, Rev 3)
  let uHash = md5(concat(PADDING, docId));
  let uVal = rc4(encKey, uHash);
  for (let i = 1; i <= 19; i++) {
    const roundKey = new Uint8Array(16);
    for (let k = 0; k < 16; k++) roundKey[k] = encKey[k] ^ i;
    uVal = rc4(roundKey, uVal);
  }
  const fullUVal = new Uint8Array(32);
  fullUVal.set(uVal.subarray(0, 16));
  // Remaining 16 bytes can be arbitrary padding
  fullUVal.set(PADDING.subarray(0, 16), 16);

  // 4. Object Key Derivation & Stream Encryption
  function getObjectKey(objNum: number, genNum: number): Uint8Array {
    const objBytes = new Uint8Array(5);
    objBytes[0] = objNum & 0xff;
    objBytes[1] = (objNum >> 8) & 0xff;
    objBytes[2] = (objNum >> 16) & 0xff;
    objBytes[3] = genNum & 0xff;
    objBytes[4] = (genNum >> 8) & 0xff;
    const digest = md5(concat(encKey, objBytes));
    return digest.subarray(0, 16);
  }

  // Parse and encrypt PDF indirect objects
  const text = new TextDecoder("latin1").decode(pdfBytes);

  // Find max object number to allocate a new object for /Encrypt
  let maxObjNum = 0;
  const objHeaderRegex = /(\d+)\s+(\d+)\s+obj/g;
  let match;
  while ((match = objHeaderRegex.exec(text)) !== null) {
    const num = parseInt(match[1], 10);
    if (num > maxObjNum) maxObjNum = num;
  }
  const encryptObjNum = maxObjNum + 1;

  // Build the Encrypt dictionary object
  const hexO = toHex(oVal);
  const hexU = toHex(fullUVal);
  const hexId = toHex(docId);

  const encryptDict = `${encryptObjNum} 0 obj\n<< /Filter /Standard /V 2 /R 3 /Length 128 /P ${p} /O <${hexO}> /U <${hexU}> >>\nendobj\n`;

  // Encrypt streams in objects
  // We locate "stream\r?\n...endstream"
  const streamRegex = /(\d+)\s+(\d+)\s+obj[\s\S]*?stream(\r?\n)([\s\S]*?)\r?\nendstream/g;
  let resultText = "";
  let lastIdx = 0;

  // Buffer conversion helper
  const latin1Encoder = {
    encode: (s: string) => {
      const b = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
      return b;
    },
    decode: (b: Uint8Array) => {
      let s = "";
      for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return s;
    },
  };

  while ((match = streamRegex.exec(text)) !== null) {
    const objNum = parseInt(match[1], 10);
    const genNum = parseInt(match[2], 10);
    const newline = match[3];
    const streamContent = match[4];
    const matchStart = match.index;
    const streamStart = text.indexOf("stream" + newline, matchStart) + ("stream" + newline).length;
    const streamEnd = streamStart + streamContent.length;

    // Append everything before stream content
    resultText += text.slice(lastIdx, streamStart);

    // Encrypt stream bytes
    const streamBytes = latin1Encoder.encode(streamContent);
    const key = getObjectKey(objNum, genNum);
    const encryptedBytes = rc4(key, streamBytes);
    resultText += latin1Encoder.decode(encryptedBytes);

    lastIdx = streamEnd;
  }
  resultText += text.slice(lastIdx);

  // Insert Encrypt object before xref or trailer
  const xrefPos = resultText.lastIndexOf("xref");
  if (xrefPos !== -1) {
    const beforeXref = resultText.slice(0, xrefPos);
    const afterXref = resultText.slice(xrefPos);

    // In trailer, add /Encrypt <encryptObjNum> 0 R and /ID [<hexId> <hexId>]
    let modifiedAfterXref = afterXref;
    if (modifiedAfterXref.includes("trailer")) {
      modifiedAfterXref = modifiedAfterXref.replace(
        /trailer\s*<<([\s\S]*?)>>/,
        (_m, content) => {
          let updated = content;
          if (!updated.includes("/Encrypt")) {
            updated += ` /Encrypt ${encryptObjNum} 0 R`;
          }
          if (!updated.includes("/ID")) {
            updated += ` /ID [<${hexId}> <${hexId}>]`;
          }
          return `trailer\n<<${updated} >>`;
        }
      );
    }

    const finalStr = beforeXref + encryptDict + modifiedAfterXref;
    return latin1Encoder.encode(finalStr);
  }

  // Fallback: append encryptDict and add trailer if xref was not found
  const finalStr = resultText + "\n" + encryptDict;
  return latin1Encoder.encode(finalStr);
}
