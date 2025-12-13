// src/pages/EventManager/CreateEventWizard/components/Stepper.jsx
import React from "react";

export default function Stepper({ step }) {
  const items = [
    "1. Main Info",
    "2. Sub-Events",
    "3. Resources",
    "4. Tasks",
    "5. Review",
  ];

  return (
    <div className="cew-stepper">
      {items.map((label, idx) => {
        const n = idx + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className={`cew-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
            <span className="cew-dot" />
            <span className="cew-label">{label}</span>
            {n !== items.length && <span className="cew-line" />}
          </div>
        );
      })}
    </div>
  );
}
