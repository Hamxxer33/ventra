import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 min-h-11 px-5",
    "font-display text-pixel uppercase leading-none",
    "border-2 transition-[transform,box-shadow,background-color,color,border-color]",
    "duration-(--motion-quick) ease-(--ease-out)",
    "active:not-disabled:scale-[0.96]",
    "disabled:pointer-events-none disabled:opacity-40",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-fg border-accent shadow-pixel hover:brightness-110",
        secondary:
          "bg-surface text-fg border-border shadow-pixel-sm hover:border-accent hover:text-accent",
        ghost: "bg-transparent text-muted border-transparent hover:text-fg",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, asChild, type = "button", ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
});
