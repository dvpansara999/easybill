import * as React from "react"

import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-muted/70 eb-skeleton-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
