import * as React from "react"

import { cn } from "~/lib/utils"
import { Eye, EyeOff } from 'lucide-react'

type PasswordInputProps = React.ComponentProps<"input"> & {

};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, ...props }, ref) => {

        const [isVisible, setIsVisible] = React.useState(false);

        return (
            <div className="relative">
                <input
                    type={isVisible ? 'text' : 'password'}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    onClick={() => setIsVisible(!isVisible)}>
                    {isVisible ? <EyeOff /> : <Eye />}
                </div>
            </div>
        )
    }
);

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }