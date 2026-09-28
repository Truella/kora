import { parseAmount } from "@/lib/inputs";
import type { NewGroupValues } from "@/types/circle";

export function validateGroup({
  name,
  description,
  amount,
  threshold,
}: NewGroupValues): Record<string, string> {
  const next: Record<string, string> = {};
  if (name.trim().length < 3)
    next.name = "Give the circle a name (3+ characters).";
  if (name.trim().length > 60)
    next.name = "Keep the name under 60 characters.";
  if (description.trim().length > 280)
    next.description = "Keep the description under 280 characters.";
  if (!/^\d+(\.\d{1,2})?$/.test(amount.replace(/,/g, "")) || parseAmount(amount) <= 0)
    next.amount = "Enter an amount above zero (max 2 decimals).";
  if (threshold < 50 || threshold > 100)
    next.threshold = "Threshold must be between 50 and 100 percent.";
  return next;
}
