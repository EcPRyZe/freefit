import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none outline-none transition-[transform,background-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-[0_0_0_2px_var(--color-bg),0_0_0_4px_var(--color-primary)]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:brightness-110",
        secondary: "bg-raised text-fg hover:bg-raised/80",
        ghost: "bg-transparent text-fg hover:bg-raised",
        outline: "shadow-border text-fg hover:bg-raised",
        danger: "bg-danger text-primary-fg",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-md",
        md: "h-11 px-4 text-sm rounded-lg",
        lg: "h-12 px-5 text-base rounded-xl",
        xl: "h-14 px-6 text-base rounded-2xl",
        icon: "size-11 rounded-lg",
        "icon-sm": "size-9 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
