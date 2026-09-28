// Landing copy and link data. Extracted from the section components so
// content edits don't touch UI files.

import {
  UserGroupIcon,
  Activity01Icon,
  Wallet01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import type {
  FaqItem,
  NavLink,
  StepItem,
  ValueItem,
} from "@/types/landing";

export const CREATE_HREF = "/login?next=/groups/new";

export const NAV_LINKS: NavLink[] = [
  { label: "Why Kora", href: "#why-kora" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export const PRODUCT_LINKS: NavLink[] = [
  { label: "Why Kora", href: "#why-kora" },
  { label: "How it works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export const VALUE: ValueItem[] = [
  {
    icon: UserGroupIcon,
    title: "Everyone gets a say.",
    body: "Invite someone, then let the circle decide. New members join only after the group approves them.",
  },
  {
    icon: Activity01Icon,
    title: "Everyone sees the same record.",
    body: "Contributions, payouts, and the circle's activity live in one shared record.",
  },
  {
    icon: Wallet01Icon,
    title: "The payout order is clear from day one.",
    body: "Set contributions and payout order once. Everyone knows what they owe, when it is due, and who receives next.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Everyone stays on schedule.",
    body: "Automatic reminders keep contributions moving so one missed payment doesn't hold up the circle.",
  },
];

export const STEPS: StepItem[] = [
  {
    n: "01",
    title: "Create your circle",
    body: "Set the contribution amount, schedule, and payout order.",
  },
  {
    n: "02",
    title: "Invite your people",
    body: "Share an invite with the people you already trust.",
  },
  {
    n: "03",
    title: "Let the group vote",
    body: "Every new member request goes to the circle for approval.",
  },
  {
    n: "04",
    title: "Contribute on schedule",
    body: "Members know what they owe and when it is due. Reminders keep everyone on track.",
  },
  {
    n: "05",
    title: "Track every payout",
    body: "See contributions, payouts, and the next turn from one shared record.",
  },
];

export const FAQS: FaqItem[] = [
  {
    q: "Who can join a circle?",
    a: "Only people you invite can request to join, and every request goes to a member vote. The people in the circle decide who joins.",
  },
  {
    q: "Who holds the money?",
    a: "No single member holds the group's money. The organizer sets up the circle and manages the schedule, but doesn't collect or keep everyone's contributions. Contributions and payouts are recorded in a shared ledger that every member can see.",
  },
  {
    q: "How do payouts work?",
    a: "The contribution amount, schedule, and payout order are set when the circle is created. Members contribute according to that schedule, and each member receives the group's payout when their turn comes. The full history is recorded in the shared ledger.",
  },
  {
    q: "What happens if someone misses a payment?",
    a: "Automatic reminders help members stay on schedule. If someone misses a contribution, the shared record makes it visible to everyone in the circle.",
  },
  {
    q: "Can I create a circle with people who haven't saved together before?",
    a: "Yes. Your members don't need to have an existing savings history together. What matters is that the group is built around people who know or trust each other. You create the circle, invite them, and members vote on who joins.",
  },
  {
    q: "Which countries are supported?",
    a: "Kora currently supports savings circles in Nigeria, Kenya, Uganda, and Ghana.",
  },
];
