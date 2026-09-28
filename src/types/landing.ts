// Landing content shapes. Data lives in @/constants/landing; components
// import the types from here.

import type { ComponentProps } from "react";
import type { HugeiconsIcon } from "@hugeicons/react";

export type ValueItem = {
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  title: string;
  body: string;
};

export type StepItem = {
  n: string;
  title: string;
  body: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type NavLink = {
  label: string;
  href: string;
};
