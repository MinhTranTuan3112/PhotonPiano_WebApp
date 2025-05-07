import React, { useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';
import { cn } from '~/lib/utils';

type Props = {
    items: {
        value: string;
        label: string | React.ReactNode;
    }[];
    className?: string;
    onChange?: (value: string) => void;
    value?: string;
    placeholder?: string;
    emptyText?: string;

}

export default function Combobox({ items, onChange, className, placeholder = 'Select', emptyText = 'Not found.', value: controlledValue,
}: Props) {

    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState('');

    useEffect(() => {

        setValue(controlledValue || '');

        return () => {

        }

    }, [controlledValue]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('justify-between', className)}
                >
                    {(value && value != '')
                        ? items.find((item) => item.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 max-h-72 overflow-y-auto  popover-content-width-full">
                <Command className={className}>
                    <CommandInput placeholder={placeholder} onValueChange={onChange} />
                    <CommandList className="max-h-60 overflow-y-auto">
                        {items?.length ? (
                            items.map((item) => (
                                <CommandItem
                                    key={item.value}
                                    onSelect={() => {
                                        setValue(item.value);
                                        onChange?.(item.value);
                                        setOpen(false);
                                    }}
                                >
                                    {item.label}
                                </CommandItem>
                            ))
                        ) : (
                            <CommandEmpty>{emptyText}</CommandEmpty>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}