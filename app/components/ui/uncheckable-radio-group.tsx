import { cn } from "~/lib/utils";
import { Label } from "./label";

type Props = {
    options: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string | null) => void;
    showRadioButtons?: boolean;
    defaultValue?: string;
}

export function UncheckableRadioGroup({ options, value, onChange, showRadioButtons = false, defaultValue }: Props) {

    const handleChange = (newValue: string) => {
        if (newValue === value) {
            onChange(null)
        } else {
            onChange(newValue)
        }
    }

    return (
        <div className="space-y-2">
            {options.map((option) => (
                
                    <div className="relative group w-full" onClick={() => handleChange(option.value)} key={option.value}>
                        <button
                            type="button"
                            className={`w-full border relative p-px font-semibold leading-6 hover:text-white hover:shadow-xl hover:scale-[101%] cursor-pointer rounded-xl transition-transform duration-200 ease-in-out active:scale-95
                                ${value === option.value ? 'text-white shadow-xl bg-sky-500': ''}`}
                        >
                            <span
                                className="absolute inset-0 rounded-xl bg-sky-500 p-[2px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            ></span>

                            <span className="relative z-10 block px-6 py-3 rounded-xl">
                                <div className="relative z-10 flex items-center space-x-2">
                                    <span className="transition-all duration-500 group-hover:translate-x-1">{
                                        showRadioButtons && (
                                            <div
                                                className={cn(
                                                    "rounded-full border",
                                                    value === option.value && "border-primary bg-primary"
                                                )}
                                            >
                                                {value === option.value && (
                                                    <div className="h-full w-full rounded-full bg-white" style={{ transform: 'scale(0.5)' }} />
                                                )}
                                            </div>
                                        )
                                    }
                                        <Label htmlFor={option.value} className="text-base cursor-pointer">{option.label}</Label></span>
                                </div>
                            </span>
                        </button>
                    </div>
                   
                
            ))}
        </div>
    )
}

