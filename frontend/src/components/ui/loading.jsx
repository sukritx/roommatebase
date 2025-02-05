import React from 'react';
import { cn } from "@/lib/utils";

const Loading = ({
  className,
  size = "w-6 h-6",
}) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          size
        )}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export { Loading };
