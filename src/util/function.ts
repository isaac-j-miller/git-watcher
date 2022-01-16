export function once<T>(func: () => T): () => T {
  const value = func();
  return () => value;
}
