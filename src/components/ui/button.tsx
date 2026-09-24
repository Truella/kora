import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-semibold outline-offset-2 transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 motion-reduce:transition-none motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[0_6px_16px_rgba(11,38,36,0.08)] hover:bg-primary-hover",
        destructive:
          "bg-danger text-white shadow-[0_6px_16px_rgba(178,58,46,0.10)] hover:brightness-95",
        outline:
          "border-[0.5px] border-border bg-surface text-text-primary shadow-[0_4px_12px_rgba(11,38,36,0.04)] hover:border-primary/20 hover:bg-black/[0.02]",
        secondary:
          "bg-black/[0.045] text-text-primary hover:bg-black/[0.07]",
        ghost: "text-text-secondary hover:bg-black/[0.04] hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[8px] px-3 text-xs",
        lg: "h-11 rounded-[12px] px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Component = asChild ? Slot : "button";

    return (
      <Component
        ref={ref}
        className={cn(buttonVariants({ className, size, variant }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
export default Button;
