export function throwInsightsError(
  result: { status: 400; body: { error: string } },
  fallback: string,
): never {
  throw new Error(result.body.error || fallback);
}
