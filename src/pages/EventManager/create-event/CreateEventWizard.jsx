// src/pages/EventManager/CreateEventWizard/CreateEventWizard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, ConfigProvider } from "antd";
import Stepper from "./components/Stepper";
import Step1MainEvent from "./steps/Step1MainEvent";
import Step2SubEvents from "./steps/Step2SubEvents";
import Step3Resources from "./steps/Step3Resources";
import Step4Tasks from "./steps/Step4Tasks";
import Step5Review from "./steps/Step5Review";
import "./CreateEventWizard.css";

const { Title } = Typography;

export default function CreateEventWizard() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#F2721E",
        },
      }}
    >
      <div style={{ padding: "16px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <div style={{ marginBottom: "16px" }}>
            <Title level={2} style={{ textAlign: "left", marginBottom: "8px", marginTop: 0, color: "#F2721E", fontWeight: 700 }}>
              Create New Event
            </Title>
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
              Fill in the details below to set up your upcoming event. You can edit this later.
            </p>
          </div>

          <Stepper step={step} />

          <Card style={{ marginTop: "16px", padding: 0, borderRadius: "12px" }}>
            {step === 1 && <Step1MainEvent onNext={() => setStep(2)} />}
            {step === 2 && <Step2SubEvents onPrev={() => setStep(1)} onNext={() => setStep(3)} />}
            {step === 3 && <Step3Resources onPrev={() => setStep(2)} onNext={() => setStep(4)} />}
            {step === 4 && <Step4Tasks onPrev={() => setStep(3)} onNext={() => setStep(5)} />}
            {step === 5 && <Step5Review onPrev={() => setStep(4)} />}
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}
