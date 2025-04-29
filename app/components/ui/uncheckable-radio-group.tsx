import { cn } from "~/lib/utils"

type Option = {
    value: string
    label: string
}

type Props = {
    options: Option[]
    value: string | null
    onChange: (value: string | null) => void
    showRadioButtons?: boolean
    defaultValue?: string
}

export function UncheckableRadioGroup({ options, value, onChange, showRadioButtons = true, defaultValue }: Props) {
    const handleChange = (newValue: string) => {
        if (newValue === value) {
            onChange(null)
        } else {
            onChange(newValue)
        }
    }

    return (
        <div className="space-y-3">
            {options.map((option) => {
                const isSelected = value === option.value

                return (
                    <label
                        key={option.value}
                        className={cn(
                            "flex w-full cursor-pointer items-center rounded-xl border-2 p-3 transition-all",
                            isSelected
                                ? "border-blue-500 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                : "border-blue-100 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50",
                            "focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2",
                        )}
                        htmlFor={option.value}
                    >
                        <div className="flex w-full items-center">
                            {showRadioButtons && (
                                <div
                                    className={cn(
                                        "mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                                        isSelected ? "border-white bg-white" : "border-blue-300 bg-white",
                                    )}
                                >
                                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                                </div>
                            )}

                            <span className={cn("flex-1 text-base", isSelected ? "font-medium" : "font-normal")}>{option.label}</span>

                            <input
                                type="radio"
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
