import React from "react";

export default function Step3Resources({ onPrev, onNext }) {
  return (
    <div className="cew-card">
      <h2 style={{ marginTop: 0 }}>Step 3: Resources</h2>

      <div className="cew-actions">
        <button type="button" className="cew-btn cew-btn-ghost" onClick={onPrev}>
          ← Back
        </button>
        <button type="button" className="cew-btn cew-btn-primary" onClick={onNext}>
          Next → Tasks
        </button>
      </div>
    </div>
  );
}
