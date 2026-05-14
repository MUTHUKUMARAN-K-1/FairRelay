import { Check } from 'lucide-react';

interface StepperProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function StepperProgress({ currentStep, totalSteps, steps }: StepperProgressProps) {
  return (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={stepNumber} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-250 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                    : isActive
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/50 ring-4 ring-orange-600/20'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-orange-500' : isCompleted ? 'text-emerald-500' : 'text-gray-500'
                }`}
              >
                {step}
              </span>
            </div>
            
            {/* Connector Line */}
            {stepNumber < totalSteps && (
              <div
                className={`w-16 h-0.5 mx-2 transition-all duration-250 ${
                  stepNumber < currentStep ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
