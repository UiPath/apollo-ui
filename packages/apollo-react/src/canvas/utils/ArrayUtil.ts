export function partition<T>(array: T[], predicate: (item: T) => boolean): [pass: T[], fail: T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (const item of array) {
    const result = predicate(item) ? pass : fail;
    result.push(item);
  }

  return [pass, fail];
}
