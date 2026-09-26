/** Hash worker — SHA-256 via crypto.subtle off the main thread. */
self.onmessage = async (e) => {
  const { id, text } = e.data ?? {};
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(text ?? "")));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage({ id, hex });
  } catch (err) {
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage({ id, error: String(err) });
  }
};
export {};
