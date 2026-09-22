export function throwDataFabricError(
  result: { status: 400; body: { error?: { message?: string } } },
  fallback: string,
): never {
  const err = result.body.error;
  throw new Error(
    typeof err === "object" && err?.message ? err.message : fallback,
  );
}
