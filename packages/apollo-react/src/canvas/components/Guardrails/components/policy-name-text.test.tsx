import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nonBlankPolicyName, PolicyNameText } from './policy-name-text';

describe('PolicyNameText', () => {
  it('emphasizes the name where the token lands', () => {
    const { container } = render(
      <p>
        <PolicyNameText template="Disabled by {{policyName}} today." policyName="Enterprise" />
      </p>
    );

    expect(container.querySelector('p')).toHaveTextContent('Disabled by Enterprise today.');
    expect(container.querySelector('em')).toHaveTextContent('Enterprise');
  });

  it('still names the policy when a translation dropped the token', () => {
    const { container } = render(
      <p>
        <PolicyNameText template="Disabled by policy." policyName="Enterprise" />
      </p>
    );

    expect(container.querySelector('p')).toHaveTextContent('Disabled by policy.Enterprise');
  });
});

describe('nonBlankPolicyName', () => {
  it.each([
    [undefined, undefined],
    ['', undefined],
    ['   ', undefined],
    ['Enterprise', 'Enterprise'],
    [' Enterprise ', ' Enterprise '],
  ])('reads %j as %j', (input, expected) => {
    expect(nonBlankPolicyName(input)).toBe(expected);
  });
});
