// Node v24+ exposes localStorage as a built-in global, but without the full
// Web Storage API (getItem, setItem, etc. are not callable). Next.js 15's dev
// overlay accesses localStorage during SSR, which crashes on Node v24+.
// Patch it with a safe in-memory no-op so the app works on all Node versions.
export function register() {
  if (
    typeof globalThis.localStorage !== "undefined" &&
    typeof (globalThis.localStorage as Storage).getItem !== "function"
  ) {
    const store: Record<string, string> = {};
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      enumerable: true,
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); },
        get length() { return Object.keys(store).length; },
        key: (i: number) => Object.keys(store)[i] ?? null,
      } satisfies Storage,
    });
  }
}
