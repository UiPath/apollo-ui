import type { ComponentPropsWithoutRef } from 'react';
import { useId } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib';

export interface AnimatedGradientIconProps
  extends ComponentPropsWithoutRef<'span'> {
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
  colorMid?: string;
}

/**
 * Sparkles icon with animated gradient stroke for Ideas experiment.
 * Uses the Lucide Sparkles icon with gradient applied via stroke.
 */
export function AnimatedGradientIcon({
  className,
  speed = 1,
  colorFrom = '#22d3ee',
  colorTo = '#0891b2',
  colorMid = '#FA4616',
  style,
  ...props
}: AnimatedGradientIconProps) {
  const duration = 8 / speed;
  const gradientId = `ideas-sparkles-${useId().replace(/:/g, '-')}`;
  return (
    <span
      className={cn('inline-block shrink-0', className)}
      style={style}
      {...props}
    >
      {/* Hidden SVG holds gradient defs for url() reference */}
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="72"
            y1="12"
            y2="12"
          >
            <stop offset="0%" stopColor={colorFrom} />
            <stop offset="33%" stopColor={colorMid} />
            <stop offset="66%" stopColor={colorTo} />
            <stop offset="100%" stopColor={colorFrom} />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="0 0; -48 0"
              dur={`${duration}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles
        stroke={`url(#${gradientId})`}
        className="size-full"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      />
    </span>
  );
}

export interface AnimatedGradientTextProps
  extends ComponentPropsWithoutRef<'div'> {
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
  colorMid?: string;
}

/**
 * Animated gradient text effect for Ideas experiment.
 * Based on Magic UI: https://magicui.design/docs/components/animated-gradient-text
 */
export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = '#22d3ee',
  colorTo = '#0891b2',
  colorMid,
  style,
  ...props
}: AnimatedGradientTextProps) {
  const duration = 8 / speed;
  const gradient =
    colorMid != null
      ? `linear-gradient(to right, ${colorFrom}, ${colorMid}, ${colorTo}, ${colorFrom})`
      : `linear-gradient(to right, ${colorFrom}, ${colorTo}, ${colorFrom})`;
  return (
    <div
      className={cn('inline-block bg-clip-text text-transparent', className)}
      style={{
        backgroundImage: gradient,
        backgroundSize: '300% 100%',
        animation: `ideas-gradient ${duration}s linear infinite`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
