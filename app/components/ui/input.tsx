import * as React from "react"

import { cn } from "~/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, startContent, endContent, ...props }, ref) => {
    return (
      <div className={`w-full ${(endContent || startContent) ? 'relative' : ''}`}>
        <input
          type={type}
          className={cn(
            `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm
            ${startContent ? 'pl-10' : ''}`,
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