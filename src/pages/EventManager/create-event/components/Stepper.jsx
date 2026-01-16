// src/pages/EventManager/CreateEventWizard/components/Stepper.jsx
import React from "react";
import { Steps } from "antd";

export default function Stepper({ step }) {
  const items = [
    {
      title: "Main Info",
      content: "Event basic information",
    },
    {
      title: "Sub-Events",
      content: "Add sub-events",
    },
    {
      title: "Resources",
      content: "Manage resources",
    },
    {
      title: "Tasks",
      content: "Assign tasks",
    },
    {
      title: "Review",
      content: "Review and submit",
    },
  ];

  return (
    <div style={{ padding: "16px 0", maxWidth: 1020, margin: "0 auto" }}>
      <Steps 
        current={step - 1} 
        items={items}
        className="custom-steps"
      />
    </div>
  );
}
