import React, { useState } from "react";
import "../assets/css/create-event.css";
import SubEvents from "./SubEvents";
import Resources from "./Resources";

const steps = ["Main Info", "Sub-Events", "Resources", "Tasks", "Review"];

const CreateEvent = () => {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    desc: "",
    expected: "",
    start: "",
    end: "",
    cost: "",
    subEvents: [],
    resources: [],
    tasks: [],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="create-event-container">
      <h1 className="ce-title">Create New Event</h1>

      {/* STEPPER */}
      <div className="ce-stepper">
        <div className="ce-progress-line">
          <div
            className="ce-progress-fill"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
        <div className="ce-step-list">
          {steps.map((label, index) => {
            const s = index + 1;
            return (
              <div
                key={s}
                className={`ce-step-item ${step === s ? "active" : ""} ${
                  step > s ? "done" : ""
                }`}
              >
                <div className="ce-step-circle">{s}</div>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ce-card">
        {/* Step 1: Main Info */}
        {step === 1 && (
          <div className="ce-step-content fade-in">
            <div className="ce-field">
              <label>Event Name</label>
              <input
                name="name"
                type="text"
                placeholder="FPT TechFair 2025"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="ce-field">
              <label>Description</label>
              <textarea
                name="desc"
                placeholder="Describe your event..."
                value={form.desc}
                onChange={handleChange}
              />
            </div>

            <div className="ce-grid-3">
              <div className="ce-field">
                <label>Expected Attendees</label>
                <input
                  name="expected"
                  type="number"
                  placeholder="500"
                  value={form.expected}
                  onChange={handleChange}
                />
              </div>

              <div className="ce-field">
                <label>Start Date</label>
                <input
                  name="start"
                  type="datetime-local"
                  value={form.start}
                  onChange={handleChange}
                />
              </div>

              <div className="ce-field">
                <label>End Date</label>
                <input
                  name="end"
                  type="datetime-local"
                  value={form.end}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="ce-field">
              <label>Estimated Cost (VND)</label>
              <input
                name="cost"
                type="number"
                placeholder="10000000"
                value={form.cost}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {/* Step 2: Sub-Events */}
        {step === 2 && (
          <SubEvents
            data={form.subEvents}
            setData={(data) => setForm({ ...form, subEvents: data })}
          />
        )}

        {/* Step 3: Resources */}
        {step === 3 && (
          <Resources
            subEvents={form.subEvents}
            data={form.resources}
            setData={(data) => setForm({ ...form, resources: data })}
          />
        )}

        {/* Step 4: Tasks */}
        {step === 4 && (
          <div className="ce-step-content fade-in">
            <p>Tasks module coming soon...</p>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="ce-step-content fade-in">
            <h2 className="ce-subevent-title">Review Event</h2>
            <p>
              <strong>Name:</strong> {form.name}
            </p>
            <p>
              <strong>Description:</strong> {form.desc}
            </p>
            <p>
              <strong>Expected Attendees:</strong> {form.expected}
            </p>
            <p>
              <strong>Start:</strong> {form.start}
            </p>
            <p>
              <strong>End:</strong> {form.end}
            </p>
            <p>
              <strong>Cost:</strong> {form.cost}
            </p>

            <h3>Sub-Events:</h3>
            {form.subEvents.length === 0
              ? "No sub-events"
              : form.subEvents.map((sub, idx) => (
                  <div key={idx}>
                    <strong>{sub.title}</strong>: {sub.description} (
                    {sub.start} → {sub.end})
                  </div>
                ))}

            <h3>Resources:</h3>
            {form.resources.length === 0
              ? "No resources"
              : form.resources.map((res, idx) => (
                  <div key={idx}>
                    <strong>{res.name}</strong>: Quantity {res.qty}
                  </div>
                ))}
          </div>
        )}

        {/* ACTIONS */}
        <div className="ce-actions">
          {step > 1 && (
            <button onClick={prevStep} className="btn-outline">
              Back
            </button>
          )}
          {step < steps.length && (
            <button onClick={nextStep} className="btn-primary">
              Next
            </button>
          )}
          {step === steps.length && (
            <button
              className="btn-primary"
              onClick={() => alert("Event submitted!")}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
