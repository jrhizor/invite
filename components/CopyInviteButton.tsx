"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

interface CopyButtonProps extends ButtonProps {
  value: string;
  src?: string;
}

export function CopyInviteButton({
  value,
  className,
  src,
  variant = "ghost",
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      variant={variant}
      className={cn(
        "h-6 bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground [&_svg]:h-3 [&_svg]:w-3 px-1",
        className,
      )}
      onClick={() => {
        navigator.clipboard.writeText(value);
        setHasCopied(true);
      }}
      {...props}
    >
      {hasCopied ? <CheckIcon /> : <span className="text-xs">copy link</span>}
    </Button>
  );
}
