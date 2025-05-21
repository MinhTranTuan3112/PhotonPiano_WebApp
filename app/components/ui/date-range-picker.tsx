import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "~/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { vi } from 'date-fns/locale';

type Props = {
    value?: DateRange | undefined;
    onChange?: (date: DateRange | undefined) => void;
    placeholder?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function DateRangePicker({
    className,
    value,
    placeholder = 'Select date',
    onChange
}: Props) {

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -20),
        to: new Date(),
    });

    React.useEffect(() => {
        setDate(value);
    }, [value]);

    const handleDateChange = (selectedDate: DateRange | undefined) => {
        if (selectedDate) {
            const getUtcPlus7Date = (date: Date) => {
                const utcPlus7 = new Date(date);
                utcPlus7.setHours(7, 0, 0, 0); // Set time to 07:00:00 (UTC+7)
                return utcPlus7;
            };

            const from = selectedDate.from ? getUtcPlus7Date(selectedDate.from) : undefined;
            const to = selectedDate.to ? getUtcPlus7Date(selectedDate.to) : undefined;

            const normalizedRange = { from, to };
            setDate(normalizedRange);

            onChange?.(normalizedRange);
        } else {
            setDate(undefined);
            onChange?.(undefined);
        }
    };

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-1" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", {})} -{" "}
                                    {format(date.to, "dd/MM/yyyy", {})}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", {})
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleDateChange}
                        numberOfMonths={2}
                        locale={vi}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
