export function report(error: unknown): void {
  console.error(error);
  console.warn("reported");
}
