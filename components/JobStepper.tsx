import React from 'react';
import styles from '@/styles/JobStepper.module.css';

interface JobStepperProps {
  currentStep: number; // 1 to 4
  maxWidth?: string;
}

const steps = [
  { id: 1, label: 'Job details' },
  { id: 2, label: 'Candidate Requirements' },
  { id: 3, label: 'Interview Information' },
  { id: 4, label: 'Review & Guidelines' }
];

const JobStepper: React.FC<JobStepperProps> = ({ currentStep }) => {
  return (
    <div className={styles.stepperWrapper}>
      <div className={styles.stepper}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`${styles.step} ${currentStep === step.id ? styles.stepActive : ''}`}>
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
