import { Checkbox } from "./checkbox"
import { Label } from "./label"


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

    const handleChange = (changedValue: string, isChecked: boolean) => {
        const newValue = isChecked
            ? [...values, changedValue]
            : values.filter(v => v !== changedValue);
        onChange(newValue);
    };

    return (
        <div className="space-y-2">
            {options.map((option) => (
                <div className="relative group w-full" key={option.value} >
                    <div
                        role="button"
                        className={`w-full border relative p-px font-semibold leading-6 hover:text-white hover:shadow-xl hover:scale-[101%] cursor-pointer rounded-xl transition-transform duration-200 ease-in-out active:scale-95
                                                ${values.includes(option.value) ? 'text-white shadow-xl bg-sky-500' : ''}`}
                                                
                    >
                        <span
                            className="absolute inset-0 rounded-xl bg-sky-500 p-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        ></span>

                        <span className="relative z-10 block px-6 py-3 rounded-xl">
                            <div className="relative z-10 flex items-center space-x-2">
                                <span className="transition-all duration-500 group-hover:translate-x-1 flex flex-row items-center justify-center gap-1">
                                    {showCheckboxes && (
                                        <Checkbox
                                            id={option.value}
                                            checked={values.includes(option.value)}
                                            onCheckedChange={(checked) => handleChange(option.value, checked as boolean)}
                                        />
                                    )}
                                    <Label
                                        htmlFor={option.value}
                                        className="text-sm font-medium leading-none w-full cursor-pointer"
                                    >
                                        {option.label}
                                    </Label>
                                </span>
                            </div>
                        </span>
                    </div>
                </div>
            ))}
        </div>
    )
}

