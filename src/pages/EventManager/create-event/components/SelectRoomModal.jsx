// src/pages/EventManager/create-event/components/SelectRoomModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  Radio,
  Input,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  message,
  Select,
  Form,
  InputNumber,
} from "antd";
import {
  EnvironmentOutlined,
  SearchOutlined,
  CheckOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import apiClient from "../../../../services/api.js";
import { createLocation } from "../../../../services/locations.api.js";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SelectRoomModal({
  open,
  onCancel,
  onSelect,
  startTime,
  endTime,
}) {
  const [locationMode, setLocationMode] = useState("offline");
  const [offlineType, setOfflineType] = useState("internal");
  const [searchTerm, setSearchTerm] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");
  const [googleMeetLink, setGoogleMeetLink] = useState("");
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [createLocationForm] = Form.useForm();
  const [creatingLocation, setCreatingLocation] = useState(false);

  // FPT Room codes
  const fptRooms = [
    { code: "BE-201", name: "BE-201", building: "Building E", capacity: 50 },
    { code: "BE-202", name: "BE-202", building: "Building E", capacity: 50 },
    { code: "BE-203", name: "BE-203", building: "Building E", capacity: 50 },
  ];

  // Load available rooms
  useEffect(() => {
    if (open && startTime && endTime && locationMode === "offline" && offlineType === "internal") {
      loadRooms();
    }
  }, [open, startTime, endTime, locationMode, offlineType]);

  // Filter rooms from API
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(availableRooms);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredRooms(
        availableRooms.filter(
          (r) =>
            r.roomNumber?.toLowerCase().includes(term) ||
            r.name?.toLowerCase().includes(term) ||
            r.building?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, availableRooms]);

  const loadRooms = async () => {
    if (!startTime || !endTime) return;

    setLoadingRooms(true);
    try {
      // API: GET /Locations/available?Time=2026-01-12T17:00:00
      // Format Time: YYYY-MM-DDTHH:mm:ss
      // API needs startTime to be before endTime
      const startTimeParam = dayjs(startTime).format("YYYY-MM-DDTHH:mm:ss");
      const endTimeParam = dayjs(endTime).format("YYYY-MM-DDTHH:mm:ss");
      
      // Validate: startTime must be before endTime
      if (dayjs(startTime).isAfter(dayjs(endTime))) {
        console.warn("Start time is after end time, skipping room load");
        setAvailableRooms([]);
        setFilteredRooms([]);
        return;
      }
      
      const res = await apiClient.get("/Locations/available", {
        params: {
          Time: startTimeParam,
          StartTime: startTimeParam,
          EndTime: endTimeParam,
        },
      });

      if (res.status === 200) {
        // Handle API response format: {success, message, data}
        if (res.data?.success !== undefined) {
          const locations = res.data.data || [];
          setAvailableRooms(locations);
          setFilteredRooms(locations);
        } else {
          // Fallback if response format is different
          const locations = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setAvailableRooms(locations);
          setFilteredRooms(locations);
        }
      }
    } catch (e) {
      console.error("Error loading rooms:", e);
      console.error("Error response:", e.response?.data);
      
      // Show error message if it's a validation error
      if (e.response?.status === 400) {
        const errorMsg = e.response?.data?.message || "Invalid time range for loading rooms";
        // Only show if it's not the expected "Start time must be before end time" when times are invalid
        if (!errorMsg.includes("Start time must be before end time") || dayjs(startTime).isAfter(dayjs(endTime))) {
          message.warning(errorMsg);
        }
      } else if (e.response?.status) {
        const errorMsg = e.response?.data?.message || "Failed to load available rooms";
        message.error(errorMsg);
      }
      setAvailableRooms([]);
      setFilteredRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSelect = () => {
    let roomData = null;

    if (locationMode === "online") {
      // Generate Google Meet link
      const meetLink = `https://meet.google.com/${generateMeetCode()}`;
      setGoogleMeetLink(meetLink);
      roomData = {
        locationMode: "online",
        type: "online",
        name: "Google Meet",
        link: meetLink,
        isOnline: true,
      };
      onSelect(roomData);
      message.success("Google Meet link generated");
    } else if (locationMode === "offline") {
      if (offlineType === "internal") {
        // Internal room - already selected via handleRoomClick
        if (!selectedRoom) {
          message.warning("Please select a room");
          return;
        }
        // Room already selected, just close modal
        onSelect(selectedRoom);
      } else {
        // External location
        if (!externalLocationName.trim()) {
          message.warning("Please enter external location name");
          return;
        }
        roomData = {
          locationMode: "external",
          type: "external",
          name: externalLocationName,
          address: externalLocationAddress,
          isExternal: true,
        };
        onSelect(roomData);
        message.success("External location selected");
      }
    }
  };

  const generateMeetCode = () => {
    // Generate a random Google Meet code
    const chars = "abcdefghijklmnopqrstuvwxyz";
    let code = "";
    for (let i = 0; i < 3; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    code += "-";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    code += "-";
    for (let i = 0; i < 3; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleRoomClick = (room) => {
    const roomData = {
      locationMode: "internal",
      type: "internal",
      locationId: room.locationId, // Use locationId from API response
      name: room.name,
      building: room.building,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      isActive: room.isActive,
      imageUrl: room.imageUrl,
    };
    setSelectedRoom(roomData);
  };

  // Handle create new location
  const handleCreateLocation = async (values) => {
    try {
      setCreatingLocation(true);
      const newLocation = await createLocation({
        name: values.name,
        capacity: values.capacity,
        building: values.building,
        roomNumber: values.roomNumber,
        imageUrl: values.imageUrl || "null",
      });

      // Add new location to list
      setAvailableRooms((prev) => [...prev, newLocation]);
      setFilteredRooms((prev) => [...prev, newLocation]);
      
      // Select the newly created location
      const roomData = {
        locationMode: "internal",
        type: "internal",
        locationId: newLocation.locationId,
        name: newLocation.name,
        building: newLocation.building,
        roomNumber: newLocation.roomNumber,
        capacity: newLocation.capacity,
        isActive: newLocation.isActive,
        imageUrl: newLocation.imageUrl,
      };
      setSelectedRoom(roomData);
      
      // Close modal
      setShowCreateLocationModal(false);
      createLocationForm.resetFields();
      
      message.success("Location created successfully");
    } catch (error) {
      console.error("Failed to create location:", error);
      message.error(error.message || "Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  };

  return (
    <Modal
      title="Select Room / Venue"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        {/* Location Mode Selection */}
        <div>
          <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
            Location Type
          </Text>
          <Radio.Group
            value={locationMode}
            onChange={(e) => {
              setLocationMode(e.target.value);
              setOfflineType("internal");
              setExternalLocationName("");
              setExternalLocationAddress("");
              setGoogleMeetLink("");
            }}
            style={{ width: "100%" }}
          >
            <Radio.Button value="offline" style={{ fontSize: "14px" }}>
              Offline
            </Radio.Button>
            <Radio.Button value="online" style={{ fontSize: "14px" }}>
              Online
            </Radio.Button>
          </Radio.Group>
        </div>

        {/* Offline Options */}
        {locationMode === "offline" && (
          <div>
            <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
              Offline Type
            </Text>
            <Radio.Group
              value={offlineType}
              onChange={(e) => {
                setOfflineType(e.target.value);
                setExternalLocationName("");
                setExternalLocationAddress("");
              }}
              style={{ width: "100%" }}
            >
              <Radio.Button value="internal" style={{ fontSize: "14px" }}>
                Internal
              </Radio.Button>
              <Radio.Button value="external" style={{ fontSize: "14px" }}>
                External
              </Radio.Button>
            </Radio.Group>

            {/* Internal Rooms */}
            {offlineType === "internal" && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <Input
                    placeholder="Search by room code (e.g., BE-201)"
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, fontSize: "14px" }}
                    size="large"
                    allowClear
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowCreateLocationModal(true)}
                    size="large"
                    style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
                  >
                    Add New
                  </Button>
                </div>
                {loadingRooms ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Text type="secondary">Loading available rooms...</Text>
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <Text type="secondary">No available rooms found for this time</Text>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "12px",
                      maxHeight: "400px",
                      overflowY: "auto",
                    }}
                  >
                    {filteredRooms.map((room) => (
                      <Card
                        key={room.locationId}
                        hoverable
                        onClick={() => handleRoomClick(room)}
                        style={{
                          cursor: "pointer",
                          border:
                            selectedRoom?.locationId === room.locationId
                              ? "2px solid #F2721E"
                              : "1px solid #d9d9d9",
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <EnvironmentOutlined
                            style={{ fontSize: "24px", color: "#F2721E", marginBottom: "8px" }}
                          />
                          <Text strong style={{ fontSize: "14px", display: "block" }}>
                            {room.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {room.building} • {room.roomNumber}
                          </Text>
                          <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                            Capacity: {room.capacity ?? "N/A"}
                          </Text>
                          {selectedRoom?.locationId === room.locationId && (
                            <div style={{ marginTop: "8px" }}>
                              <CheckOutlined style={{ color: "#F2721E" }} />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* External Location */}
            {offlineType === "external" && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ marginBottom: "12px" }}>
                  <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>
                    Location Name *
                  </Text>
                  <Input
                    placeholder="Enter external location name"
                    value={externalLocationName}
                    onChange={(e) => setExternalLocationName(e.target.value)}
                    size="large"
                    style={{ fontSize: "14px" }}
                  />
                </div>
                <div>
                  <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>
                    Address (Optional)
                  </Text>
                  <TextArea
                    placeholder="Enter external address"
                    value={externalLocationAddress}
                    onChange={(e) => setExternalLocationAddress(e.target.value)}
                    rows={3}
                    style={{ fontSize: "14px" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Online - Google Meet */}
        {locationMode === "online" && (
          <div>
            <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
              Online Event
            </Text>
            <Card style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <Space orientation="vertical" style={{ width: "100%" }}>
                <Text style={{ fontSize: "14px" }}>
                  A Google Meet link will be automatically generated for this event.
                </Text>
                {googleMeetLink && (
                  <div>
                    <Text strong style={{ fontSize: "14px" }}>
                      Generated Link:
                    </Text>
                    <br />
                    <Text
                      copyable
                      style={{ fontSize: "14px", color: "#1890ff", wordBreak: "break-all" }}
                    >
                      {googleMeetLink}
                    </Text>
                  </div>
                )}
              </Space>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
          <Button onClick={onCancel} style={{ fontSize: "14px" }}>
            Cancel
          </Button>
          {locationMode === "offline" && offlineType === "internal" && (
            <Button
              type="primary"
              onClick={handleSelect}
              disabled={!selectedRoom}
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
            >
              Select
            </Button>
          )}
          {locationMode === "offline" && offlineType === "external" && (
            <Button
              type="primary"
              onClick={handleSelect}
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
            >
              Select
            </Button>
          )}
          {locationMode === "online" && (
            <Button
              type="primary"
              onClick={handleSelect}
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
            >
              Generate & Select
            </Button>
          )}
        </div>
      </Space>

      {/* Create Location Modal */}
      <Modal
        title="Create New Location"
        open={showCreateLocationModal}
        onCancel={() => {
          setShowCreateLocationModal(false);
          createLocationForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createLocationForm}
          layout="vertical"
          onFinish={handleCreateLocation}
        >
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Location Name</span>}
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input
              placeholder="e.g., ĐH FPT Hà Nội Beta"
              size="large"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="building"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Building</span>}
                rules={[{ required: true, message: "Please enter building name" }]}
              >
                <Input
                  placeholder="e.g., Beta"
                  size="large"
                  style={{ fontSize: "14px" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomNumber"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Room Number</span>}
                rules={[{ required: true, message: "Please enter room number" }]}
              >
                <Input
                  placeholder="e.g., BE-201"
                  size="large"
                  style={{ fontSize: "14px" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="capacity"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Capacity</span>}
            rules={[
              { required: true, message: "Please enter capacity" },
              { type: "number", min: 1, message: "Capacity must be at least 1" }
            ]}
          >
            <InputNumber
              min={1}
              placeholder="e.g., 10000"
              size="large"
              style={{ width: "100%", fontSize: "14px" }}
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Image URL (Optional)</span>}
          >
            <Input
              placeholder="Image URL (optional)"
              size="large"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
            <Button
              onClick={() => {
                setShowCreateLocationModal(false);
                createLocationForm.resetFields();
              }}
              size="large"
              style={{ fontSize: "14px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creatingLocation}
              size="large"
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
            >
              Create Location
            </Button>
          </div>
        </Form>
      </Modal>
    </Modal>
  );
}
