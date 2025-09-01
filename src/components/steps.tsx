import React from 'react';
import { cn } from "@/lib/utils";

const Steps = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep - 1;
        const isCurrent = index === currentStep - 1;

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2",
                  isCompleted ? "bg-green-500 border-green-500 text-white" :
                  isCurrent ? "border-blue-500 text-blue-500" :
                  "border-gray-300 text-gray-300"
                )}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className={cn(
                "text-xs mt-1",
                isCompleted ? "text-green-500" :
                isCurrent ? "text-blue-500" :
                "text-gray-500"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5",
                  index < currentStep - 1 ? "bg-green-500" : "bg-gray-300"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Steps;