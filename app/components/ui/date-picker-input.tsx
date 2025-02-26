import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

type Props = {
    defaultValue?: string
    value?: Date | undefined
    onChange?: (date: Date | undefined) => void
} & Omit<React.ComponentProps<"input">, "defaultValue" | "type" | "value">

const DatePickerInput = React.forwardRef<HTMLInputElement, Props>(
    ({ className, defaultValue, value, placeholder = "Chọn ngày", onChange, ...props }, ref) => {
        const [date, setDate] = React.useState<Date | undefined>(defaultValue ? new Date(defaultValue) : undefined)
        const [year, setYear] = React.useState<number>(date?.getFullYear() || new Date().getFullYear())
        const [month, setMonth] = React.useState<number>(date?.getMonth() || new Date().getMonth())

        React.useEffect(() => {
            setDate(value ? new Date(String(value)) : undefined)
        }, [value])

        const handleDateChange = (selectedDate: Date | undefined) => {
            setDate(selectedDate)
            if (selectedDate) {
                setMonth(selectedDate.getMonth())
                setYear(selectedDate.getFullYear())
            }
            onChange?.(selectedDate)
        }

        const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i)

        return (
            <>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("justify-start text-left font-normal", !date && "text-muted-foreground", className)}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "dd/MM/yyyy", { locale: vi }) : <span>{placeholder}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="flex items-center justify-between space-x-2 border-b p-3">
                            <Select value={year.toString()} onValueChange={(value) => setYear(Number.parseInt(value))}>
                                <SelectTrigger className="h-7 max-w-32 mx-auto">
                                    <SelectValue>Năm {year}</SelectValue>
                                </SelectTrigger>
                                <SelectContent position="popper">
                                    {years.map((year) => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}
                            month={new Date(year, month)}
                            onMonthChange={(date) => {
                                setMonth(date.getMonth())
                                setYear(date.getFullYear())
                            }}
                            initialFocus
                            locale={vi}
                        />
                    </PopoverContent>
                </Popover>
            </>
        )
    },
)
DatePickerInput.displayName = "DatePickerInput"

export { DatePickerInput }

