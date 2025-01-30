import * as React from "react"

import { cn } from "~/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { Calendar } from "./calendar";
import { vi } from 'date-fns/locale';
import { formatDateToRFC3339 } from "~/lib/utils/datetime";

type Props = {
    defaultValue?: string;
    value?: Date | undefined;
    onChange?: (date: Date | undefined) => void;
} & Omit<React.ComponentProps<"input">, 'defaultValue' | 'type' | 'value'>;

const DatePickerInput = React.forwardRef<HTMLInputElement, Props>(
    ({ className, defaultValue, value, placeholder = 'Chọn ngày', onChange, ...props }, ref) => {

        const [date, setDate] = React.useState<Date | undefined>(defaultValue ? new Date(defaultValue) : undefined);

        React.useEffect(() => {
            setDate(value ? new Date(String(value)) : undefined);
        }, [value]);

        const handleDateChange = (selectedDate: Date | undefined) => {
            setDate(selectedDate);
            onChange?.(selectedDate);
        };

        return (
            <>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal",
                                !date && "text-muted-foreground",
                                className
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>{placeholder}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                {/* <input type="hidden" {...props} ref={ref} defaultValue={formatDateToRFC3339(date)} /> */}
            </>
        )
    }
)
DatePickerInput.displayName = "DatePickerInput"

export { DatePickerInput }