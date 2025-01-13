import React, { FC } from "react";

interface StepperBarProps {
    steps: string[]; // Array of step labels
    currentStep: number; // Index of the current step (0-based)
}

const StepperBar: FC<StepperBarProps> = ({ steps, currentStep }) => {
    return (
        <div className="flex items-center w-full">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    {/* Step Indicator */}
                    <div className="flex flex-col items-center justify-center">
                        <div
                            className={`mb-1 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${index <= currentStep
                                ? "bg-black text-white"
                                : "bg-gray-200 text-gray-700"
                                }`}
                        >
                            {index + 1}
                        </div>
                        <div className="text-center text-xs leading-tight max-w-16">{step}</div>
                    </div>


                    {/* Divider Line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`flex-1 -mt-6 h-1 transition-colors rounded-md ${index < currentStep ? "bg-black" : "bg-gray-200"
                                }`}
                        ></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default StepperBar;
