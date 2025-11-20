import React, { useState } from "react";
import "../assets/css/create-event.css";

const SubEvents = ({ data, setData }) => {
  const [subEvents, setSubEvents] = useState(data || []);

  const handleChange = (index, e) => {
    const newSubEvents = [...subEvents];
    newSubEvents[index][e.target.name] = e.target.value;
    setSubEvents(newSubEvents);
    setData(newSubEvents);
  };

  const addSubEvent = () => {
    const newSubEvents = [
      ...subEvents,
      { title: "", description: "", start: "", end: "" },
    ];
    setSubEvents(newSubEvents);
    setData(newSubEvents);
  };

  const removeSubEvent = (index) => {
    const newSubEvents = subEvents.filter((_, i) => i !== index);
    setSubEvents(newSubEvents);
    setData(newSubEvents);
  };

  return (
    <>
      <h2
        className="ce-subevent-title"
        style={{ textAlign: "center", color: "#2563eb" }}
      >
        Sub-Events
      </h2>

      {subEvents.map((sub, index) => (
        <div key={index} className="ce-subevent-item">
          <div className="ce-subevent-grid">
            <div className="ce-field">
              <label>Title</label>
              <input
                name="title"
                type="text"
                placeholder="Sub-event title"
                value={sub.title}
                onChange={(e) => handleChange(index, e)}
              />
            </div>

            <div className="ce-field">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Sub-event description"
                value={sub.description}
                onChange={(e) => handleChange(index, e)}
              ></textarea>
            </div>

            <div className="ce-field">
              <label>Start Time</label>
              <input
                name="start"
                type="datetime-local"
                value={sub.start}
                onChange={(e) => handleChange(index, e)}
              />
            </div>

            <div className="ce-field">
              <label>End Time</label>
              <input
                name="end"
                type="datetime-local"
                value={sub.end}
                onChange={(e) => handleChange(index, e)}
              />
            </div>
          </div>

          {/* Delete button nằm dưới cùng của sub-event */}
          <div style={{ marginTop: "10px", textAlign: "right" }}>
            <button
              type="button"
              className="btn-outline"
              onClick={() => removeSubEvent(index)}
            >
              Delete Sub-Event
            </button>
          </div>
        </div>
      ))}

      {/* Add Sub-Event Button */}
      <div className="ce-add-subevent">
        <button type="button" onClick={addSubEvent}>
          + Add Sub-Event
        </button>
      </div>
    </>
  );
};

export default SubEvents;
