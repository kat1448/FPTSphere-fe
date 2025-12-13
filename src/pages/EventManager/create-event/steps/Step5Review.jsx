import React from "react";

export default function Step5Review({ onPrev }) {
  return (
    <div className="cew-card">
      <h2 style={{ marginTop: 0 }}>Step 5: Review</h2>

      <div className="cew-actions">
        <button type="button" className="cew-btn cew-btn-ghost" onClick={onPrev}>
          ← Back
        </button>
        <button
          type="button"
          className="cew-btn cew-btn-primary"
          onClick={() => alert("Submit (todo)")}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
