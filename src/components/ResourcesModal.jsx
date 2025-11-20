import React, { useState, useEffect } from "react";
import "../assets/css/create-event.css";

export const ResourceModal = ({
  type, // 'internal' | 'external'
  show,
  onClose,
  onSave,
  currentSE,
  rooms = [],
  devices = [],
}) => {
  const [tab, setTab] = useState("rooms");
  const [search, setSearch] = useState("");
  const [cap, setCap] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selected, setSelected] = useState({}); // qty per resource

  useEffect(() => {
    if (currentSE) {
      setStart(currentSE.start.slice(0, 16));
      setEnd(currentSE.end.slice(0, 16));
    }
  }, [currentSE]);

  if (!show) return null;

  const handleAddInternal = (res) => {
    const qty = Number(selected[res.id] || 1);
    onSave({ type: tab === "rooms" ? "Room" : "Device", name: res.name, qty, start, end, status: "Planned" });
    setSelected((s) => ({ ...s, [res.id]: 1 }));
  };

  const filteredRooms = rooms
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => !cap || r.capacity >= Number(cap));

  const filteredDevices = devices.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`modal ${show ? "show" : ""}`}>
      <div className="panel">
        <div className="header">
          <h3>{type === "internal" ? "Select Internal Resource" : "Add External Resource"}</h3>
          <button className="close" onClick={onClose}>Close</button>
        </div>

        {type === "internal" && (
          <>
            <div className="tabs">
              <button className={`tab ${tab === "rooms" ? "active" : ""}`} onClick={() => setTab("rooms")}>Rooms</button>
              <button className={`tab ${tab === "devices" ? "active" : ""}`} onClick={() => setTab("devices")}>Devices</button>
            </div>
            <div className="filters">
              <input className="control" placeholder="Search name/code" value={search} onChange={(e) => setSearch(e.target.value)} />
              {tab === "rooms" && <input className="control" type="number" placeholder="Min capacity" value={cap} onChange={(e) => setCap(e.target.value)} />}
              <input className="control" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
              <input className="control" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="cards">
              {(tab === "rooms" ? filteredRooms : filteredDevices).map((r) => (
                <div className="cardX" key={r.id}>
                  <div className="thumb" style={{ backgroundImage: `url(${r.img || "https://picsum.photos/seed/" + r.id + "/400/200"})` }}></div>
                  <div className="info">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <span className={`pill ${tab === "rooms" ? (r.bookable ? "ok" : "warn") : "ok"}`}>
                        {tab === "rooms" ? (r.bookable ? "Bookable" : "Locked") : `Stock: ${r.stock}`}
                      </span>
                    </div>
                    {tab === "rooms" && <div className="meta">Code: {r.code} • Capacity: {r.capacity}</div>}
                    {tab === "devices" && <div className="meta">Available: {r.stock}</div>}
                    <div className="sel">
                      <input
                        type="number"
                        min="1"
                        value={selected[r.id] || 1}
                        onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.value }))}
                      />
                      <button className="btn acc" onClick={() => handleAddInternal(r)}>Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {type === "external" && (
          <div className="filters">
            <input className="control" placeholder="Type (Location/Service/Equipment/Personnel)" />
            <input className="control" placeholder="Provider" />
            <input className="control" type="number" placeholder="Expected Cost" />
            <input className="control" type="number" placeholder="Actual Cost" />
            <input className="control" placeholder="Contract URL" />
            <div className="footer">
              <button className="btn acc" onClick={onClose}>Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
