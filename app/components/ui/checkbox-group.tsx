import { cn } from "~/lib/utils"
import { Check } from "lucide-react"

type Option = {
    value: string
    label: string
}

type Props = {
    options: Option[]
    values: string[]
    onChange: (value: string[]) => void
    showCheckboxes?: boolean
}

export default function CheckboxGroup({ options, values, onChange, showCheckboxes = true }: Props) {
    const handleChange = (changedValue: string) => {
        const isCurrentlySelected = values.includes(changedValue)
        const newValues = isCurrentlySelected ? values.filter((v) => v !== changedValue) : [...values, changedValue]
        onChange(newValues)
    }

    return (
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = values.includes(option.value)
                // Alternate between slightly different blue gradients for visual interest
                const gradientClass = index % 2 === 0 ? "from-blue-500 to-blue-600" : "from-blue-600 to-blue-500"

                return (
                    <label
                        key={option.value}
                        className={cn(
                            "flex w-full cursor-pointer items-center rounded-xl border-2 p-3 transition-all",
                            isSelected
                                ? `border-blue-500 bg-gradient-to-r ${gradientClass} text-white shadow-md`
                                : "border-blue-100 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50",
                            "focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2",
                        )}
                        htmlFor={option.value}
                    >
                        <div className="flex w-full items-center">
                            {showCheckboxes && (
                                <div
                                    className={cn(
                                        "mr-3 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                                        isSelected ? "border-white bg-blue-700" : "border-blue-300 bg-white",
                                    )}
                                >
                                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                </div>
                            )}

                            <span className={cn("flex-1 text-base", isSelected ? "font-medium" : "font-normal")}>{option.label}</span>

                            <input
                                type="checkbox"
                                id={option.value}
                                value={option.value}
                                checked={isSelected}
                                onChange={() => handleChange(option.value)}
                                className="sr-only"
                                aria-labelledby={`${option.value}-label`}
                            />
                        </div>
                    </label>
                )
            })}
        </div>
    )
}
