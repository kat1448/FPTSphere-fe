// src/pages/EventManager/CreateEventWizard/steps/Step2SubEvents.jsx
import React, { useEffect, useState } from "react";
import {
  Input,
  Select,
  DatePicker,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Space,
  Modal,
  Radio,
  message,
  Card,
  Divider,
  Table,
  InputNumber,
  Tabs,
  Tag,
  Alert,
  Upload,
} from "antd";
const { Compact } = Space;
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  SaveOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  EditOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import apiClient from "../../../../services/api.js";
import { WizardSS } from "../wizardStorage";
import SelectRoomModal from "../components/SelectRoomModal";
import SelectQuotationModal from "../components/SelectQuotationModal";
import "../../../../assets/css/Step1MainEvent.css";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export default function Step2SubEvents({ onPrev, onNext }) {
  const [form] = Form.useForm();
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationItems, setQuotationItems] = useState([]);
  const [conflictAlert, setConflictAlert] = useState(null);
  const [bannerFileList, setBannerFileList] = useState([]);
  const [bannerPreview, setBannerPreview] = useState({
    visible: false,
    image: "",
    title: "",
  });

  // Form states
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    sessionType: "Workshop",
    trackCategory: "Technical Skills",
    startTime: null,
    endTime: null,
    selectedRoom: null,
    bannerUrl: "",
    expectedAttendees: 0,
  });


  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    if (!me) {
      message.error("Không tìm thấy Main Event. Vui lòng quay lại Step 1.");
      onPrev();
      return;
    }
    setMainEvent(me);

    const subs = WizardSS.get("subEvents", []);
    setSubEvents(subs);
  }, [onPrev]);


  // Check for conflicts
  useEffect(() => {
    if (!formData.startTime || !formData.endTime || !formData.selectedRoom) {
      setConflictAlert(null);
      return;
    }

    // Skip conflict check for online events
    if (formData.selectedRoom?.isOnline) {
      setConflictAlert(null);
      return;
    }

    const currentStart = dayjs(formData.startTime);
    const currentEnd = dayjs(formData.endTime);

    const conflict = subEvents.find((sub) => {
      if (sub.locationMode === "online" || !sub.selectedLocation) return false;
      if (sub.selectedLocation.locationId !== formData.selectedRoom.locationId) return false;

      const subStart = dayjs(sub.startTime);
      const subEnd = dayjs(sub.endTime);

      return currentStart.isBefore(subEnd) && currentEnd.isAfter(subStart);
    });

    if (conflict) {
      setConflictAlert({
        type: "error",
        message: `Conflict Detected. The selected time overlaps with an existing sub-event: ${conflict.eventName} (${dayjs(conflict.startTime).format("hh:mm A")} - ${dayjs(conflict.endTime).format("hh:mm A")}). Please adjust the start time or choose a different room.`,
      });
    } else {
      setConflictAlert(null);
    }
  }, [formData.startTime, formData.endTime, formData.selectedRoom, subEvents]);

  // Calculate total cost
  const totalCost = quotationItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  // Handle room selection
  const handleRoomSelect = (roomData) => {
    setFormData({ ...formData, selectedRoom: roomData });
    setShowRoomModal(false);
  };

  // Handle quotation item add
  const handleAddQuotationItem = (item) => {
    setQuotationItems([...quotationItems, item]);
    setShowQuotationModal(false);
  };

  // Remove quotation item
  const removeQuotationItem = (id) => {
    setQuotationItems(quotationItems.filter((item) => item.id !== id));
  };

  // Update quotation item
  const updateQuotationItem = (id, field, value) => {
    setQuotationItems(
      quotationItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "unitPrice" && updated.unitPrice < 0) {
            updated.unitPrice = 0;
            message.warning("Price must be greater than or equal to 0");
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Open modal
  const openModal = (index = null) => {
    if (index !== null) {
      const sub = subEvents[index];
      const bannerUrl = sub.bannerUrl || "";
      const expectedAttendees = sub.expectedAttendees || 0;

      setFormData({
        eventName: sub.eventName,
        description: sub.description,
        sessionType: sub.sessionType || "Workshop",
        trackCategory: sub.trackCategory || "Technical Skills",
        startTime: dayjs(sub.startTime),
        endTime: dayjs(sub.endTime),
        selectedRoom: sub.selectedLocation || null,
        bannerUrl,
        expectedAttendees,
      });

      setBannerFileList(
        bannerUrl
          ? [
              {
                uid: "-1",
                name: "banner",
                status: "done",
                url: bannerUrl,
              },
            ]
          : []
      );

      setQuotationItems(sub.quotationItems || []);
      setEditingIndex(index);

      form.setFieldsValue({
        eventName: sub.eventName,
        description: sub.description,
        sessionType: sub.sessionType || "Workshop",
        trackCategory: sub.trackCategory || "Technical Skills",
        startTime: dayjs(sub.startTime),
        endTime: dayjs(sub.endTime),
        bannerUrl,
        expectedAttendees,
      });
    } else {
      const initialData = {
        eventName: "",
        description: "",
        sessionType: "Workshop",
        trackCategory: "Technical Skills",
        startTime: null,
        endTime: null,
        selectedRoom: null,
        bannerUrl: "",
        expectedAttendees: 0,
      };

      setFormData(initialData);
      setBannerFileList([]);
      setQuotationItems([]);
      setEditingIndex(null);

      form.setFieldsValue(initialData);
    }

    setShowModal(true);
    setConflictAlert(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setQuotationItems([]);
    setConflictAlert(null);
    setBannerFileList([]);
    setBannerPreview({ visible: false, image: "", title: "" });
    form.resetFields();
  };

  // Save sub-event
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!formData.startTime || !formData.endTime) {
        message.error("Please select Start Time and End Time");
        return;
      }

      if (!formData.selectedRoom) {
        message.error("Please select a room/venue");
        return;
      }

      if (conflictAlert) {
        message.error("Please resolve the conflict before saving");
        return;
      }

      // Validate quotation items
      const invalidItems = quotationItems.filter(
        (item) => item.unitPrice < 0 || item.quantity <= 0
      );
      if (invalidItems.length > 0) {
        message.error("Please fix invalid quotation items (price >= 0, quantity > 0)");
        return;
      }

      // Check if mainEvent has eventId
      if (!mainEvent?.eventId) {
        message.error("Main event ID is missing. Please go back to Step 1.");
        return;
      }

      // Prepare banner URL
      let bannerUrl = values.bannerUrl?.trim() || null;
      if (!bannerUrl) {
        bannerUrl = "https://beecomm.com.vn/wp-content/uploads/2022/09/1-event-activation.png";
      }

      // Format datetime: YYYY-MM-DDTHH:mm:ss
      const formatDateTime = (dayjsObj) => {
        if (!dayjsObj) return null;
        return dayjsObj.format("YYYY-MM-DDTHH:mm:ss");
      };

      // Determine locationId and externalLocationId based on selectedRoom
      let locationId = null;
      let externalLocationId = null;

      if (formData.selectedRoom) {
        if (formData.selectedRoom.locationId) {
          // Internal location - ensure it's a number
          locationId = Number(formData.selectedRoom.locationId);
          if (isNaN(locationId)) {
            message.error("Invalid location ID");
            return;
          }
        } else if (formData.selectedRoom.externalLocationId) {
          // External location already has ID - ensure it's a number
          externalLocationId = Number(formData.selectedRoom.externalLocationId);
          if (isNaN(externalLocationId)) {
            message.error("Invalid external location ID");
            return;
          }
        } else if (formData.selectedRoom.isExternal) {
          // External location without ID - need to create it first
          try {
            const extRes = await apiClient.post("/externallocations", {
              name: formData.selectedRoom.name || "External Location",
              address: formData.selectedRoom.address || "N/A",
              contactPerson: null,
              contactPhone: null,
              cost: null,
              note: null,
            });
            externalLocationId = extRes.data?.data?.externalLocationId ?? extRes.data?.data?.id ?? null;
            if (!extRes.data?.success || !externalLocationId) {
              throw new Error("Không tạo được external location");
            }
            externalLocationId = Number(externalLocationId);
          } catch (extErr) {
            console.error("Failed to create external location:", extErr);
            message.error("Failed to create external location: " + (extErr.message || "Unknown error"));
            return;
          }
        } else if (formData.selectedRoom.isOnline) {
          // Online event - both are null
          locationId = null;
          externalLocationId = null;
        }
      }

      // Prepare API request body
      const requestBody = {
        eventName: values.eventName,
        description: values.description || null,
        bannerUrl: bannerUrl,
        startTime: formatDateTime(formData.startTime),
        endTime: formatDateTime(formData.endTime),
        locationId: locationId,
        externalLocationId: externalLocationId,
        categoryId: null, // API allows null
        typeId: null, // API allows null
      };

      console.log("📤 Creating sub-event with payload:", requestBody);

      let response;
      try {
        // Call API to create sub-event
        response = await apiClient.post(
          `/Events/${mainEvent.eventId}/subevents`,
          requestBody,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "*/*",
            },
          }
        );
      } catch (apiError) {
        // Re-throw with requestBody in scope
        apiError.requestBody = requestBody;
        throw apiError;
      }

      // Handle response (status 200 or 201)
      if (response.status === 200 || response.status === 201) {
        console.log("✅ Sub-event created successfully:", response.data);

        // Extract data from response
        const apiResponse = response.data;
        const createdSubEvent = apiResponse?.data || apiResponse;

        // Create sub-event data for sessionStorage (include additional fields for UI)
        const subEventData = {
          eventId: createdSubEvent.eventId,
          eventName: createdSubEvent.eventName || values.eventName,
          description: createdSubEvent.description || values.description,
          sessionType: values.sessionType,
          trackCategory: values.trackCategory,
          startTime: createdSubEvent.startTime || formatDateTime(formData.startTime),
          endTime: createdSubEvent.endTime || formatDateTime(formData.endTime),
          selectedLocation: formData.selectedRoom,
          locationMode: formData.selectedRoom?.locationMode || "internal",
          locationId: createdSubEvent.locationId,
          externalLocationId: createdSubEvent.externalLocationId,
          quotationItems: quotationItems,
          totalCost: totalCost,
          bannerUrl: createdSubEvent.bannerUrl || bannerUrl,
          expectedAttendees: values.expectedAttendees || 0,
          // Additional fields from API response
          parentEventId: createdSubEvent.parentEventId,
          statusId: createdSubEvent.statusId,
          statusName: createdSubEvent.statusName,
        };

        // Save to sessionStorage
        let updatedSubEvents;
        if (editingIndex !== null) {
          updatedSubEvents = [...subEvents];
          updatedSubEvents[editingIndex] = {
            ...subEvents[editingIndex],
            ...subEventData,
          };
        } else {
          updatedSubEvents = [...subEvents, subEventData];
        }

        setSubEvents(updatedSubEvents);
        WizardSS.set("subEvents", updatedSubEvents);

        // Show success message
        const successMessage = apiResponse?.message || (editingIndex !== null ? "Sub-event updated" : "Sub-event created");
        message.success(successMessage);
        closeModal();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Error creating sub-event:", error);
      console.error("❌ Error response:", error.response?.data);
      if (error.requestBody) {
        console.error("❌ Request payload was:", error.requestBody);
      }

      // Handle API errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        
        // Format validation errors
        if (errorData?.errors) {
          const errorMessages = [];
          Object.keys(errorData.errors).forEach((field) => {
            const fieldErrors = errorData.errors[field];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((msg) => errorMessages.push(`${field}: ${msg}`));
            } else {
              errorMessages.push(`${field}: ${fieldErrors}`);
            }
          });
          const fullErrorMessage = errorMessages.length > 0 
            ? errorMessages.join("\n") 
            : (errorData?.message || errorData?.title || "Validation failed");
          message.error(fullErrorMessage, 5); // Show for 5 seconds
        } else {
          const errorMessage = errorData?.message || errorData?.title || errorData?.detail || "Validation failed";
          message.error(errorMessage, 5);
        }
      } else if (error.response?.status) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create sub-event";
        message.error(errorMessage);
      } else if (error.message === "Network Error" || !error.response) {
        message.error("Network error: Could not connect to server");
      } else {
        message.error(error.message || "Failed to create sub-event");
      }
    }
  };

  // Delete sub-event
  const deleteSubEvent = (index) => {
    Modal.confirm({
      title: "Delete Sub-Event",
      content: "Are you sure you want to delete this sub-event?",
      onOk: () => {
        const updated = subEvents.filter((_, i) => i !== index);
        setSubEvents(updated);
        WizardSS.set("subEvents", updated);
        message.success("Sub-event deleted");
      },
    });
  };


  if (!mainEvent) return null;

  // Quotation table columns
  const quotationColumns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => updateQuotationItem(record.id, "itemDescription", e.target.value)}
          style={{ fontSize: "14px" }}
        />
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => updateQuotationItem(record.id, "quantity", val)}
          style={{ width: "100%", fontSize: "14px" }}
        />
      ),
    },
    {
      title: "Rental Unit",
      dataIndex: "rentalUnit",
      key: "rentalUnit",
      width: 120,
      render: (value, record) => (
        <Select
          value={value || "day"}
          onChange={(val) => updateQuotationItem(record.id, "rentalUnit", val)}
          style={{ width: "100%", fontSize: "14px" }}
          size="small"
        >
          <Option value="hour">Per Hour</Option>
          <Option value="day">Per Day</Option>
          <Option value="week">Per Week</Option>
        </Select>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 150,
      render: (value, record) => (
        <Compact style={{ width: "100%" }}>
          <InputNumber
            min={0}
            value={value}
            onChange={(val) => updateQuotationItem(record.id, "unitPrice", val)}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
            style={{ width: "100%", fontSize: "14px", flex: 1 }}
          />
          <Button size="small" disabled style={{ fontSize: "14px" }}>₫</Button>
        </Compact>
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 120,
      render: (_, record) => (
        <Text strong style={{ fontSize: "14px" }}>
          {(record.quantity * record.unitPrice).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeQuotationItem(record.id)}
          style={{ fontSize: "14px" }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        {/* <Space>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={onPrev}
            style={{ padding: 0, color: "#F2721E" }}
          >
            Back to {mainEvent.name}
          </Button>
        </Space> */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={3} style={{ margin: "8px 0", color: "#F2721E", fontWeight: 700 }}>
          <strong style={{ color: "black" }}>Sub-Events for: {mainEvent.name}</strong>
            </Title>
            <Text type="secondary">
              Main Event: {dayjs(mainEvent.start).format("MMM DD")} - {dayjs(mainEvent.end).format("MMM DD, YYYY")}
            </Text>
        </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            style={{ background: "#F2721E", borderColor: "#F2721E" }}
          >
            Add Sub-Event
          </Button>
        </div>
        </div>

      {/* List of Sub-Events */}
        {subEvents.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary">No sub-events created yet. Click "Add Sub-Event" to create one.</Text>
          </div>
        </Card>
        ) : (
        <Card style={{ marginBottom: "20px" }}>
          <Space orientation="vertical" style={{ width: "100%" }}>
            {subEvents.map((sub, idx) => (
              <Card
                key={idx}
                size="small"
                style={{ marginBottom: "12px" }}
                actions={[
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => openModal(idx)}
                    key="edit"
                  >
                    Edit
                  </Button>,
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteSubEvent(idx)}
                    key="delete"
                  >
                    Delete
                  </Button>,
                ]}
              >
                <Space orientation="vertical" style={{ width: "100%" }}>
                  <Text strong style={{ fontSize: "16px" }}>
                    {sub.eventName}
                  </Text>
                  <Text type="secondary">{sub.description || "No description"}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {dayjs(sub.startTime).format("MMM DD, YYYY hh:mm A")} - {dayjs(sub.endTime).format("hh:mm A")}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      📍 {sub.selectedLocation?.name || "TBA"}
                    </Text>
                    {sub.totalCost && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          💰 Total Cost: {sub.totalCost.toLocaleString("vi-VN")} ₫
                        </Text>
                      </>
                    )}
                </div>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          Back to Main Event
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={onNext}
          style={{ background: "#F2721E", borderColor: "#F2721E" }}
        >
          Next
        </Button>
      </div>

      {/* Modal for Add/Edit Sub-Event */}
      <Modal
        title={editingIndex !== null ? "Edit Sub-Event" : "Create Sub-Event"}
        open={showModal}
        onCancel={closeModal}
        footer={null}
        width={1200}
      >
        <Row gutter={24}>
          {/* Main Form - Left Side */}
          <Col span={16}>
            <Form form={form} layout="vertical">
              {/* Session Details Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileTextOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                  <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>
                    Session Details
                  </Title>
            </div>

                <Form.Item
                  name="eventName"
                  label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Subevent Title</span>}
                  rules={[{ required: true, message: "Please enter subevent title" }]}
                  style={{ marginBottom: "8px" }}
                >
                  <Input
                    placeholder="e.g., Frontend Development Workshop"
                    size="large"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="sessionType"
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Session Type</span>}
                      style={{ marginBottom: "8px" }}
                    >
                      <Select size="large" style={{ fontSize: "14px" }} className="custom-select-orange">
                        <Option value="Workshop">Workshop</Option>
                        <Option value="Panel">Panel</Option>
                        <Option value="Keynote">Keynote</Option>
                        <Option value="Breakout">Breakout</Option>
                        <Option value="Networking">Networking</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="trackCategory"
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Track / Category</span>}
                      style={{ marginBottom: "8px" }}
                    >
                      <Select size="large" style={{ fontSize: "14px" }} className="custom-select-orange">
                        <Option value="Technical Skills">Technical Skills</Option>
                        <Option value="Business">Business</Option>
                        <Option value="Design">Design</Option>
                        <Option value="Marketing">Marketing</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="description"
                  label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Description</span>}
                  style={{ marginBottom: "8px" }}
                >
                  <TextArea
                    rows={4}
                    placeholder="Briefly describe this session..."
                    style={{ fontSize: "14px" }}
                  />
                </Form.Item>

                {/* Hidden field to bind banner URL string for saving */}
                <Form.Item name="bannerUrl" style={{ display: "none" }}>
                  <Input type="hidden" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="expectedAttendees"
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Expected Attendees</span>}
                      style={{ marginBottom: "8px" }}
                      initialValue={0}
                    >
                      <Space direction="vertical" style={{ width: "100%" }} size={4}>
                        <InputNumber
                          min={0}
                          placeholder="0"
                          size="large"
                          style={{ width: "100%", fontSize: "14px" }}
                          id="expectedAttendeesInput"
                        />
                        <Space size={4} wrap>
                          {[15, 25, 50, 100].map((v) => (
                            <Button
                              key={v}
                              size="small"
                              onClick={() => {
                                form.setFieldsValue({ expectedAttendees: v });
                                // Focus vào input sau khi set giá trị
                                setTimeout(() => {
                                  const input = document.getElementById("expectedAttendeesInput");
                                  if (input) {
                                    const inputElement = input.querySelector("input");
                                    if (inputElement) {
                                      inputElement.focus();
                                      inputElement.select();
                                    }
                                  }
                                }, 100);
                              }}
                              style={{ fontSize: "12px" }}
                            >
                              {v}
                            </Button>
                          ))}
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            Unit: peoples
                          </Text>
                        </Space>
                      </Space>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <span style={{ fontWeight: 700, fontSize: "14px" }}>
                          Banner Image (optional)
                        </span>
                      }
                      style={{ marginBottom: "8px" }}
                    >
                      <Upload
                        listType="picture-card"
                        fileList={bannerFileList}
                        beforeUpload={() => false}
                        onChange={({ fileList }) => {
                          setBannerFileList(fileList);
                          const file = fileList[0];
                          if (file && (file.url || file.thumbUrl)) {
                            form.setFieldsValue({
                              bannerUrl: file.url || file.thumbUrl,
                            });
                          }
                        }}
                        onPreview={(file) => {
                          setBannerPreview({
                            visible: true,
                            image: file.url || file.thumbUrl,
                            title: file.name || "Banner preview",
                          });
                        }}
                      >
                        {bannerFileList.length >= 1 ? null : (
                          <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8, fontSize: "12px" }}>Upload</div>
                          </div>
                        )}
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Schedule & Location Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ClockCircleOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                  <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>
                    Schedule & Location
                  </Title>
              </div>

                <Form.Item
                  label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Date</span>}
                  style={{ marginBottom: "8px" }}
                >
                  <DatePicker
                    value={formData.startTime}
                    onChange={(date) => {
                      setFormData({ ...formData, startTime: date });
                      if (date) {
                        form.setFieldsValue({ startTime: date, endTime: formData.endTime });
                      }
                    }}
                    format="MM/DD/YYYY"
                    style={{ width: "100%" }}
                    size="large"
                    disabledDate={(current) => {
                      if (!mainEvent) return false;
                      return (
                        current && (
                          current < dayjs(mainEvent.start).startOf("day") ||
                          current > dayjs(mainEvent.end).endOf("day")
                        )
                      );
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                    Must be within main event dates ({dayjs(mainEvent.start).format("MMM DD")} - {dayjs(mainEvent.end).format("MMM DD")}).
                  </Text>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Start Time</span>}
                      style={{ marginBottom: "8px" }}
                    >
                      <DatePicker
                        showTime
                        format="hh:mm A"
                        value={formData.startTime}
                        onChange={(date) => {
                          setFormData({ ...formData, startTime: date });
                          form.setFieldsValue({ startTime: date });
                        }}
                        style={{ width: "100%" }}
                        size="large"
                        className="custom-datepicker"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>End Time</span>}
                      style={{ marginBottom: "8px" }}
                    >
                      <DatePicker
                        showTime
                        format="hh:mm A"
                        value={formData.endTime}
                        onChange={(date) => {
                          setFormData({ ...formData, endTime: date });
                          form.setFieldsValue({ endTime: date });
                        }}
                        style={{ width: "100%" }}
                        size="large"
                        className="custom-datepicker"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {conflictAlert && (
                  <Alert
                    message={conflictAlert.message}
                    type="error"
                    showIcon
                    style={{ marginBottom: "12px" }}
                  />
                )}

                <Form.Item
                  label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Room / Venue</span>}
                  style={{ marginBottom: "8px" }}
                >
                  {!formData.selectedRoom ? (
                    <Button
                      type="primary"
                      icon={<EnvironmentOutlined />}
                      onClick={() => setShowRoomModal(true)}
                      size="large"
                      style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
                    >
                      Select Room
                    </Button>
                  ) : (
                    <Card size="small">
                      <Space style={{ width: "100%", justifyContent: "space-between" }}>
                        <div>
                          <Text strong>{formData.selectedRoom.name}</Text>
                          <br />
                          <Text type="secondary">
                            {formData.selectedRoom.building} • {formData.selectedRoom.roomNumber} • Capacity: {formData.selectedRoom.capacity ?? "N/A"}
                          </Text>
                          </div>
                        <Button
                          size="small"
                          onClick={() => setShowRoomModal(true)}
                          style={{ fontSize: "14px" }}
                          >
                            Change
                        </Button>
                      </Space>
                    </Card>
                  )}
                  {formData.selectedRoom && formData.startTime && (
                    <Text type="danger" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                      {formData.selectedRoom.name} is occupied at {dayjs(formData.startTime).format("hh:mm A")}.
                    </Text>
                  )}
                </Form.Item>
            </div>

              <Divider style={{ margin: "16px 0" }} />

              {/* Quotation & Costs Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileTextOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                  <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>
                    Quotation & Costs
                  </Title>
              </div>

                <Table
                  columns={quotationColumns}
                  dataSource={quotationItems}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ marginBottom: "12px" }}
                />

                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => setShowQuotationModal(true)}
                  style={{ color: "#1890ff", padding: 0, marginBottom: "12px", fontSize: "14px" }}
                >
                  Add Line Item
                </Button>

                <div style={{ textAlign: "right", marginTop: "16px" }}>
                  <Text strong style={{ fontSize: "16px" }}>
                    TOTAL ESTIMATED COST:{" "}
                    <Text strong style={{ fontSize: "18px", color: "#F2721E" }}>
                      {totalCost.toLocaleString("vi-VN")} ₫
                    </Text>
                  </Text>
            </div>
          </div>
            </Form>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <Button
                icon={<SaveOutlined />}
                onClick={() => {
                  setShowModal(false);
                  message.info("Changes saved as draft");
                }}
                size="large"
                style={{ fontSize: "14px" }}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleSave}
                size="large"
                style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
              >
                Create Sub-Event
              </Button>
            </div>
          </Col>

          {/* Sidebar - Right Side */}
          <Col span={8}>
          <Card title="MAIN EVENT CONTEXT" size="small" style={{ marginBottom: "16px" }}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong style={{ fontSize: "14px" }}>{mainEvent.name}</Text>
              </div>
              <div>
                <CalendarOutlined />{" "}
                <Text type="secondary" style={{ fontSize: "14px" }}>
                  {dayjs(mainEvent.start).format("MMM DD")} - {dayjs(mainEvent.end).format("MMM DD, YYYY")}
                </Text>
              </div>
              <div>
                <EnvironmentOutlined />{" "}
                <Text type="secondary" style={{ fontSize: "14px" }}>{mainEvent.locationName || "TBA"}</Text>
              </div>
              <div>
                <Space>
                  <Tag color="blue">Technology</Tag>
                  <Tag color="blue">Conference</Tag>
                </Space>
            </div>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <span>Existing Schedule</span>
                <Tag>{dayjs(formData.startTime || mainEvent.start).format("MMM DD")}</Tag>
              </Space>
            }
            size="small"
          >
            <Space orientation="vertical" style={{ width: "100%" }}>
              {subEvents
                .filter((sub) => {
                  if (!formData.startTime) return true;
                  return dayjs(sub.startTime).isSame(dayjs(formData.startTime), "day");
                })
                .slice(0, 2)
                .map((sub, idx) => (
                  <div key={idx}>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                      {dayjs(sub.startTime).format("hh:mm A")} - {dayjs(sub.endTime).format("hh:mm A")}
                    </Text>
                    <br />
                    <Text strong style={{ fontSize: "14px" }}>
                      {sub.eventName}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                      {sub.selectedLocation?.name || sub.selectedLocation?.code || "TBA"}
                    </Text>
              </div>
                ))}
              {subEvents.length > 2 && (
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  ... {subEvents.length - 2} more sessions later
                </Text>
              )}
            </Space>
          </Card>
          </Col>
        </Row>
      </Modal>

      {/* Banner preview modal */}
      <Modal
        open={bannerPreview.visible}
        title={bannerPreview.title}
        footer={null}
        onCancel={() =>
          setBannerPreview({ visible: false, image: "", title: "" })
        }
      >
        {bannerPreview.image && (
          <img
            alt="Banner preview"
            style={{ width: "100%" }}
            src={bannerPreview.image}
          />
        )}
      </Modal>

      {/* Select Room Modal */}
      <SelectRoomModal
        open={showRoomModal}
        onCancel={() => setShowRoomModal(false)}
        onSelect={handleRoomSelect}
        startTime={formData.startTime}
        endTime={formData.endTime}
        selectedRoom={formData.selectedRoom}
      />

      {/* Select Quotation Modal */}
      <SelectQuotationModal
        open={showQuotationModal}
        onCancel={() => setShowQuotationModal(false)}
        onAddItem={handleAddQuotationItem}
        startTime={formData.startTime}
        endTime={formData.endTime}
      />
    </div>
  );
}
