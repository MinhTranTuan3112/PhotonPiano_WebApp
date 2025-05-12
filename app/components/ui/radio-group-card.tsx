import React from 'react'
import * as RadioGroup from "@radix-ui/react-radio-group";
import { CircleCheck } from 'lucide-react';
import { cn } from '~/lib/utils';

type Props = {
    value?: string | undefined;
    onValueChange?: ((value: string) => void) | undefined;
    options: {
        label: string | React.ReactNode;
        value: string;
        description?: string;
    }[];
    orientation?: "horizontal" | "vertical";
}

export default function RadioGroupCards({
    value,
    onValueChange,
    options,
    orientation = 'horizontal'
}: Props) {
    return (
        <RadioGroup.Root
            defaultValue={options[0].value}
            className={`max-w-md w-full ${orientation === 'horizontal' ? `grid grid-cols-${options.length}` : 'flex flex-col'} gap-4`}
            value={value}
            onValueChange={onValueChange}
        >
            {options.map((option) => (
                <RadioGroup.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                        "relative group ring-[1px] ring-border rounded py-2 px-3 text-start",
                        "data-[state=checked]:ring-2 data-[state=checked]:ring-theme"
                    )}
                >
                    <CircleCheck className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-6 w-6 text-primary fill-theme stroke-white group-data-[state=unchecked]:hidden" />
                    <span className="font-semibold tracking-tight">{option.label}</span>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                </RadioGroup.Item>
            ))}
        </RadioGroup.Root>
    )
}