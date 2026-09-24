"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Transition,
  type Variants,
} from "motion/react";

import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  bounce: 0.1,
  duration: 0.4,
};

type MorphingPopoverContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  uniqueId: string;
  variants?: Variants;
};

const MorphingPopoverContext =
  createContext<MorphingPopoverContextValue | null>(null);

function usePopoverLogic({
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const uniqueId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? uncontrolledOpen;

  const open = useCallback(() => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(true);
    }
    onOpenChange?.(true);
  }, [controlledOpen, onOpenChange]);

  const close = useCallback(() => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(false);
    }
    onOpenChange?.(false);
  }, [controlledOpen, onOpenChange]);

  return { close, isOpen, open, uniqueId };
}

export type MorphingPopoverProps = {
  children: ReactNode;
  transition?: Transition;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variants?: Variants;
  className?: string;
} & ComponentProps<"div">;

function MorphingPopover({
  children,
  className,
  defaultOpen,
  onOpenChange,
  open,
  transition = DEFAULT_TRANSITION,
  variants,
  ...props
}: MorphingPopoverProps) {
  const popoverLogic = usePopoverLogic({
    defaultOpen,
    onOpenChange,
    open,
  });

  return (
    <MorphingPopoverContext.Provider value={{ ...popoverLogic, variants }}>
      <MotionConfig transition={transition}>
        <div
          className={cn("relative flex items-center justify-center", className)}
          key={popoverLogic.uniqueId}
          {...props}
        >
          {children}
        </div>
      </MotionConfig>
    </MorphingPopoverContext.Provider>
  );
}

export type MorphingPopoverTriggerProps = {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
} & ComponentProps<typeof motion.button>;

function MorphingPopoverTrigger({
  asChild = false,
  children,
  className,
  ...props
}: MorphingPopoverTriggerProps) {
  const context = useContext(MorphingPopoverContext);

  if (!context) {
    throw new Error(
      "MorphingPopoverTrigger must be used within MorphingPopover",
    );
  }

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{
      "aria-controls"?: string;
      "aria-expanded"?: boolean;
      "aria-haspopup"?: "dialog" | true;
    }>;

    return (
      <motion.div
        key={context.uniqueId}
        layoutId={`popover-trigger-${context.uniqueId}`}
        onClick={context.open}
      >
        {cloneElement(child, {
          "aria-controls": `popover-content-${context.uniqueId}`,
          "aria-expanded": context.isOpen,
          "aria-haspopup": "dialog",
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      key={context.uniqueId}
      layoutId={`popover-trigger-${context.uniqueId}`}
      onClick={context.open}
    >
      <motion.button
        {...props}
        key={context.uniqueId}
        aria-controls={`popover-content-${context.uniqueId}`}
        aria-expanded={context.isOpen}
        className={className}
        layoutId={`popover-label-${context.uniqueId}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
}

export type MorphingPopoverContentProps = {
  children: ReactNode;
  className?: string;
} & ComponentProps<typeof motion.div>;

function MorphingPopoverContent({
  children,
  className,
  ...props
}: MorphingPopoverContentProps) {
  const context = useContext(MorphingPopoverContext);
  const ref = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error(
      "MorphingPopoverContent must be used within MorphingPopover",
    );
  }

  const { close, isOpen, uniqueId, variants } = context;
  useClickOutside(ref, close);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          {...props}
          ref={ref}
          id={`popover-content-${uniqueId}`}
          key={uniqueId}
          layoutId={`popover-trigger-${uniqueId}`}
          role="dialog"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          className={cn(
            "absolute z-50 overflow-hidden rounded-[20px] border-[0.5px] border-border bg-surface p-2 text-text-primary shadow-[0_20px_60px_rgba(11,38,36,0.16)]",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export {
  MorphingPopover,
  MorphingPopoverContent,
  MorphingPopoverTrigger,
};
