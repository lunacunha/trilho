// Red phase (prompt 02): stubs call this so every unimplemented function fails the same way.
// Arguments are accepted only so stub parameters count as used. Delete once all stubs are gone.
export function notImplemented(...args: unknown[]): never {
  void args;
  throw new Error("Not implemented");
}
