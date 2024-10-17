var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/base-x/src/index.js
var require_src = __commonJS((exports, module) => {
  function base(ALPHABET) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0;j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0;i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode(source) {
      if (source instanceof Uint8Array) {
      } else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1;(carry !== 0 || i2 < length) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i2;
        pbegin++;
      }
      var it2 = size - length;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (;it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array;
      }
      var psz = 0;
      var zeroes = 0;
      var length = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1;(carry !== 0 || i2 < length) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i2;
        psz++;
      }
      var it4 = size - length;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode(string) {
      var buffer = decodeUnsafe(string);
      if (buffer) {
        return buffer;
      }
      throw new Error("Non-base" + BASE + " character");
    }
    return {
      encode,
      decodeUnsafe,
      decode
    };
  }
  module.exports = base;
});

// node_modules/bs58/index.js
var require_bs58 = __commonJS((exports, module) => {
  var basex = require_src();
  var ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  module.exports = basex(ALPHABET);
});

// node_modules/varint/encode.js
var require_encode = __commonJS((exports, module) => {
  function encode(num, out, offset) {
    if (Number.MAX_SAFE_INTEGER && num > Number.MAX_SAFE_INTEGER) {
      encode.bytes = 0;
      throw new RangeError("Could not encode varint");
    }
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT) {
      out[offset++] = num & 255 | MSB;
      num /= 128;
    }
    while (num & MSBALL) {
      out[offset++] = num & 255 | MSB;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode.bytes = offset - oldOffset + 1;
    return out;
  }
  module.exports = encode;
  var MSB = 128;
  var REST = 127;
  var MSBALL = ~REST;
  var INT = Math.pow(2, 31);
});

// node_modules/varint/decode.js
var require_decode = __commonJS((exports, module) => {
  function read(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l || shift > 49) {
        read.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST) << shift : (b & REST) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB);
    read.bytes = counter - offset;
    return res;
  }
  module.exports = read;
  var MSB = 128;
  var REST = 127;
});

// node_modules/varint/length.js
var require_length = __commonJS((exports, module) => {
  var N1 = Math.pow(2, 7);
  var N2 = Math.pow(2, 14);
  var N3 = Math.pow(2, 21);
  var N4 = Math.pow(2, 28);
  var N5 = Math.pow(2, 35);
  var N6 = Math.pow(2, 42);
  var N7 = Math.pow(2, 49);
  var N8 = Math.pow(2, 56);
  var N9 = Math.pow(2, 63);
  module.exports = function(value) {
    return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
  };
});

// node_modules/varint/index.js
var require_varint = __commonJS((exports, module) => {
  module.exports = {
    encode: require_encode(),
    decode: require_decode(),
    encodingLength: require_length()
  };
});

// index.ts
var bs58 = __toESM(require_bs58(), 1);
var varint = __toESM(require_varint(), 1);
function toMultibaseB58(input) {
  const encoded = bs58.encode(input);
  return `${base58btc}${encoded}`;
}
function fromMultibaseB58(input) {
  const decoded = bs58.decode(input.slice(1));
  return decoded;
}
async function multihashSha256(input) {
  const mh = new Uint8Array(2);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
  varint.encode(sha2_256, mh, 0);
  varint.encode(sha2_bytes_256, mh, 1);
  const output = new Uint8Array(mh.length + digest.length);
  output.set(mh);
  output.set(digest, mh.length);
  return output;
}
function toMulticodecJson(input) {
  const encoded = new TextEncoder().encode(JSON.stringify(input));
  const bytes = new Uint8Array(2 + encoded.length);
  varint.encode(json, bytes, 0);
  bytes.set(encoded, 2);
  return bytes;
}
function fromMulticodecJson(input) {
  const decoded = new TextDecoder().decode(input.slice(2));
  return JSON.parse(decoded);
}
async function encode3(inputDocument) {
  const encodedDocument = encodeDocument(inputDocument);
  const hash = await hashDocument(encodedDocument);
  const longForm = `did:peer:4${hash}:${encodedDocument}`;
  return longForm;
}
async function encodeShort(inputDocument) {
  const encodedDocument = encodeDocument(inputDocument);
  const hash = await hashDocument(encodedDocument);
  const shortForm = `did:peer:4${hash}`;
  return shortForm;
}
function longToShort(did) {
  if (!LONG_RE.test(did)) {
    throw new Error("DID is not a long form did:peer:4");
  }
  return did.slice(0, did.lastIndexOf(":"));
}
function encodeDocument(document) {
  const encoded = toMultibaseB58(toMulticodecJson(document));
  return encoded;
}
async function hashDocument(encodedDocument) {
  const bytes = new TextEncoder().encode(encodedDocument);
  const multihashed = await multihashSha256(bytes);
  return toMultibaseB58(multihashed);
}
async function resolve(did) {
  const decodedDocument = await decode2(did);
  const document = contextualizeDocument(did, decodedDocument);
  document.alsoKnownAs = document.alsoKnownAs || [];
  document.alsoKnownAs.push(longToShort(did));
  return document;
}
async function resolveShort(did) {
  const decodedDocument = await decode2(did);
  const shortForm = longToShort(did);
  const document = contextualizeDocument(shortForm, decodedDocument);
  document.alsoKnownAs = document.alsoKnownAs || [];
  document.alsoKnownAs.push(did);
  return document;
}
async function resolveShortFromDoc(document, did) {
  const longForm = await encode3(document);
  if (did !== null) {
    const shortForm = longToShort(longForm);
    if (did !== shortForm) {
      throw new Error(`DID mismatch: ${did} !== ${shortForm}`);
    }
  }
  return resolveShort(longForm);
}
async function decode2(did) {
  if (!did.startsWith("did:peer:4")) {
    throw new Error("Invalid did:peer:4");
  }
  if (SHORT_RE.test(did)) {
    throw new Error("Cannot decode document form short form did:peer:4");
  }
  if (!LONG_RE.test(did)) {
    throw new Error("Invalid did:peer:4");
  }
  const [hash, doc] = did.slice(10).split(":");
  if (hash !== await hashDocument(doc)) {
    throw new Error(`Hash is invalid for did: ${did}`);
  }
  const decoded = fromMulticodecJson(fromMultibaseB58(doc));
  return decoded;
}
function operateOnEmbedded(callback) {
  function _curried(document) {
    if (typeof document === "string") {
      return document;
    } else {
      return callback(document);
    }
  }
  return _curried;
}
function visitVerificationMethods(document, callback) {
  document.verificationMethod = document.verificationMethod?.map(callback);
  document.authentication = document.authentication?.map(operateOnEmbedded(callback));
  document.assertionMethod = document.assertionMethod?.map(operateOnEmbedded(callback));
  document.keyAgreement = document.keyAgreement?.map(operateOnEmbedded(callback));
  document.capabilityDelegation = document.capabilityDelegation?.map(operateOnEmbedded(callback));
  document.capabilityInvocation = document.capabilityInvocation?.map(operateOnEmbedded(callback));
  return document;
}
function contextualizeDocument(did, document) {
  const contextualized = { ...document };
  contextualized.id = did;
  visitVerificationMethods(contextualized, (vm) => {
    if (vm.controller === undefined) {
      vm.controller = did;
    }
    return vm;
  });
  return contextualized;
}
var json = 512;
var sha2_256 = 18;
var sha2_bytes_256 = 32;
var base58btc = "z";
var B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var LONG_RE = new RegExp(`^did:peer:4zQm[${B58}]{44}:z[${B58}]{6,}\$`);
var SHORT_RE = new RegExp(`^did:peer:4zQm[${B58}]{44}\$`);
export {
  resolveShortFromDoc,
  resolveShort,
  resolve,
  longToShort,
  encodeShort,
  encode3 as encode,
  decode2 as decode,
  SHORT_RE,
  LONG_RE
};
