const Alpha = (() => {
  const LEGACY_PREFIX = 'n(';

  function base64EncodeUnicode(str) {
    const text = String(str ?? '');
    try {
      const bytes = new TextEncoder().encode(text);
      let binary = '';
      for (const b of bytes) binary += String.fromCharCode(b);
      return btoa(binary);
    } catch {
      return btoa(unescape(encodeURIComponent(text)));
    }
  }

  function base64DecodeUnicode(b64) {
    const encoded = String(b64 ?? '');
    try {
      const binary = atob(encoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      return decodeURIComponent(escape(atob(encoded)));
    }
  }

  function encode(text) {
    return base64EncodeUnicode(text);
  }

  function decode(encoded) {
    const str = String(encoded ?? '');
    if (str.startsWith(LEGACY_PREFIX)) {
        // Legacy decoder logic if needed, but per instructions we use patched encode/decode
        return encoded; 
    }
    try {
      return base64DecodeUnicode(str);
    } catch {
      return encoded;
    }
  }

  return { encode, decode };
})();
window.Alpha = Alpha;
