
export const DUE_SOON_DAYS = 3;

// Settled is defined once and pushed into the query as a filter, so the
// in-memory code never has to re-test the same condition the database already
// applied. A JS-side `SETTLED` set would only be a second place for the rule to
// drift out of sync with the SQL.
export const SETTLED_STATUSES: string[] = ["paid", "late"];
