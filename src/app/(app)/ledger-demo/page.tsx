import LedgerBook, {
  type LedgerBookCell,
  type LedgerBookMemberTotal,
  type LedgerBookPeriod,
} from "@/app/(app)/groups/[id]/ledger/LedgerBook";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Ledger demo | Kora" };

const NAMES = [
  "Adaeze Okafor",
  "Tunde Bakare",
  "Funmi Adeleke",
  "Chidi Eze",
  "Amina Bello",
  "Segun Ajayi",
  "Ngozi Obi",
  "Ibrahim Musa",
  "Kemi Alabi",
  "Emeka Nwosu",
  "Hafsat Aliyu",
  "Bola Adeyemi",
  "Yemi Ogunleye",
  "Zainab Sule",
  "Femi Ojo",
  "Nkechi Ude",
  "Sani Abdullahi",
  "Tolani Peters",
  "Ifeoma Anyanwu",
  "Dayo Famakin",
];

const TURNS = 20;
const SHARE = 10000;

// Deterministic PRNG so server HTML and client hydration agree.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dueLabel(d: Date) {
  return `Due ${d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`;
}

export default function LedgerDemoPage() {
  const rand = mulberry32(20260926);
  const start = new Date(2026, 6, 29); // Wed 29 Jul 2026, weekly turns
  const settledTurns = 9; // turns 1-8 fully in flight past, turn 9 current

  const periods: LedgerBookPeriod[] = Array.from(
    { length: TURNS },
    (_, ti) => {
      const n = ti + 1;
      const due = new Date(start);
      due.setDate(due.getDate() + ti * 7);
      const recipient = ti % NAMES.length;
      const cells: LedgerBookCell[] = NAMES.map((_, mi) => {
        let status: LedgerBookCell["status"];
        const r = rand();
        if (n < settledTurns) {
          status = r < 0.85 ? "paid" : r < 0.95 ? "late" : "overdue";
        } else if (n === settledTurns) {
          status =
            r < 0.6 ? "paid" : r < 0.7 ? "late" : r < 0.8 ? "overdue" : "pending";
        } else {
          status = "pending";
        }
        return {
          memberId: `demo-m${mi + 1}`,
          status,
          isRecipient: mi === recipient,
        };
      });
      const settledCount = cells.filter(
        (c) => c.status === "paid" || c.status === "late",
      ).length;
      return {
        cycleNumber: n,
        periodLabel: `Turn ${n}`,
        dueLabel: dueLabel(due),
        recipientName: NAMES[recipient],
        expectedCount: NAMES.length,
        settledCount,
        collectedLabel: formatMoney(settledCount * SHARE, "NGN"),
        expectedLabel: formatMoney(NAMES.length * SHARE, "NGN"),
        payoutStatus:
          n < settledTurns ? (n === 5 ? "failed" : "completed") : "pending",
        cells,
      };
    },
  );

  const memberTotals: LedgerBookMemberTotal[] = NAMES.map((name, mi) => {
    const id = `demo-m${mi + 1}`;
    let paid = 0,
      late = 0,
      pending = 0,
      overdue = 0;
    for (const p of periods) {
      const s = p.cells[mi].status;
      if (s === "paid") paid += 1;
      else if (s === "late") late += 1;
      else if (s === "overdue") overdue += 1;
      else if (s === "pending") pending += 1;
    }
    return {
      memberId: id,
      name,
      paid,
      late,
      pending,
      overdue,
      totalPaidLabel: formatMoney((paid + late) * SHARE, "NGN"),
    };
  });

  const rotationExpected = TURNS * NAMES.length * SHARE;
  const rotationCollected = periods.reduce(
    (sum, p) => sum + p.settledCount * SHARE,
    0,
  );
  const payoutsDone = periods.filter(
    (p) => p.payoutStatus === "completed",
  ).length;

  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
      <p className="rounded-[10px] border border-dashed border-border px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
        Demo — 20 members × 20 turns, seeded data, nothing here is real
      </p>
      <LedgerBook
        groupId="demo-ajo-20"
        summary={{
          rotationExpectedLabel: formatMoney(rotationExpected, "NGN"),
          rotationCollectedLabel: formatMoney(rotationCollected, "NGN"),
          outstandingLabel: formatMoney(
            rotationExpected - rotationCollected,
            "NGN",
          ),
          collectionRate: `${Math.round((rotationCollected / rotationExpected) * 100)}%`,
          payoutsCompleted: `${payoutsDone} of ${periods.length}`,
        }}
        members={NAMES.map((name, i) => ({
          id: `demo-m${i + 1}`,
          name,
          position: i + 1,
        }))}
        periods={periods}
        memberTotals={memberTotals}
        expectedPerMemberLabel={formatMoney(TURNS * SHARE, "NGN")}
        empty={false}
      />
    </main>
  );
}
