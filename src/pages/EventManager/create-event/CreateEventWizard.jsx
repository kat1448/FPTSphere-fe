// src/pages/EventManager/CreateEventWizard/CreateEventWizard.jsx
import React, { useState } from "react";
import Stepper from "./components/Stepper";
import Step1MainEvent from "./steps/Step1MainEvent";
import Step2SubEvents from "./steps/Step2SubEvents";
import Step3Resources from "./steps/Step3Resources";
import Step4Tasks from "./steps/Step4Tasks";
import Step5Review from "./steps/Step5Review";
import "./CreateEventWizard.css";

export default function CreateEventWizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="cew-wrap">
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <h1 className="cew-title">Create Main Event</h1>
      </div>

      <Stepper step={step} />

      {step === 1 && <Step1MainEvent onNext={() => setStep(2)} />}
      {step === 2 && <Step2SubEvents onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
      {step === 3 && <Step3Resources onPrev={() => setStep(2)} onNext={() => setStep(4)} />}
      {step === 4 && <Step4Tasks onPrev={() => setStep(3)} onNext={() => setStep(5)} />}
      {step === 5 && <Step5Review onPrev={() => setStep(4)} />}
    </div>
  );
}
