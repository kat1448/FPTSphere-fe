import React, { useState } from "react";
import "../assets/css/create-event.css";

const roomsMock = [
  { id: 1, name: "Hội trường 200", code: "A200", capacity: 220, bookable: true },
  { id: 2, name: "Giảng đường E301", code: "E301", capacity: 120, bookable: true },
  { id: 3, name: "Phòng họp M102", code: "M102", capacity: 16, bookable: false },
  { id: 4, name: "Phòng Seminar S204", code: "S204", capacity: 60, bookable: true },
];

const devicesMock = [
  { id: "D1", name: "Projector", stock: 8 },
  { id: "D2", name: "Laptop", stock: 20 },
  { id: "D3", name: "Microphone", stock: 12 },
  { id: "D4", name: "Speaker", stock: 6 },
];

const Resources = ({ data, setData }) => {
  const [internal, setInternal] = useState(data || []);

  const addInternal = () => {
    setInternal((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "Room",
        name: "",
        qty: 1,
        start: "",
        end: "",
      },
    ]);
  };

  const removeInternal = (id) => {
    setInternal((prev) => prev.filter((x) => x.id !== id));
  };

  const handleChange = (id, field, value) => {
    setInternal((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
    );
  };

  // Save back to parent form
  React.useEffect(() => {
    setData(internal);
  }, [internal]);

  return (
    <div className="grid3">
      {/* LEFT EMPTY SPACE OR OPTIONAL */}
      <aside className="card sticky"></aside>

      {/* MIDDLE: Table */}
      <section className="card">
        <div className="toolbar">
          <button className="btn acc" onClick={addInternal}>
            + Add Resource
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Qty</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {internal.map((item) => (
              <tr key={item.id} className="row">
                <td>
                  <select
                    value={item.type}
                    onChange={(e) => handleChange(item.id, "type", e.target.value)}
                  >
                    <option value="Room">Room</option>
                    <option value="Device">Device</option>
                  </select>
                </td>

                <td>
                  {item.type === "Room" ? (
                    <select
                      value={item.name}
                      onChange={(e) => handleChange(item.id, "name", e.target.value)}
                    >
                      <option value="">Select Room</option>
                      {roomsMock.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.capacity})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={item.name}
                      onChange={(e) => handleChange(item.id, "name", e.target.value)}
                    >
                      <option value="">Select Device</option>
                      {devicesMock.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} (Stock: {d.stock})
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td>
                  <input
                    type="datetime-local"
                    value={item.start}
                    onChange={(e) => handleChange(item.id, "start", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="datetime-local"
                    value={item.end}
                    onChange={(e) => handleChange(item.id, "end", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => handleChange(item.id, "qty", e.target.value)}
                  />
                </td>

                <td>
                  <span className="link" onClick={() => removeInternal(item.id)}>
                    Delete
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* RIGHT: Optional Summary */}
      <aside className="card sticky sum">
        <h3>Summary</h3>
        <div className="kv">
          <div className="k">Rooms</div>
          <div>
            {internal.filter((x) => x.type === "Room").length}
          </div>

          <div className="k">Devices</div>
          <div>
            {internal.filter((x) => x.type === "Device").reduce((s, x) => s + Number(x.qty), 0)}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Resources;
