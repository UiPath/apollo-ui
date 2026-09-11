"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { revealSchedule } from "../../motion";

type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * Clears every pending timer. Declared at module scope rather than as a
 * hook-local closure so its identity is stable: as a `useCallback` it would
 * trip this repo's ban on manual memoization, and as a plain inner function
 * it would take a new identity each render and restart the sequence from the
 * effect that depends on it.
 */
function clearTimers(timers: RefObject<TimerHandle[]>): void {
  for (const id of timers.current) clearTimeout(id);
  timers.current = [];
}

/** What the panel may render at this point in the sequence. */
export interface StagedReveal {
  /** The eyebrow, the phase and time line, leads the sequence. */
  eyebrow: boolean;
  /** Whether finding `index`'s label has been revealed. */
  label: (index: number) => boolean;
  /** Whether finding `index`'s supporting detail has been revealed. */
  detail: (index: number) => boolean;
  /** Whether finding `index`'s status icon has resolved. */
  icon: (index: number) => boolean;
  /** Suggested question chips land last. */
  chips: boolean;
  /**
   * Stops the sequence and puts everything on screen at once. For the user
   * moving the conversation on: the findings are still worth having, they
   * just stop trickling.
   */
  settle: () => void;
  /**
   * Stops the sequence and reveals nothing further. For the panel closing:
   * it stays mounted through its exit animation, so without this its timers
   * would keep inserting findings into a panel on its way out.
   */
  halt: () => void;
}

interface Options {
  /** How many findings the sequence has to get through. */
  count: number;
  /** False holds the sequence at its start, e.g. before the panel opens. */
  active: boolean;
  /**
   * Renders the whole sequence immediately, with nothing animated and
   * nothing merely shortened. Pass the reduced-motion preference here.
   */
  immediate: boolean;
  /** Fires once, when the last finding's icon resolves. */
  onComplete?: () => void;
}

/**
 * Reveals a findings list one part at a time: the phase label, then each
 * finding's own label, its supporting detail, and its status icon, then the
 * chips. Timing comes from `revealSchedule`, so nothing here picks a
 * duration.
 *
 * Cancelling clears every pending timer and settles the sequence to its
 * final state at once. Settling rather than freezing is deliberate: a
 * half-revealed findings list left behind by a user asking a question mid
 * sequence would read as content that failed to arrive, and a later timer
 * firing into a changed thread would insert content out of order.
 */
export function useStagedReveal({
  count,
  active,
  immediate,
  onComplete,
}: Options): StagedReveal {
  /**
   * The beats that have fired, by index.
   *
   * Not a monotonic counter. A counter assumes the beats are scheduled in
   * chronological order, which stopped being true once a finding carried
   * three beats instead of two: the array runs label, detail, icon per
   * finding, so finding 0's icon (one beat after its own detail) is
   * scheduled later in time than finding 2's label. A counter therefore
   * moved backwards when an earlier finding's icon landed, un-revealing the
   * findings after it, which read as the group replaying itself.
   */
  const [fired, setFired] = useState<ReadonlySet<number>>(() => new Set());
  const [settled, setSettled] = useState(false);
  const [halted, setHalted] = useState(false);
  const timers = useRef<TimerHandle[]>([]);
  /**
   * Mirrors `halted` for the timer callbacks to read.
   *
   * Clearing the pending timers is not on its own enough: the effect that
   * schedules them re-runs whenever the findings change, and a run that
   * started before the halt can schedule a fresh batch that the halt's own
   * `clearTimers` never saw. A halted sequence was still inserting its next
   * finding one stagger step after the panel closed. State cannot close
   * that gap because a timer callback reads the state of the render that
   * created it; a ref is read at fire time, so this is the authority.
   */
  const haltedRef = useRef(false);
  // Held in a ref so a caller passing a fresh closure each render does not
  // restart the sequence.
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const settle = () => {
    clearTimers(timers);
    setSettled(true);
  };

  const halt = () => {
    haltedRef.current = true;
    clearTimers(timers);
    setHalted(true);
  };

  useEffect(() => {
    // Halting is one-way for the life of this hook. The panel unmounts when
    // it closes, so reopening it mounts a fresh sequence; within one panel
    // lifetime there is no legitimate reason to un-halt. Clearing the flag
    // here instead let a momentary dip in `active`, which happens when
    // another step's entry briefly becomes the current one, revive a
    // sequence that had already been halted by the close and insert a
    // finding into a panel on its way out.
    if (haltedRef.current) {
      clearTimers(timers);
      return;
    }

    if (!active) {
      clearTimers(timers);
      setFired(new Set());
      setSettled(false);
      return;
    }

    if (immediate) {
      setSettled(true);
      completeRef.current?.();
      return;
    }

    const schedule = revealSchedule(count);
    // One timer per beat, in order: each finding's label, its detail, its
    // icon, then the chips. `stage` counts beats, so each timer only has to
    // advance it. The phase label is not in here: it leads at zero, so
    // giving it a 0ms timer would only cost it a frame.
    const beats: number[] = [
      ...schedule.findings.flatMap((beat) => [
        beat.label,
        beat.detail,
        beat.icon,
      ]),
      schedule.chips,
    ];

    timers.current = beats.map((at, index) =>
      setTimeout(() => {
        // Checked at fire time, not at schedule time, so a timer that
        // outlived a halt cannot advance the sequence.
        if (haltedRef.current) return;
        setFired((prev) => new Set(prev).add(index));
        // The chips are the last beat in time as well as in the array, so
        // this still marks the end of the sequence.
        if (index === beats.length - 1) completeRef.current?.();
      }, at * 1000),
    );

    return () => clearTimers(timers);
  }, [active, count, immediate, halted]);

  // Beat layout, mirroring the order the timers were scheduled in:
  //   3i        finding i label
  //   3i + 1    finding i detail
  //   3i + 2    finding i icon
  //   3*count   chips
  // Halting wins over settling: nothing new appears once the surface is on
  // its way out, whatever else asked for it.
  const reveal = (beat: number) =>
    halted || haltedRef.current ? fired.has(beat) : settled || fired.has(beat);

  return {
    // The eyebrow leads the sequence, so it is on screen as soon as the
    // sequence is running at all. Halting does not take it back down: it is
    // already on screen, and removing it mid-exit would only read as a
    // flicker on the way out.
    eyebrow: settled || active,
    label: (index) => reveal(3 * index),
    detail: (index) => reveal(3 * index + 1),
    icon: (index) => reveal(3 * index + 2),
    chips: reveal(3 * count),
    settle,
    halt,
  };
}
