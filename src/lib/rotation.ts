// Copy for "when do I collect the pot".
//
// Every member collects exactly once, in `payout_position` order, so this is
// one fact with one wording — it was previously rendered four times across
// three files as `Your turn: X of Y`, `Your round X of Y` and `Yours Turn N`,
// which had already drifted into three variants.
//
// This started as `You collect first` / `You collect last` and moved to the
// address instead, for three reasons:
//
//  1. "turn" is already how this app names a slot in the rotation — the hero
//     heading, the members panel (`Collects turn 3`) and the directory footer
//     (`Your payout Turn 2`) all use it. Addressing the copy the same way makes
//     the position line agree with the rest of the screen instead of
//     introducing a rival framing for the same number.
//  2. "first" and "last" are ranks; they say nothing about *when*, and every
//     position in between needed an ordinal to be stated at all. `turn 3` is
//     one form for every position.
//  3. A rank needs a denominator ("3rd of 5") and the denominator was a
//     liability: `rotationTotal` means scheduled turns in the home snapshot
//     but active members on the circle page, and a member who leaves leaves a
//     gap in `payout_position`, so a survivor can hold slot 5 in a 4-member
//     roster — which would have printed "5 of 4". An address has no
//     denominator to get wrong. Turn 5 is turn 5 either way.

/**
 * The turn the caller collects on, as a sentence.
 *
 * Returns null when there is no position to state — before the rotation is
 * scheduled, `payout_position` is null. Callers render nothing rather than
 * guess. A position is used as-is even if it sits outside the current active
 * roster, because a departed member's slot is still a real slot: the members
 * panel prints the same number as `Collects turn N`, so the two agree.
 *
 * Tense follows the rotation: when `currentTurn` names the turn in flight,
 * a position behind it already paid out, so it reads past ("You've collected
 * on turn 1"); the current and future turns read present ("You collect on
 * turn 2"). `currentSettled` covers the all-settled edge where the hero
 * shows the last turn with a Settled state — position equals current but the
 * money already moved. Omit both when there is no turn in flight (unscheduled
 * circles) and the line stays present tense.
 */
export function collectTurnLabel(
  position: number | null | undefined,
  currentTurn?: number | null | undefined,
  currentSettled?: boolean,
): string | null {
  if (position == null) return null;
  if (!Number.isInteger(position) || position < 1) return null;
  if (
    typeof currentTurn === "number" &&
    Number.isInteger(currentTurn) &&
    currentTurn >= 1
  ) {
    if (
      position < currentTurn ||
      (position === currentTurn && currentSettled === true)
    ) {
      return `You've collected on turn ${position}`;
    }
  }
  return `You collect on turn ${position}`;
}
