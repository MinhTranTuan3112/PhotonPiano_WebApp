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
    placeholder = 'Chọn ngày',
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
        setDate(selectedDate);
        onChange?.(selectedDate);
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
                                    {format(date.from, "dd/MM/yyyy", { locale: vi })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale: vi })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: vi })
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
