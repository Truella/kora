// Copy for "where do I stand in the collector queue".
//
// Every member collects the pot exactly once, in `payout_position` order, so
// this is one fact with one wording — previously rendered four times across
// three files as `Your turn: X of Y`, `Your round X of Y` and `Yours Turn N`,
// which had already drifted into three variants.
//
// Two reasons the old phrasing failed, both fixed here:
//
//  1. A bare `1 of 2` reads as a fraction, not a rank. It is an ordinal
//     position, so it gets an ordinal suffix.
//  2. First and last — the only two positions a member can act on — came out
//     looking identical to the ones in between. They are named instead.
//
// The verb is "collect" because that is what this app already calls taking
// the pot (the members panel says `Collects turn 3`), and because "turn" is
// already double-booked: on the circle hero it means both *your place in the
// rotation* and *you are collecting this turn*. Saying "You collect first"
// next to a "Turn 3" heading stops the two meanings bleeding into each other.

/**
 * English ordinal suffix. Only the last two digits decide the ending, and the
 * teens are the exception: 11/12/13 take "th" even though 1/2/3 take
 * "st"/"nd"/"rd".
 */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * The caller's place in the collector queue, as a sentence.
 *
 * Returns null — meaning render nothing rather than guess — when there is no
 * position to state: before the rotation is scheduled (`payout_position` is
 * null), or when the position falls outside the total. The second case is
 * real, not defensive: a member who leaves leaves a gap in `payout_position`,
 * so a survivor can hold slot 5 in a 4-member roster. "5 of 4" would be a lie
 * and "5th" would contradict the members list, so the line goes away and the
 * members panel keeps the slot.
 */
export function collectPositionLabel(
  position: number | null | undefined,
  total: number | null | undefined,
): string | null {
  if (position == null || total == null) return null;
  if (position < 1 || total < 1) return null;
  if (position > total) return null;
  if (total === 1) return "You collect the whole pot";
  if (position === 1) return "You collect first";
  if (position === total) return "You collect last";
  return `You collect ${ordinal(position)} of ${total}`;
}
