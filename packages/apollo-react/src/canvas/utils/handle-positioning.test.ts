import { calculateGridAlignedHandlePositions } from './handle-positioning';

describe('handle-positioning', () => {
  describe('calculateGridAlignedHandlePositions', () => {
    it('should return empty array for 0 handles', () => {
      expect(calculateGridAlignedHandlePositions(96, 0)).toEqual([]);
    });

    it('should return center grid position for 1 handle', () => {
      expect(calculateGridAlignedHandlePositions(96, 1)).toEqual([48]);
    });

    it('should snap single handle to grid when nodeSize is not grid-aligned', () => {
      // 312px node: ideal center 156 is off-grid by 4. Snap → 160.
      expect(calculateGridAlignedHandlePositions(312, 1)).toEqual([160]);
    });

    it('should snap single handle to grid when nodeSize is odd', () => {
      // 321px: half is 160.5. Snap → 160.
      expect(calculateGridAlignedHandlePositions(321, 1)).toEqual([160]);
    });

    it('should calculate equidistant positions for 2 handles', () => {
      // 2 handles, gridSize=8: ideal=96/3=32, rounded=32, span=32, start=(96-32)/2=32
      // Positions: 32, 64
      expect(calculateGridAlignedHandlePositions(96, 2, 8)).toEqual([32, 64]);
    });

    it('should calculate equidistant positions for 3 handles', () => {
      // 3 handles, gridSize=16: ideal=96/4=24, rounded=32, span=64, start=(96-64)/2=16
      // Positions: 16, 48, 80
      expect(calculateGridAlignedHandlePositions(96, 3)).toEqual([16, 48, 80]);
    });

    it('should calculate equidistant positions for 4 handles', () => {
      // 4 handles, gridSize=16: ideal=96/5=19.2, rounded=16, start=24.
      // Spacing is already at gridSize so parity fix cannot bump down further.
      // In practice BaseNode auto-grows so 4 handles never fit in 96px.
      expect(calculateGridAlignedHandlePositions(96, 4)).toEqual([24, 40, 56, 72]);
    });

    it('should work with larger node sizes', () => {
      // 160px, 3 handles, gridSize=16: ideal=40, rounded=48, span=96, start=32
      // Positions: 32, 80, 128
      expect(calculateGridAlignedHandlePositions(160, 3)).toEqual([32, 80, 128]);
    });

    it('should fix parity when fewer handles share a taller node', () => {
      // 160px node (driven by 3 handles on the other side), 2 handles on this side.
      // ideal=53.33, rounded=48, start=56 (off-grid).
      // Parity fix bumps spacing down to 32: span=32, start=64.
      // Positions: 64, 96 — both on 16px grid, handles stay inward
      expect(calculateGridAlignedHandlePositions(160, 2)).toEqual([64, 96]);
    });

    it('should use custom grid size', () => {
      // 100px, 2 handles, gridSize=10: ideal=33.33, rounded=30, start=35 (off-grid).
      // Parity fix bumps spacing down to 20: span=20, start=40.
      // Positions: 40, 60 (symmetric around 50)
      expect(calculateGridAlignedHandlePositions(100, 2, 10)).toEqual([40, 60]);
    });

    it('should calculate equidistant positions for 5 handles', () => {
      // 5 handles, gridSize=8: ideal=96/6=16, rounded=16, span=64, start=16
      // Positions: 16, 32, 48, 64, 80
      expect(calculateGridAlignedHandlePositions(96, 5, 8)).toEqual([16, 32, 48, 64, 80]);
    });

    it('should distribute even handle counts symmetrically', () => {
      // 80px, 6 handles, gridSize=16: ideal=80/7≈11.43, rounded=16, span=80, start=0.
      // Positions: 0, 16, 32, 48, 64, 80. Midpoint = (0+80)/2 = 40 = nodeSize/2 ✓
      const positions = calculateGridAlignedHandlePositions(80, 6);
      expect(positions).toEqual([0, 16, 32, 48, 64, 80]);
      expect((positions[0]! + positions[positions.length - 1]!) / 2).toBe(40);
    });

    it('should not stack handles when ideal spacing is below half a grid step', () => {
      // 32px, 8 handles, gridSize=8: ideal=32/9≈3.56, rounded=0 → clamped to gridSize=8.
      // Regression: previously every handle landed on the same pixel.
      const positions = calculateGridAlignedHandlePositions(32, 8, 8);
      const unique = new Set(positions);
      expect(unique.size).toBe(positions.length);
    });
  });
});
