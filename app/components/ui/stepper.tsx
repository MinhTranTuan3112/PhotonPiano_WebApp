import React from "react";

type Props = {
    steps: string[]; // Array of step labels
    currentStep: number; // Index of the current step (0-based)
    showIndicatorTitle?: boolean; // Whether to show the step label
};

const StepperBar = ({ steps, currentStep, showIndicatorTitle = true }: Props) => {
    return (
        <div className="grid grid-cols-3 gap-4 md:flex items-center w-full">
            {steps.map((step, index) => (
                <React.Fragment key={index}>
                    {/* Step Indicator */}
                    <div className={`flex flex-col items-center justify-center ${currentStep === index ? 'animate-pulse' : ''}`}>
                        <div
                            className={`mb-1 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${index <= currentStep
                                    ? "bg-black text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                        >
                            {index + 1}
                        </div>
                        {showIndicatorTitle && (
                            <div className="text-center text-xs leading-tight">{step}</div>
                        )}
                    </div>

                    {/* Divider Line */}
                    {index < steps.length - 1 && (
                        <div className="hidden md:flex flex-1 -mt-6 h-1 relative overflow-hidden">
                            {/* Base Divider */}
                            <div
                                className={`absolute inset-0 h-full w-full rounded-md ${index < currentStep ? "bg-black" : "bg-gray-200"
                                    }`}
                            ></div>
                            {/* Animated Gradient for Divider Before Current Step */}
                            {index === currentStep - 1 && (
                                <div className="absolute inset-0 h-full w-full rounded-md bg-gradient-to-r from-transparent via-white to-transparent animate-move"></div>
                            )}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

export default StepperBar;
