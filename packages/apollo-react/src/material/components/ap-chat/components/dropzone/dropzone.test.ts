import { ErrorCode } from 'react-dropzone';
import { describe, expect, it } from 'vitest';

import { rejectionReason } from './dropzone';

describe('rejectionReason', () => {
  it('maps react-dropzone error codes onto the shared intake reasons', () => {
    expect(rejectionReason(ErrorCode.FileTooLarge)).toBe('size');
    expect(rejectionReason(ErrorCode.FileInvalidType)).toBe('type');
    expect(rejectionReason(ErrorCode.TooManyFiles)).toBe('count');
    expect(rejectionReason(ErrorCode.FileTooSmall)).toBe('other');
    expect(rejectionReason(undefined)).toBe('other');
  });
});
