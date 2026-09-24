import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[10px] border-[0.5px] border-border bg-bg px-3 py-2 text-sm text-text-primary shadow-[0_2px_8px_rgba(11,38,36,0.025)] transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-text-secondary/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
        type === "file" &&
          "p-0 pr-3 italic text-text-secondary/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-border file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-text-primary",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
