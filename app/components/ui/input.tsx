import * as React from "react"

import { cn } from "~/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startContent, endContent, ...props }, ref) => {
    return (
      <div className={cn(`w-full ${(endContent || startContent) ? 'relative' : ''}`,
        `${(endContent || startContent) ? className : ''}`)}>
        <input
          type={type}
          data-slot="input"
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            `${startContent ? 'pl-10' : ''}`,
            className
          )}
          ref={ref}
          {...props}
        />
        {startContent && (
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
            {startContent}
          </div>
        )}
        {endContent && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endContent}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }