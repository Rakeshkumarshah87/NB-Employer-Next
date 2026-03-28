import React from 'react';
import styles from '@/styles/JobStepper.module.css';

interface JobStepperProps {
  currentStep: number; // 1 to 4
  onStepClick?: (stepId: number) => void;
  maxWidth?: string;
}

const steps = [
  { id: 1, label: 'Job details' },
  { id: 2, label: 'Candidate Requirements' },
  { id: 3, label: 'Interview Information' },
  { id: 4, label: 'Review & Guidelines' }
];

const JobStepper: React.FC<JobStepperProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className={styles.stepperWrapper}>
      <div className={styles.stepper}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`${styles.step} ${currentStep === step.id ? styles.stepActive : ''} ${onStepClick ? styles.stepClickable : ''}`}
              onClick={() => {
                if (onStepClick && currentStep !== step.id) {
                  onStepClick(step.id);
                }
              }}
              style={{ cursor: onStepClick ? 'pointer' : 'default' }}
            >
              <div className={styles.stepCircle}>{step.id}</div>
              {currentStep === step.id && (
                <span className={styles.stepLabel}>{step.label}</span>
              )}
            </div>
            {index < steps.length - 1 && <div className={styles.stepLine} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default JobStepper;
