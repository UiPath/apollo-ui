import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  bottomPositionForHandle,
  calculateGridAlignedHandlePositions,
  heightForHandleWithPosition,
  leftPositionForHandle,
  pixelToPercent,
  rightPositionForHandle,
  snapToGrid,
  topPositionForHandle,
  transformForHandle,
  widthForHandleWithPosition,
} from './ButtonHandleStyleUtils';

describe('ButtonHandleStyleUtils', () => {
  describe('widthForHandleWithPosition', () => {
    it('should return the correct width for a top handle with no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Top, numHandles: 1 });
      expect(width).toBe('50%');
    });

    it('should return the correct width for a bottom handle with no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Bottom, numHandles: 1 });
      expect(width).toBe('50%');
    });

    it('should return the correct width for a left handle with no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Left, numHandles: 1 });
      expect(width).toBe('24px');
    });

    it('should return the correct width for a right handle with no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Right, numHandles: 1 });
      expect(width).toBe('24px');
    });

    it('should return the correct width for a top/bottom handle with 2 handles and no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Top, numHandles: 2 });
      expect(width).toBe('25%');
    });

    it('should return the correct width for a left/right handle with 2 handles and no custom size/position', () => {
      const width = widthForHandleWithPosition({ position: Position.Left, numHandles: 2 });
      expect(width).toBe('24px');
    });

    it('should return the correct width for a top/bottom handle with 2 handles and a custom size/position', () => {
      const width = widthForHandleWithPosition({
        position: Position.Top,
        numHandles: 2,
        customWidth: 100,
      });
      expect(width).toBe('100px');
    });

    it('should return the correct width for a left/right handle with 2 handles and a custom size/position', () => {
      const width = widthForHandleWithPosition({
        position: Position.Left,
        numHandles: 2,
        customWidth: 100,
      });
      expect(width).toBe('100px');
    });
  });

  describe('heightForHandleWithPosition', () => {
    it('should return the correct height for a top handle with no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Top, numHandles: 1 });
      expect(height).toBe('24px');
    });

    it('should return the correct height for a bottom handle with no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Bottom, numHandles: 1 });
      expect(height).toBe('24px');
    });

    it('should return the correct height for a left handle with no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Left, numHandles: 1 });
      expect(height).toBe('50%');
    });

    it('should return the correct height for a right handle with no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Right, numHandles: 1 });
      expect(height).toBe('50%');
    });

    it('should return the correct height for a top/bottom handle with 2 handles and no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Top, numHandles: 2 });
      expect(height).toBe('24px');
    });

    it('should return the correct height for a left/right handle with 2 handles and no custom size/position', () => {
      const height = heightForHandleWithPosition({ position: Position.Left, numHandles: 2 });
      expect(height).toBe('25%');
    });

    it('should return the correct height for a top/bottom handle with 2 handles and a custom size/position', () => {
      const height = heightForHandleWithPosition({
        position: Position.Top,
        numHandles: 2,
        customHeight: 100,
      });
      expect(height).toBe('100px');
    });

    it('should return the correct height for a left/right handle with 2 handles and a custom size/position', () => {
      const height = heightForHandleWithPosition({
        position: Position.Left,
        numHandles: 2,
        customHeight: 100,
      });
      expect(height).toBe('100px');
    });
  });

  describe('topPositionForHandle', () => {
    it('should return the correct top for a top handle with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Top, positionPercent: 100 });
      expect(top).toBe('0');
    });

    it('should return the correct top for a bottom handle with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Bottom, positionPercent: 100 });
      expect(top).toBe('unset');
    });

    it('should return the correct top for a left handle with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Left, positionPercent: 100 });
      expect(top).toBe('100%');
    });

    it('should return the correct top for a right handle with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Right, positionPercent: 100 });
      expect(top).toBe('100%');
    });

    it('should return the correct top for a top handle with multiple handles with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Top, positionPercent: 25 });
      expect(top).toBe('0');
    });

    it('should return the correct top for a bottom handle with multiple handles with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Bottom, positionPercent: 25 });
      expect(top).toBe('unset');
    });

    it('should return the correct top for a left handle with multiple handles with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Left, positionPercent: 25 });
      expect(top).toBe('25%');
    });

    it('should return the correct top for a right handle with multiple handles with no custom size/position', () => {
      const top = topPositionForHandle({ position: Position.Right, positionPercent: 25 });
      expect(top).toBe('25%');
    });

    it('should always return a top value of unset if we receive a custom bottom value with no other custom values', () => {
      const top = topPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customBottom: 0,
      });
      expect(top).toBe('unset');
    });

    it('should return the correct top for a top handle with custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Top,
        positionPercent: 100,
        customTop: 0,
      });
      expect(top).toBe('0px');
    });

    it('should return the correct top for a bottom handle with custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Bottom,
        positionPercent: 100,
        customTop: 0,
      });
      expect(top).toBe('0px');
    });

    it('should return the correct top for a left handle with custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Left,
        positionPercent: 100,
        customTop: 0,
      });
      expect(top).toBe('calc(100% + 0px)');
    });

    it('should return the correct top for a right handle with custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Right,
        positionPercent: 100,
        customTop: 0,
      });
      expect(top).toBe('calc(100% + 0px)');
    });

    it('should return the correct top for a top handle with multiple handles and custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Top,
        positionPercent: 50,
        customTop: 16,
      });
      expect(top).toBe('16px');
    });

    it('should return the correct top for a bottom handle with multiple handles and custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Bottom,
        positionPercent: 50,
        customTop: 16,
      });
      expect(top).toBe('16px');
    });

    it('should return the correct top for a left handle with multiple handles and custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Left,
        positionPercent: 50,
        customTop: 16,
      });
      expect(top).toBe('calc(50% + 8px)');
    });

    it('should return the correct top for a right handle with multiple handles and custom top value', () => {
      const top = topPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customTop: 16,
      });
      expect(top).toBe('calc(50% + 8px)');
    });

    it('should return the correct top for a top handle with multiple handles and custom top and height value', () => {
      const top = topPositionForHandle({
        position: Position.Top,
        positionPercent: 25,
        customTop: 24,
        customHeight: 64,
      });
      expect(top).toBe('24px');
    });

    it('should return the correct top for a bottom handle with multiple handles and custom top and height value', () => {
      const top = topPositionForHandle({
        position: Position.Bottom,
        positionPercent: 25,
        customTop: 24,
        customHeight: 64,
      });
      expect(top).toBe('24px');
    });

    it('should return the correct top for a left handle with multiple handles and custom top and height value', () => {
      const top = topPositionForHandle({
        position: Position.Left,
        positionPercent: 25,
        customTop: 24,
        customHeight: 64,
      });
      expect(top).toBe('8px');
    });

    it('should return the correct top for a right handle with multiple handles and custom top and height value', () => {
      const top = topPositionForHandle({
        position: Position.Right,
        positionPercent: 25,
        customTop: 24,
        customHeight: 64,
      });
      expect(top).toBe('8px');
    });
  });

  describe('bottomPositionForHandle', () => {
    it('should return the correct bottom for a top handle with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Top, positionPercent: 100 });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a bottom handle with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Bottom, positionPercent: 100 });
      expect(bottom).toBe('0');
    });

    it('should return the correct bottom for a left handle with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Left, positionPercent: 100 });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a right handle with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Right, positionPercent: 100 });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a top handle with multiple handles with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Top, positionPercent: 25 });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a bottom handle with multiple handles with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Bottom, positionPercent: 25 });
      expect(bottom).toBe('0');
    });

    it('should return the correct bottom for a left handle with multiple handles with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Left, positionPercent: 25 });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a right handle with multiple handles with no custom size/position', () => {
      const bottom = bottomPositionForHandle({ position: Position.Right, positionPercent: 25 });
      expect(bottom).toBe('unset');
    });

    it('should always return a bottom value of unset if we receive a custom top value with no other custom values', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customTop: 0,
      });
      expect(bottom).toBe('unset');
    });

    it('should return the correct bottom for a top handle with custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Top,
        positionPercent: 100,
        customBottom: 0,
      });
      expect(bottom).toBe('0px');
    });

    it('should return the correct bottom for a bottom handle with custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Bottom,
        positionPercent: 100,
        customBottom: 0,
      });
      expect(bottom).toBe('0px');
    });

    it('should return the correct bottom for a left handle with custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Left,
        positionPercent: 100,
        customBottom: 0,
      });
      expect(bottom).toBe('calc(100% + 0px)');
    });

    it('should return the correct bottom for a right handle with custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Right,
        positionPercent: 100,
        customBottom: 0,
      });
      expect(bottom).toBe('calc(100% + 0px)');
    });

    it('should return the correct bottom for a top handle with multiple handles and custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Top,
        positionPercent: 50,
        customBottom: 16,
      });
      expect(bottom).toBe('16px');
    });

    it('should return the correct bottom for a bottom handle with multiple handles and custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Bottom,
        positionPercent: 50,
        customBottom: 16,
      });
      expect(bottom).toBe('16px');
    });

    it('should return the correct bottom for a left handle with multiple handles and custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Left,
        positionPercent: 50,
        customBottom: 16,
      });
      expect(bottom).toBe('calc(50% + 8px)');
    });

    it('should return the correct bottom for a right handle with multiple handles and custom bottom value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customBottom: 16,
      });
      expect(bottom).toBe('calc(50% + 8px)');
    });

    it('should return the correct bottom for a top handle with multiple handles and custom bottom and height value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Top,
        positionPercent: 25,
        customBottom: 24,
        customHeight: 64,
      });
      expect(bottom).toBe('24px');
    });

    it('should return the correct bottom for a bottom handle with multiple handles and custom bottom and height value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Bottom,
        positionPercent: 25,
        customBottom: 24,
        customHeight: 64,
      });
      expect(bottom).toBe('24px');
    });

    it('should return the correct bottom for a left handle with multiple handles and custom bottom and height value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Left,
        positionPercent: 25,
        customBottom: 24,
        customHeight: 64,
      });
      expect(bottom).toBe('8px');
    });

    it('should return the correct bottom for a right handle with multiple handles and custom bottom and height value', () => {
      const bottom = bottomPositionForHandle({
        position: Position.Right,
        positionPercent: 25,
        customBottom: 24,
        customHeight: 64,
      });
      expect(bottom).toBe('8px');
    });
  });

  describe('leftPositionForHandle', () => {
    it('should return the correct left for a top handle with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Top, positionPercent: 100 });
      expect(left).toBe('100%');
    });

    it('should return the correct left for a bottom handle with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Bottom, positionPercent: 100 });
      expect(left).toBe('100%');
    });

    it('should return the correct left for a left handle with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Left, positionPercent: 100 });
      expect(left).toBe('0');
    });

    it('should return the correct left for a right handle with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Right, positionPercent: 100 });
      expect(left).toBe('unset');
    });

    it('should return the correct left for a top handle with multiple handles with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Top, positionPercent: 25 });
      expect(left).toBe('25%');
    });

    it('should return the correct left for a bottom handle with multiple handles with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Bottom, positionPercent: 25 });
      expect(left).toBe('25%');
    });

    it('should return the correct left for a left handle with multiple handles with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Left, positionPercent: 25 });
      expect(left).toBe('0');
    });

    it('should return the correct left for a right handle with multiple handles with no custom size/position', () => {
      const left = leftPositionForHandle({ position: Position.Right, positionPercent: 25 });
      expect(left).toBe('unset');
    });

    it('should always return a left value of unset if we receive a custom right value with no other custom values', () => {
      const left = leftPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customRight: 0,
      });
      expect(left).toBe('unset');
    });

    it('should return the correct left for a top handle with custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Top,
        positionPercent: 100,
        customLeft: 0,
      });
      expect(left).toBe('calc(100% + 0px)');
    });

    it('should return the correct left for a bottom handle with custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Bottom,
        positionPercent: 100,
        customLeft: 0,
      });
      expect(left).toBe('calc(100% + 0px)');
    });

    it('should return the correct left for a left handle with custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Left,
        positionPercent: 100,
        customLeft: 0,
      });
      expect(left).toBe('0px');
    });

    it('should return the correct left for a right handle with custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Right,
        positionPercent: 100,
        customLeft: 0,
      });
      expect(left).toBe('0px');
    });

    it('should return the correct left for a top handle with multiple handles and custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Top,
        positionPercent: 50,
        customLeft: 16,
      });
      expect(left).toBe('calc(50% + 8px)');
    });

    it('should return the correct left for a bottom handle with multiple handles and custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Bottom,
        positionPercent: 50,
        customLeft: 16,
      });
      expect(left).toBe('calc(50% + 8px)');
    });

    it('should return the correct left for a left handle with multiple handles and custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Left,
        positionPercent: 50,
        customLeft: 16,
      });
      expect(left).toBe('16px');
    });

    it('should return the correct left for a right handle with multiple handles and custom left value', () => {
      const left = leftPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customLeft: 16,
      });
      expect(left).toBe('16px');
    });

    it('should return the correct left for a top handle with multiple handles and custom left and width value', () => {
      const left = leftPositionForHandle({
        position: Position.Top,
        positionPercent: 25,
        customLeft: 24,
        customWidth: 64,
      });
      expect(left).toBe('8px');
    });

    it('should return the correct left for a bottom handle with multiple handles and custom left and width value', () => {
      const left = leftPositionForHandle({
        position: Position.Bottom,
        positionPercent: 25,
        customLeft: 24,
        customWidth: 64,
      });
      expect(left).toBe('8px');
    });

    it('should return the correct left for a left handle with multiple handles and custom left and width value', () => {
      const left = leftPositionForHandle({
        position: Position.Left,
        positionPercent: 25,
        customLeft: 24,
        customWidth: 64,
      });
      expect(left).toBe('24px');
    });

    it('should return the correct left for a right handle with multiple handles and custom left and width value', () => {
      const left = leftPositionForHandle({
        position: Position.Right,
        positionPercent: 25,
        customLeft: 24,
        customWidth: 64,
      });
      expect(left).toBe('24px');
    });
  });

  describe('rightPositionForHandle', () => {
    it('should return the correct right for a top handle with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Top, positionPercent: 100 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a bottom handle with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Bottom, positionPercent: 100 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a left handle with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Left, positionPercent: 100 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a right handle with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Right, positionPercent: 100 });
      expect(right).toBe('0');
    });

    it('should return the correct right for a top handle with multiple handles with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Top, positionPercent: 25 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a bottom handle with multiple handles with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Bottom, positionPercent: 25 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a left handle with multiple handles with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Left, positionPercent: 25 });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a right handle with multiple handles with no custom size/position', () => {
      const right = rightPositionForHandle({ position: Position.Right, positionPercent: 25 });
      expect(right).toBe('0');
    });

    it('should always return a right value of unset if we receive a custom left value with no other custom values', () => {
      const right = rightPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customLeft: 0,
      });
      expect(right).toBe('unset');
    });

    it('should return the correct right for a top handle with custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Top,
        positionPercent: 100,
        customRight: 0,
      });
      expect(right).toBe('calc(100% + 0px)');
    });

    it('should return the correct right for a bottom handle with custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Bottom,
        positionPercent: 100,
        customRight: 0,
      });
      expect(right).toBe('calc(100% + 0px)');
    });

    it('should return the correct right for a left handle with custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Left,
        positionPercent: 100,
        customRight: 0,
      });
      expect(right).toBe('0px');
    });

    it('should return the correct right for a right handle with custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Right,
        positionPercent: 100,
        customRight: 0,
      });
      expect(right).toBe('0px');
    });

    it('should return the correct right for a top handle with multiple handles and custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Top,
        positionPercent: 50,
        customRight: 16,
      });
      expect(right).toBe('calc(50% + 8px)');
    });

    it('should return the correct right for a bottom handle with multiple handles and custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Bottom,
        positionPercent: 50,
        customRight: 16,
      });
      expect(right).toBe('calc(50% + 8px)');
    });

    it('should return the correct right for a left handle with multiple handles and custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Left,
        positionPercent: 50,
        customRight: 16,
      });
      expect(right).toBe('16px');
    });

    it('should return the correct right for a right handle with multiple handles and custom right value', () => {
      const right = rightPositionForHandle({
        position: Position.Right,
        positionPercent: 50,
        customRight: 16,
      });
      expect(right).toBe('16px');
    });

    it('should return the correct right for a top handle with multiple handles and custom right and width value', () => {
      const right = rightPositionForHandle({
        position: Position.Top,
        positionPercent: 25,
        customRight: 24,
        customWidth: 64,
      });
      expect(right).toBe('8px');
    });

    it('should return the correct right for a bottom handle with multiple handles and custom right and width value', () => {
      const right = rightPositionForHandle({
        position: Position.Bottom,
        positionPercent: 25,
        customRight: 24,
        customWidth: 64,
      });
      expect(right).toBe('8px');
    });

    it('should return the correct right for a left handle with multiple handles and custom right and width value', () => {
      const right = rightPositionForHandle({
        position: Position.Left,
        positionPercent: 25,
        customRight: 24,
        customWidth: 64,
      });
      expect(right).toBe('24px');
    });

    it('should return the correct right for a right handle with multiple handles and custom right and width value', () => {
      const right = rightPositionForHandle({
        position: Position.Right,
        positionPercent: 25,
        customRight: 24,
        customWidth: 64,
      });
      expect(right).toBe('24px');
    });
  });

  describe('transformForHandle', () => {
    it('should return the correct transform for a top handle with no custom size/position', () => {
      const transform = transformForHandle({ position: Position.Top });
      expect(transform).toBe('translate(-50%, -50%)');
    });

    it('should return the correct transform for a bottom handle with no custom size/position', () => {
      const transform = transformForHandle({ position: Position.Bottom });
      expect(transform).toBe('translate(-50%, 50%)');
    });

    it('should return the correct transform for a left handle with no custom size/position', () => {
      const transform = transformForHandle({ position: Position.Left });
      expect(transform).toBe('translate(-50%, -50%)');
    });

    it('should return the correct transform for a right handle with no custom size/position', () => {
      const transform = transformForHandle({ position: Position.Right });
      expect(transform).toBe('translate(50%, -50%)');
    });

    it('should return the correct transform for a top handle with custom vertical position/size', () => {
      const transform = transformForHandle({
        position: Position.Top,
        customPositionAndOffsets: { top: 10, height: 100 },
      });
      expect(transform).toBe('translate(-50%, 0%)');
    });

    it('should return the correct transform for a bottom handle with custom vertical position/size', () => {
      const transform = transformForHandle({
        position: Position.Bottom,
        customPositionAndOffsets: { bottom: 10, height: 100 },
      });
      expect(transform).toBe('translate(-50%, 0%)');
    });

    it('should return the correct transform for a left handle with custom vertical position/size', () => {
      const transform = transformForHandle({
        position: Position.Left,
        customPositionAndOffsets: { bottom: 10, height: 100 },
      });
      expect(transform).toBe('translate(-50%, 0%)');
    });

    it('should return the correct transform for a right handle with custom vertical position/size', () => {
      const transform = transformForHandle({
        position: Position.Right,
        customPositionAndOffsets: { bottom: 10, height: 100 },
      });
      expect(transform).toBe('translate(50%, 0%)');
    });

    it('should return the correct transform for a top handle with custom horizontal size/position', () => {
      const transform = transformForHandle({
        position: Position.Top,
        customPositionAndOffsets: { left: 10, width: 100 },
      });
      expect(transform).toBe('translate(0%, -50%)');
    });

    it('should return the correct transform for a bottom handle with custom horizontal size/position', () => {
      const transform = transformForHandle({
        position: Position.Bottom,
        customPositionAndOffsets: { left: 10, width: 100 },
      });
      expect(transform).toBe('translate(0%, 50%)');
    });

    it('should return the correct transform for a left handle with custom horizontal size/position', () => {
      const transform = transformForHandle({
        position: Position.Left,
        customPositionAndOffsets: { left: 10, width: 100 },
      });
      expect(transform).toBe('translate(0%, -50%)');
    });

    it('should return the correct transform for a right handle with custom horizontal size/position', () => {
      const transform = transformForHandle({
        position: Position.Right,
        customPositionAndOffsets: { left: 10, width: 100 },
      });
      expect(transform).toBe('translate(0%, -50%)');
    });
  });

  describe('snapToGrid', () => {
    it('should snap a value to the nearest grid multiple (default grid size 16)', () => {
      expect(snapToGrid(0)).toBe(0);
      expect(snapToGrid(8)).toBe(16); // 8/16 = 0.5, rounds to 1 * 16 = 16
      expect(snapToGrid(7)).toBe(0); // 7/16 = 0.4375, rounds to 0
      expect(snapToGrid(16)).toBe(16);
      expect(snapToGrid(24)).toBe(32); // 24/16 = 1.5, rounds to 2 * 16 = 32
      expect(snapToGrid(25)).toBe(32); // 25/16 = 1.5625, rounds to 2 * 16 = 32
      expect(snapToGrid(48)).toBe(48);
    });

    it('should snap using custom grid size', () => {
      expect(snapToGrid(5, 10)).toBe(10); // 5/10 = 0.5, rounds to 1 * 10 = 10
      expect(snapToGrid(4, 10)).toBe(0); // 4/10 = 0.4, rounds to 0
      expect(snapToGrid(15, 10)).toBe(20); // 15/10 = 1.5, rounds to 2 * 10 = 20
    });
  });

  describe('calculateGridAlignedHandlePositions', () => {
    it('should return empty array for 0 handles', () => {
      expect(calculateGridAlignedHandlePositions(96, 0)).toEqual([]);
    });

    it('should return center grid position for 1 handle', () => {
      expect(calculateGridAlignedHandlePositions(96, 1)).toEqual([48]);
    });

    it('should calculate equidistant positions for 2 handles', () => {
      // 2 handles: ideal spacing = 96/3 = 32, grid-aligned = 32, start = (96-32)/2 = 32
      // Positions: 32, 64
      expect(calculateGridAlignedHandlePositions(96, 2)).toEqual([32, 64]);
    });

    it('should calculate equidistant positions for 3 handles', () => {
      // 3 handles: ideal spacing = 96/4 = 24, grid-aligned = round(24/16)*16 = 32
      // totalSpan = 2*32 = 64, start = (96-64)/2 = 16
      // Positions: 16, 48, 80
      expect(calculateGridAlignedHandlePositions(96, 3)).toEqual([16, 48, 80]);
    });

    it('should calculate equidistant positions for 4 handles', () => {
      // 4 handles: ideal spacing = 96/5 = 19.2, grid-aligned = round(19.2/16)*16 = 16
      // totalSpan = 3*16 = 48, start = (96-48)/2 = 24
      // Positions: 24, 40, 56, 72, snapped: 32, 48, 64, 80
      expect(calculateGridAlignedHandlePositions(96, 4)).toEqual([32, 48, 64, 80]);
    });

    it('should work with larger node sizes', () => {
      // 160px node with 3 handles: ideal spacing = 160/4 = 40, grid-aligned = round(40/16)*16 = 48
      // totalSpan = 2*48 = 96, start = (160-96)/2 = 32
      // Positions: 32, 80, 128
      expect(calculateGridAlignedHandlePositions(160, 3)).toEqual([32, 80, 128]);
    });

    it('should use custom grid size', () => {
      // 100px node with 2 handles, grid size 10: ideal spacing = 100/3 = 33.33
      // grid-aligned = round(33.33/10)*10 = 30, totalSpan = 1*30 = 30, start = (100-30)/2 = 35
      // Positions: 35, 65, snapped: 40, 70
      expect(calculateGridAlignedHandlePositions(100, 2, 10)).toEqual([40, 70]);
    });

    it('should calculate equidistant positions for 5 handles', () => {
      // 5 handles: ideal spacing = 96/6 = 16, grid-aligned = 16
      // totalSpan = 4*16 = 64, start = (96-64)/2 = 16
      // Positions: 16, 32, 48, 64, 80
      expect(calculateGridAlignedHandlePositions(96, 5)).toEqual([16, 32, 48, 64, 80]);
    });
  });

  describe('pixelToPercent', () => {
    it('should convert pixel position to percentage', () => {
      expect(pixelToPercent(48, 96)).toBe(50);
      expect(pixelToPercent(32, 96)).toBeCloseTo(33.33, 1);
      expect(pixelToPercent(64, 96)).toBeCloseTo(66.67, 1);
      expect(pixelToPercent(0, 96)).toBe(0);
      expect(pixelToPercent(96, 96)).toBe(100);
    });
  });
});
