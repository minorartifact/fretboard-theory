/**
 * A working `localStorage` for tests.
 *
 * jsdom runs here but does not provide one, and both the songs store and the
 * progression store wrap their storage access in `try/catch`. The result was
 * that every persistence path silently no-opped in tests — which is why
 * `songs.ts` sat at 24% branch coverage with its save/load round trip never
 * once exercised.
 */
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null }
  key(i: number) { return [...this.data.keys()][i] ?? null }
  removeItem(key: string) { this.data.delete(key) }
  setItem(key: string, value: string) { this.data.set(key, String(value)) }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(), configurable: true, writable: true,
  })
}
