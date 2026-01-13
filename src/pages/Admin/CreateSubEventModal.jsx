import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Card,
  Divider,
  Table,
  InputNumber,
  Tag,
  Row,
  Col,
  Typography,
  Upload,
  Radio,
  Alert,
  Steps,
} from "antd";

const { Compact } = Space;
import {
  FileTextOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import SelectRoomModal from "../EventManager/create-event/components/SelectRoomModal";
import SelectQuotationModal from "../EventManager/create-event/components/SelectQuotationModal";
import defaultBannerImage from "../../assets/images/events/Upcoming_Events.jpg";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const CreateSubEventModal = ({ open, onCancel, event, onSuccess }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
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
  const [quotationItems, setQuotationItems] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [conflictAlert, setConflictAlert] = useState(null);
  const [bannerFileList, setBannerFileList] = useState([]);
  const [bannerPreview, setBannerPreview] = useState({
    visible: false,
    image: "",
    title: "",
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      form.resetFields();
      setFormData({
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
      setQuotationItems([]);
      setBannerFileList([]);
      setCurrentStep(0);
      setConflictAlert(null);
    }
  }, [open, form]);

  // Check for conflicts
  useEffect(() => {
    if (!formData.startTime || !formData.endTime || !formData.selectedRoom) {
      setConflictAlert(null);
      return;
    }

    if (formData.selectedRoom?.isOnline) {
      setConflictAlert(null);
      return;
    }

    const currentStart = dayjs(formData.startTime);
    const currentEnd = dayjs(formData.endTime);

    const existingSubEvents = event?.subEvents || [];
    const conflict = existingSubEvents.find((sub) => {
      if (sub.locationMode === "online" || !sub.selectedLocation) return false;
      if (sub.selectedLocation.locationId !== formData.selectedRoom.locationId) return false;

      const subStart = dayjs(sub.startTime);
      const subEnd = dayjs(sub.endTime);

      return currentStart.isBefore(subEnd) && currentEnd.isAfter(subStart);
    });

    if (conflict) {
      setConflictAlert({
        type: "error",
        message: `Conflict Detected. The selected time overlaps with an existing sub-event: ${conflict.eventName || conflict.name} (${dayjs(conflict.startTime).format("hh:mm A")} - ${dayjs(conflict.endTime).format("hh:mm A")}). Please adjust the start time or choose a different room.`,
      });
    } else {
      setConflictAlert(null);
    }
  }, [formData.startTime, formData.endTime, formData.selectedRoom, event]);

  // Calculate total cost
  const totalCost = quotationItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
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

  // Validate Step 1
  const validateStep1 = async () => {
    try {
      const values = await form.validateFields([
        "eventName",
        "sessionType",
        "trackCategory",
        "startTime",
        "endTime",
      ]);

      if (!formData.startTime || !formData.endTime) {
        message.error("Please select Start Time and End Time");
        return false;
      }

      if (!formData.selectedRoom) {
        message.error("Please select a room/venue");
        return false;
      }

      if (conflictAlert) {
        message.error("Please resolve the conflict before proceeding");
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (currentStep === 0) {
      const isValid = await validateStep1();
      if (isValid) {
        setCurrentStep(1);
      }
    }
  };

  // Handle previous step
  const handlePrev = () => {
    setCurrentStep(0);
  };

  // Handle save
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Validate quotation items
      const invalidItems = quotationItems.filter(
        (item) => (item.unitPrice || 0) < 0 || (item.quantity || 0) <= 0
      );
      if (invalidItems.length > 0) {
        message.error("Please fix invalid quotation items (price >= 0, quantity > 0)");
        return;
      }

      // Create sub-event data
      const subEventData = {
        name: values.eventName,
        eventName: values.eventName,
        description: values.description || "",
        sessionType: values.sessionType,
        trackCategory: values.trackCategory,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        selectedLocation: formData.selectedRoom,
        location: formData.selectedRoom?.name || "TBA",
        locationMode: formData.selectedRoom?.locationMode || "internal",
        quotationItems: quotationItems,
        totalCost: totalCost,
        bannerUrl: values.bannerUrl?.trim() || defaultBannerImage,
        expectedAttendees: values.expectedAttendees || 0,
        status: "not-started",
      };

      // Save to localStorage
      try {
        const storedEvents = JSON.parse(localStorage.getItem("events_storage") || "[]");
        const eventIndex = storedEvents.findIndex((e) => e.id === event.id);

        if (eventIndex !== -1) {
          if (!storedEvents[eventIndex].subEvents) {
            storedEvents[eventIndex].subEvents = [];
          }
          storedEvents[eventIndex].subEvents.push(subEventData);
          localStorage.setItem("events_storage", JSON.stringify(storedEvents));

          message.success({
            content: "Sub-event created successfully!",
            duration: 3,
            style: {
              marginTop: "20px",
            },
          });

          onSuccess?.();
          onCancel();
        } else {
          message.error("Event not found");
        }
      } catch (error) {
        console.error("Error saving sub-event:", error);
        message.error("Failed to save sub-event");
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

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
          <Button size="small" disabled style={{ fontSize: "14px" }}>
            ₫
          </Button>
        </Compact>
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 120,
      render: (_, record) => (
        <Text strong style={{ fontSize: "14px" }}>
          {((record.quantity || 0) * (record.unitPrice || 0)).toLocaleString("vi-VN")} ₫
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

  if (!event) return null;

  return (
    <>
      <Modal
        title={
          <div>
            <Title level={4} style={{ margin: 0, color: "#F2721E" }}>
              Create New Sub-event
            </Title>
            <Steps current={currentStep} size="small" style={{ marginTop: 16 }}>
              <Step title="Sub-event Details" />
              <Step title="Resources & Budget" />
            </Steps>
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {currentStep === 0 && (
          <div style={{ marginTop: 24 }}>
            <Form form={form} layout="vertical">
              {/* Session Details */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileTextOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                  <Title
                    level={4}
                    style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}
                  >
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
                      <Select size="large" style={{ fontSize: "14px" }}>
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
                      <Select size="large" style={{ fontSize: "14px" }}>
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
                  <TextArea rows={4} placeholder="Briefly describe this session..." style={{ fontSize: "14px" }} />
                </Form.Item>

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
                        />
                        <Space size={4} wrap>
                          {[15, 25, 50, 100].map((v) => (
                            <Button
                              key={v}
                              size="small"
                              onClick={() => form.setFieldsValue({ expectedAttendees: v })}
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
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Banner Image (optional)</span>}
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

              {/* Schedule & Location */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                  <Title
                    level={4}
                    style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}
                  >
                    Schedule & Location
                  </Title>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Start Time</span>}
                      style={{ marginBottom: "8px" }}
                    >
                      <DatePicker
                        showTime
                        format="MM/DD/YYYY hh:mm A"
                        value={formData.startTime}
                        onChange={(date) => {
                          setFormData({ ...formData, startTime: date });
                          form.setFieldsValue({ startTime: date });
                        }}
                        style={{ width: "100%" }}
                        size="large"
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
                        format="MM/DD/YYYY hh:mm A"
                        value={formData.endTime}
                        onChange={(date) => {
                          setFormData({ ...formData, endTime: date });
                          form.setFieldsValue({ endTime: date });
                        }}
                        style={{ width: "100%" }}
                        size="large"
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
                            {formData.selectedRoom.building} • {formData.selectedRoom.roomNumber} • Capacity:{" "}
                            {formData.selectedRoom.capacity ?? "N/A"}
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
                </Form.Item>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: 24 }}>
                <Button onClick={onCancel} style={{ fontSize: "14px" }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleNext}
                  style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
                >
                  Next: Resources & Budget
                </Button>
              </div>
            </Form>
          </div>
        )}

        {currentStep === 1 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FileTextOutlined style={{ fontSize: "20px", color: "#F2721E" }} />
                <Title
                  level={4}
                  style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}
                >
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
                style={{ color: "#F2721E", padding: 0, marginBottom: "12px", fontSize: "14px" }}
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

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: 24 }}>
              <Button onClick={handlePrev} style={{ fontSize: "14px" }}>
                Back
              </Button>
              <Space>
                <Button onClick={onCancel} style={{ fontSize: "14px" }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
                >
                  Create Sub-event
                </Button>
              </Space>
            </div>
          </div>
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

      {/* Banner Preview Modal */}
      <Modal
        open={bannerPreview.visible}
        title={bannerPreview.title}
        footer={null}
        onCancel={() => setBannerPreview({ visible: false, image: "", title: "" })}
      >
        {bannerPreview.image && (
          <img alt="Banner preview" style={{ width: "100%" }} src={bannerPreview.image} />
        )}
      </Modal>
    </>
  );
};

export default CreateSubEventModal;
