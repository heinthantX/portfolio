import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import type * as React from "react";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-md border border-transparent font-mono text-[0.8125rem] whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-enter)] select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-signal-strong",
        secondary: "border-line-strong text-text hover:border-signal hover:text-signal-strong",
        outline: "border-line-strong text-text hover:border-signal hover:text-signal-strong",
        ghost: "text-muted-foreground hover:bg-surface-2 hover:text-text",
        destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25",
        link: "text-signal-strong underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-2 px-4",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-12 gap-2 px-6",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {/* Label keeps its width while loading; the spinner overlays it. */}
      <span className={cn("inline-flex items-center gap-[inherit]", loading && "invisible")}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
