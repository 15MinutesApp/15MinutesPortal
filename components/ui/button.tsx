import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#F869A2] focus-visible:ring-[#F869A2]/50 focus-visible:ring-[3px] aria-invalid:ring-[#F869A2]/20 dark:aria-invalid:ring-[#F869A2]/40 aria-invalid:border-[#F869A2]",
  {
    variants: {
      variant: {
        default: "bg-[#F869A2] text-[#FFFFFF] hover:bg-[#F869A2]/90",
        destructive:
          "bg-[#EA3333FF] text-white hover:bg-[#EA3333FF]/90 focus-visible:ring-[#EA3333FF]/20 dark:focus-visible:ring-[#C26B3B]/40 dark:bg-[#C26B3B]/60",
        outline:
          "border border-[#F5F3F4] bg-[#FFFFFF] shadow-xs hover:bg-[#F869A2] hover:text-[#FFFFFF] dark:bg-[#F5F3F4]/30 dark:border-[#F5F3F4] dark:hover:bg-[#F5F3F4]/50",
        secondary: "bg-[#F8F6F7] text-[#313135] hover:bg-[#F8F6F7]/80",
        ghost:
          "hover:bg-[#F869A2] hover:text-[#FFFFFF] dark:hover:bg-[#F869A2]/50",
        link: "text-[#F869A2] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
