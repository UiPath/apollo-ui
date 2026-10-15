const POLICY_NAME_TOKEN = '{{policyName}}';

export interface PolicyNameTextProps {
  /** A resolved label carrying the `{{policyName}}` token. */
  template: string;
  policyName: string;
}

/**
 * The name to show, or `undefined` for a blank one: Agents passes `policyName ?? ''` while its
 * policy loads, and an empty `<em>` would read worse than the generic wording.
 */
export function nonBlankPolicyName(policyName: string | undefined): string | undefined {
  return policyName !== undefined && policyName.trim() !== '' ? policyName : undefined;
}

/**
 * A label with its `{{policyName}}` token replaced by the emphasized policy name: the
 * centralized caption and the "disabled by policy" messages name the AI Trust Layer policy the
 * same way. Text only, so callers keep their own element and styling.
 */
export function PolicyNameText({ template, policyName }: PolicyNameTextProps) {
  const [before, after] = template.split(POLICY_NAME_TOKEN);
  return (
    <>
      {before}
      <em>{policyName}</em>
      {/* A translation that dropped the token still renders the name, after the text. */}
      {after}
    </>
  );
}
