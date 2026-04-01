class AssertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertError";
  }
}

/**
 * Use this to indicate impossible situations (bugs), based on trusted
 * sources of information, *NOT* to indicate user caused issues.
 *
 * Note: for more information on the 'asserts' keyword, see e.g. https://github.com/microsoft/TypeScript/pull/32695
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (condition) {
    return;
  }

  throw new AssertError(`Assertion failed: ${message}`);
}
