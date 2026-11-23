import { NODE_BADGE_INSET_CIRCLE, NODE_BADGE_INSET_SQUARE } from '../../constants';
import { isRoundEndedShape, type NodeShape } from '../../schema';

/**
 * How far a corner badge sits in from the node's edge. A pill's ends are as round as a circle
 * (`rounded-full`), so it takes the circle's inset, which keeps a badge inside the round end of a
 * default-height (96px) pill. Taller pills have rounder ends, so a badge can still touch them.
 */
export const getNodeBadgeInset = (shape?: NodeShape): number =>
  shape === 'circle' || isRoundEndedShape(shape)
    ? NODE_BADGE_INSET_CIRCLE
    : NODE_BADGE_INSET_SQUARE;
