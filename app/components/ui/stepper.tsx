import React from "react"
import { cn } from "~/lib/utils"

type Props = {
    steps: string[] // Array of step labels
    currentStep: number // Index of the current step (0-based)
    showIndicatorTitle?: boolean // Whether to show the step label
}

const StepperBar = ({ steps, currentStep, showIndicatorTitle = true }: Props) => {
    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        {/* Step Indicator */}
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full font-medium text-base border-2 transition-all",
                                    index < currentStep
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : index === currentStep
                                            ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200"
                                            : "bg-white text-blue-900 border-blue-200",
                                )}
                            >
                                {index + 1}
                            </div>
                            {showIndicatorTitle && (
                                <div
                                    className={cn(
                                        "text-center text-sm mt-2 max-w-[120px]",
                                        index === currentStep ? "text-theme font-medium" : "text-gray-600",
                                    )}
                                >
                                    {step}
                                </div>
                            )}
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className="flex-1 mx-2">
                                <div className="h-1 relative rounded-full overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-100 w-full h-full"></div>
                                    <div
                                        className={cn(
                                            "absolute inset-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300",
                                        )}
                                        style={{ width: index < currentStep ? "100%" : index === currentStep ? "50%" : "0%" }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}

export default StepperBar
