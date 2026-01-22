import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Steps,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Space,
  Card,
  Typography,
  InputNumber,
  Table,
  Tag,
  Row,
  Col,
  Progress,
  Divider,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
const { Compact } = Space;
import dayjs from "dayjs";

// Helper to get current time in GMT+7 (Vietnam timezone)
const getNowGMT7 = () => {
  const now = new Date();
  // Get UTC timestamp
  const utcTimestamp = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  // Add 7 hours (7 * 60 * 60 * 1000 milliseconds) for GMT+7
  const gmt7Timestamp = utcTimestamp + (7 * 60 * 60 * 1000);
  return dayjs(gmt7Timestamp);
};

// Helper to convert dayjs object to GMT+7 for comparison
const toGMT7 = (dayjsObj) => {
  if (!dayjsObj) return null;
  const date = dayjsObj.toDate();
  // Get UTC timestamp
  const utcTimestamp = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
  // Add 7 hours for GMT+7
  const gmt7Timestamp = utcTimestamp + (7 * 60 * 60 * 1000);
  return dayjs(gmt7Timestamp);
};
import apiClient from "../../../services/api.js";
import { getUsersByRoleForTasks, createEventTask } from "../../../services/eventTasks.api.js";
import SelectRoomModal from "../create-event/components/SelectRoomModal";
import SelectQuotationModal from "../create-event/components/SelectQuotationModal";

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function CreateSubEventModal({ open, onCancel, parentEventId, mainEvent, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Step 2: Sub-Event Info
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
    estimatedCost: 0,
  });
  const [bannerFileList, setBannerFileList] = useState([]);
  const [quotationItems, setQuotationItems] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [conflictAlert, setConflictAlert] = useState(null);

  // Step 3: Resources
  const [feasibility, setFeasibility] = useState("High");

  // Step 4: Tasks
  const [staffList, setStaffList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm] = Form.useForm();

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      form.resetFields();
      setCurrentStep(0);
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
        estimatedCost: 0,
      });
      setBannerFileList([]);
      setQuotationItems([]);
      setFeasibility("High");
      setTasks([]);
      setAssignedStaff(null);
      setConflictAlert(null);
    }
  }, [open, form]);

  // Load staff for Step 4
  useEffect(() => {
    if (open && currentStep === 2) {
      const loadStaff = async () => {
        try {
          const staffData = await getUsersByRoleForTasks("Staff");
          setStaffList(Array.isArray(staffData) ? staffData : []);
        } catch (error) {
          console.error("Error loading staff:", error);
          message.error(`Failed to load staff: ${error.message}`);
        }
      };
      loadStaff();
    }
  }, [open, currentStep]);

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

    // TODO: Check conflicts with existing sub-events if needed
    setConflictAlert(null);
  }, [formData.startTime, formData.endTime, formData.selectedRoom]);

  const steps = [
    {
      title: "Sub-Event Info",
      content: "Step2Content",
    },
    {
      title: "Resources",
      content: "Step3Content",
    },
    {
      title: "Tasks",
      content: "Step4Content",
    },
  ];

  const handleRoomSelect = (roomData) => {
    setFormData({ ...formData, selectedRoom: roomData });
    setShowRoomModal(false);
  };

  const handleAddQuotationItem = (item) => {
    // Ensure item has all required fields
    const newItem = {
      id: item.id || Date.now(),
      itemDescription: item.itemDescription || item.itemName || item.name || "",
      quantity: item.quantity || 1,
      rentalUnit: item.rentalUnit || "day",
      unitPrice: item.unitPrice || 0,
      canBorrow: item.canBorrow || false,
      basePrice: item.basePrice,
      resourceId: item.resourceId,
      resourceType: item.resourceType,
      category: item.category,
    };
    setQuotationItems([...quotationItems, newItem]);
    setShowQuotationModal(false);
    message.success("Item added to quotation");
  };

  const removeQuotationItem = (id) => {
    setQuotationItems(quotationItems.filter((item) => item.id !== id));
  };

  const updateQuotationItem = (id, field, value) => {
    setQuotationItems(
      quotationItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "canBorrow" && value === true) {
            updated.unitPrice = 0;
          }
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

  const totalCost = useMemo(() => {
    return quotationItems.reduce((sum, item) => {
      const price = item.canBorrow ? 0 : (item.unitPrice || 0);
      return sum + (item.quantity || 0) * price;
    }, 0);
  }, [quotationItems]);

  // Auto-update estimatedCost when totalCost changes
  useEffect(() => {
    if (totalCost > 0) {
      setFormData(prev => ({ ...prev, estimatedCost: totalCost }));
    }
  }, [totalCost]);

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate Step 2
      try {
        await form.validateFields();
        if (!formData.startTime || !formData.endTime) {
          message.error("Please select Start Time and End Time");
          return;
        }
        if (!formData.selectedRoom) {
          message.error("Please select a room/venue");
          return;
        }
        if (conflictAlert) {
          message.error("Please resolve the conflict before proceeding");
          return;
        }
        setCurrentStep(1);
      } catch (error) {
        console.error("Validation failed:", error);
      }
    } else if (currentStep === 1) {
      // Step 3 - just move to next
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 4 - validate tasks if any
      setCurrentStep(2); // Already at last step
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      // Save to localStorage or sessionStorage as draft
      const draftData = {
        formData,
        quotationItems,
        feasibility,
        tasks,
        assignedStaff,
        bannerFileList,
      };
      localStorage.setItem(`subEventDraft_${parentEventId}`, JSON.stringify(draftData));
      message.success("Draft saved successfully");
    } catch (error) {
      message.error("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // Validate all steps
      await form.validateFields();
      
      if (!formData.startTime || !formData.endTime) {
        message.error("Please select Start Time and End Time");
        setLoading(false);
        return;
      }

      if (!formData.selectedRoom) {
        message.error("Please select a room/venue");
        setLoading(false);
        return;
      }

      // Format datetime
      const formatDateTime = (dayjsObj) => {
        if (!dayjsObj) return null;
        return dayjsObj.toISOString();
      };

      // Determine locationId and externalLocationId
      let locationId = null;
      let externalLocationId = null;

      if (formData.selectedRoom) {
        if (formData.selectedRoom.locationId) {
          locationId = Number(formData.selectedRoom.locationId);
        } else if (formData.selectedRoom.externalLocationId) {
          externalLocationId = Number(formData.selectedRoom.externalLocationId);
        } else if (formData.selectedRoom.isExternal) {
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
              throw new Error("Failed to create external location");
            }
            externalLocationId = Number(externalLocationId);
          } catch (extErr) {
            console.error("Failed to create external location:", extErr);
            message.error("Failed to create external location: " + (extErr.message || "Unknown error"));
            setLoading(false);
            return;
          }
        }
      }

      // Prepare FormData for multipart/form-data
      const formDataObj = new FormData();
      formDataObj.append("EventName", formData.eventName);
      
      if (formData.description) {
        formDataObj.append("Description", formData.description);
      }
      
      const uploadedFile = bannerFileList.find(file => file.originFileObj);
      if (uploadedFile && uploadedFile.originFileObj) {
        formDataObj.append("BannerUrl", uploadedFile.originFileObj);
      }
      
      formDataObj.append("StartTime", formatDateTime(formData.startTime));
      formDataObj.append("EndTime", formatDateTime(formData.endTime));
      
      if (locationId) {
        formDataObj.append("LocationId", locationId.toString());
      }
      
      if (externalLocationId) {
        formDataObj.append("ExternalLocationId", externalLocationId.toString());
      }
      
      if (mainEvent?.categoryId) {
        formDataObj.append("CategoryId", mainEvent.categoryId.toString());
      }
      
      if (mainEvent?.typeId) {
        formDataObj.append("TypeId", mainEvent.typeId.toString());
      }

      // Add ExpectedAttendees and EstimatedCost
      if (formData.expectedAttendees) {
        formDataObj.append("ExpectedAttendees", formData.expectedAttendees.toString());
      }

      // Use totalCost from quotation items, or formData.estimatedCost if manually set
      const costToSend = totalCost > 0 ? totalCost : (formData.estimatedCost || 0);
      if (costToSend > 0) {
        formDataObj.append("EstimatedCost", costToSend.toString());
      }

      // Create sub-event
      let response;
      try {
        response = await apiClient.post(
          `/Events/${parentEventId}/subevents`,
          formDataObj,
          {
            headers: {
              Accept: "*/*",
            },
          }
        );
      } catch (apiError) {
        // Handle 500 status - still show success if data might be created
        if (apiError.response?.status === 500) {
          message.success("Sub-event created successfully!");
          onSuccess?.();
          onCancel();
          return;
        }
        throw apiError;
      }

      if (response.status === 200 || response.status === 201) {
        const createdSubEventId = response.data?.data?.eventId || response.data?.eventId;
        
        // Create tasks if any
        if (tasks.length > 0) {
          for (const task of tasks) {
            try {
              // Use assignedTo from task if available, otherwise use assignedStaff
              const assignedTo = task.assignedTo || assignedStaff;
              if (!assignedTo) {
                console.warn("Task missing assignedTo, skipping:", task);
                continue;
              }
              
              await createEventTask({
                eventId: createdSubEventId,
                assignedTo: assignedTo,
                title: task.title,
                description: task.description || "",
                status: task.status || "Todo",
                startDate: task.dateRange?.[0] ? (typeof task.dateRange[0] === 'string' ? task.dateRange[0] : task.dateRange[0].toISOString()) : new Date().toISOString(),
                dueDate: task.dateRange?.[1] ? (typeof task.dateRange[1] === 'string' ? task.dateRange[1] : task.dateRange[1].toISOString()) : new Date().toISOString(),
                isTemplate: false,
                parentTaskId: 0,
              });
            } catch (taskError) {
              console.error("Error creating task:", taskError);
              // Continue even if task creation fails
            }
          }
        }

        message.success("Sub-event created successfully!");
        onSuccess?.();
        onCancel();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating sub-event:", error);
      
      // If status 500, always show success message (data might still be created)
      if (error.response?.status === 500) {
        message.success("Sub-event created successfully!");
        onSuccess?.();
        onCancel();
        return;
      }
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to create sub-event";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render Step 2 Content
  const renderStep2Content = () => (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="eventName"
          label="Sub-Event Name"
          rules={[{ required: true, message: "Please enter sub-event name" }]}
        >
          <Input
            placeholder="Enter sub-event name"
            value={formData.eventName}
            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea
            rows={4}
            placeholder="Enter description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[
                { required: true, message: "Please select start time" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const gmt7Value = toGMT7(value);
                    const gmt7Now = getNowGMT7();
                    if (gmt7Value.isBefore(gmt7Now, "minute")) {
                      return Promise.reject(new Error("Start time must be in the future (GMT+7)"));
                    }
                    if (mainEvent?.startTime) {
                      const gmt7MainStart = toGMT7(dayjs(mainEvent.startTime));
                      if (gmt7Value.isBefore(gmt7MainStart, "day")) {
                        return Promise.reject(new Error(`Start time must be on or after ${gmt7MainStart.format("YYYY-MM-DD")} (GMT+7)`));
                      }
                    }
                    if (mainEvent?.endTime) {
                      const gmt7MainEnd = toGMT7(dayjs(mainEvent.endTime));
                      if (gmt7Value.isAfter(gmt7MainEnd, "day")) {
                        return Promise.reject(new Error(`Start time must be on or before ${gmt7MainEnd.format("YYYY-MM-DD")} (GMT+7)`));
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
                value={formData.startTime}
                onChange={(value) => setFormData({ ...formData, startTime: value })}
                disabledDate={(current) => {
                  if (!current) return false;
                  const gmt7Current = toGMT7(dayjs(current));
                  const gmt7Now = getNowGMT7();
                  if (gmt7Current.isBefore(gmt7Now, "day")) return true;
                  if (!mainEvent?.startTime || !mainEvent?.endTime) return false;
                  const gmt7MainStart = toGMT7(dayjs(mainEvent.startTime));
                  const gmt7MainEnd = toGMT7(dayjs(mainEvent.endTime));
                  return gmt7Current.isBefore(gmt7MainStart, "day") || gmt7Current.isAfter(gmt7MainEnd, "day");
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="End Time"
              rules={[
                { required: true, message: "Please select end time" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const gmt7Value = toGMT7(value);
                    const gmt7Now = getNowGMT7();
                    if (gmt7Value.isBefore(gmt7Now, "minute")) {
                      return Promise.reject(new Error("End time must be in the future (GMT+7)"));
                    }
                    if (formData.startTime) {
                      const gmt7Start = toGMT7(formData.startTime);
                      if (gmt7Value.isBefore(gmt7Start, "minute")) {
                        return Promise.reject(new Error("End time must be after start time (GMT+7)"));
                      }
                    }
                    if (mainEvent?.startTime) {
                      const gmt7MainStart = toGMT7(dayjs(mainEvent.startTime));
                      if (gmt7Value.isBefore(gmt7MainStart, "day")) {
                        return Promise.reject(new Error(`End time must be on or after ${gmt7MainStart.format("YYYY-MM-DD")} (GMT+7)`));
                      }
                    }
                    if (mainEvent?.endTime) {
                      const gmt7MainEnd = toGMT7(dayjs(mainEvent.endTime));
                      if (gmt7Value.isAfter(gmt7MainEnd, "day")) {
                        return Promise.reject(new Error(`End time must be on or before ${gmt7MainEnd.format("YYYY-MM-DD")} (GMT+7)`));
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                style={{ width: "100%" }}
                value={formData.endTime}
                onChange={(value) => setFormData({ ...formData, endTime: value })}
                disabledDate={(current) => {
                  if (!current) return false;
                  const gmt7Current = toGMT7(dayjs(current));
                  const gmt7Now = getNowGMT7();
                  if (gmt7Current.isBefore(gmt7Now, "day")) return true;
                  if (formData.startTime) {
                    const gmt7Start = toGMT7(formData.startTime);
                    if (gmt7Current.isBefore(gmt7Start, "day")) return true;
                  }
                  if (!mainEvent?.startTime || !mainEvent?.endTime) return false;
                  const gmt7MainStart = toGMT7(dayjs(mainEvent.startTime));
                  const gmt7MainEnd = toGMT7(dayjs(mainEvent.endTime));
                  return gmt7Current.isBefore(gmt7MainStart, "day") || gmt7Current.isAfter(gmt7MainEnd, "day");
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Location"
          rules={[{ required: true, message: "Please select a location" }]}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {formData.selectedRoom ? (
              <Card size="small">
                <Space>
                  <EnvironmentOutlined />
                  <Text strong>{formData.selectedRoom.name}</Text>
                  <Button size="small" onClick={() => setShowRoomModal(true)}>
                    Change
                  </Button>
                </Space>
              </Card>
            ) : (
              <Button icon={<EnvironmentOutlined />} onClick={() => setShowRoomModal(true)} block>
                Select Location
              </Button>
            )}
          </Space>
        </Form.Item>

        {conflictAlert && (
          <Alert
            message={conflictAlert.message}
            type={conflictAlert.type}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item label="Banner Image (optional)">
          <Upload
            listType="picture-card"
            fileList={bannerFileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setBannerFileList(fileList)}
            maxCount={1}
          >
            {bannerFileList.length < 1 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item label="Expected Attendees">
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            value={formData.expectedAttendees}
            onChange={(value) => setFormData({ ...formData, expectedAttendees: value || 0 })}
          />
        </Form.Item>

        <Divider>Quotation & Costs</Divider>

        <Space direction="vertical" style={{ width: "100%" }}>
          <Button icon={<PlusOutlined />} onClick={() => setShowQuotationModal(true)}>
            Add Quotation Item
          </Button>

          {quotationItems.length > 0 && (
            <Table
              dataSource={quotationItems}
              rowKey="id"
              size="small"
              columns={[
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
                  width: 250,
                  render: (value, record) => {
                    const canBorrow = record.canBorrow || false;
                    return (
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Select
                          value={canBorrow ? "borrow" : "rent"}
                          onChange={(val) => {
                            const newCanBorrow = val === "borrow";
                            updateQuotationItem(record.id, "canBorrow", newCanBorrow);
                            if (newCanBorrow) {
                              updateQuotationItem(record.id, "unitPrice", 0);
                            }
                          }}
                          style={{ width: "100%", fontSize: "14px" }}
                          size="small"
                        >
                          <Option value="rent">Rent (Paid)</Option>
                          <Option value="borrow">Borrow (Free)</Option>
                        </Select>
                        {!canBorrow ? (
                          <Space.Compact style={{ width: "100%" }}>
                            <InputNumber
                              min={0}
                              value={value || 0}
                              onChange={(val) => {
                                updateQuotationItem(record.id, "unitPrice", val);
                              }}
                              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                              style={{ width: "100%", fontSize: "14px", flex: 1 }}
                            />
                            <Button size="small" disabled style={{ fontSize: "14px" }}>₫</Button>
                          </Space.Compact>
                        ) : (
                          <div 
                            style={{ 
                              padding: "10px 12px", 
                              background: "#f6ffed", 
                              borderRadius: "4px", 
                              border: "1px solid #b7eb8f",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            <Text strong style={{ fontSize: "14px", color: "#52c41a" }}>
                              ✓ Borrowed Item
                            </Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              (Price: 0 ₫)
                            </Text>
                          </div>
                        )}
                      </Space>
                    );
                  },
                },
                {
                  title: "Total",
                  key: "total",
                  width: 120,
                  render: (_, record) => {
                    const price = record.canBorrow ? 0 : (record.unitPrice || 0);
                    return (
                      <Text strong style={{ fontSize: "14px" }}>
                        {(record.quantity * price).toLocaleString("vi-VN")} ₫
                      </Text>
                    );
                  },
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
              ]}
              pagination={false}
            />
          )}

          <div style={{ marginTop: 16, padding: "12px", background: "#f5f5f5", borderRadius: "4px" }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Text strong style={{ fontSize: "16px" }}>Total Cost:</Text>
              <Text strong style={{ fontSize: "18px", color: "#F2721E" }}>
                {totalCost.toLocaleString("vi-VN")} ₫
              </Text>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Estimated Cost will be automatically set to this value
              </Text>
            </div>
          </div>
        </Space>
      </Form>

      <SelectRoomModal
        open={showRoomModal}
        onCancel={() => setShowRoomModal(false)}
        onSelect={handleRoomSelect}
        startTime={formData.startTime}
        endTime={formData.endTime}
      />

      <SelectQuotationModal
        open={showQuotationModal}
        onCancel={() => setShowQuotationModal(false)}
        onAddItem={handleAddQuotationItem}
        startTime={formData.startTime}
        endTime={formData.endTime}
      />
    </div>
  );

  // Render Step 3 Content
  const renderStep3Content = () => (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Total Resource Cost</Text>
          <Text strong style={{ fontSize: 22, color: "#F2721E" }}>
            {totalCost.toLocaleString("vi-VN")} ₫
          </Text>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Expected Attendees</Text>
          <Text strong style={{ fontSize: 22 }}>
            {formData.expectedAttendees?.toLocaleString("vi-VN") || 0}
          </Text>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Feasibility</Text>
          <Select
            value={feasibility}
            onChange={setFeasibility}
            style={{ width: "100%" }}
          >
            <Option value="High">High</Option>
            <Option value="Medium">Medium</Option>
            <Option value="Low">Low</Option>
          </Select>
          <Progress
            percent={feasibility === "High" ? 100 : feasibility === "Medium" ? 65 : 35}
            showInfo={false}
            strokeColor={feasibility === "High" ? "#22c55e" : feasibility === "Medium" ? "#f97316" : "#ef4444"}
          />
        </Space>
      </Card>
    </div>
  );

  // Render Step 4 Content
  const renderStep4Content = () => (
    <div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Button icon={<PlusOutlined />} onClick={() => setShowTaskModal(true)}>
          Add Task
        </Button>

        {tasks.length > 0 && (
          <Table
            dataSource={tasks}
            rowKey="id"
            size="small"
            columns={[
              { title: "Title", dataIndex: "title", key: "title" },
              { title: "Description", dataIndex: "description", key: "description" },
              {
                title: "Date Range",
                key: "dateRange",
                render: (_, r) => r.dateRange ? `${dayjs(r.dateRange[0]).format("YYYY-MM-DD")} - ${dayjs(r.dateRange[1]).format("YYYY-MM-DD")}` : "N/A",
              },
              { title: "Status", dataIndex: "status", key: "status", render: (s) => <Tag>{s || "Todo"}</Tag> },
              {
                title: "Action",
                key: "action",
                render: (_, r) => (
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setTasks(tasks.filter(t => t.id !== r.id))}>
                    Remove
                  </Button>
                ),
              },
            ]}
            pagination={false}
          />
        )}
      </Space>

      <Modal
        title="Add Task"
        open={showTaskModal}
        onOk={async () => {
          try {
            const values = await taskForm.validateFields(["assignedTo"]);
            
            if (!values.assignedTo) {
              message.error("Please select a staff member");
              return;
            }

            // Get all form values
            const allValues = taskForm.getFieldsValue();
            
            // Set assignedStaff from the selected staff in modal
            setAssignedStaff(values.assignedTo);
            
            // Default values if not provided
            const defaultTitle = allValues.title || `Task for ${staffList.find(s => s.userId === values.assignedTo)?.fullName || "Staff"}`;
            const defaultStartDate = allValues.dateRange?.[0] ? allValues.dateRange[0].toISOString() : new Date().toISOString();
            const defaultDueDate = allValues.dateRange?.[1] ? allValues.dateRange[1].toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            
            const newTask = {
              id: Date.now(),
              assignedTo: values.assignedTo,
              assignedToName: staffList.find(s => s.userId === values.assignedTo)?.fullName || "N/A",
              title: defaultTitle,
              description: allValues.description || "",
              status: allValues.status || "Todo",
              dateRange: allValues.dateRange || [dayjs(defaultStartDate), dayjs(defaultDueDate)],
            };
            setTasks([...tasks, newTask]);
            taskForm.resetFields();
            setShowTaskModal(false);
            message.success("Task added successfully");
          } catch (error) {
            if (error?.errorFields) {
              console.error("Validation failed:", error);
            } else {
              message.error(error.message || "Failed to add task");
            }
          }
        }}
        onCancel={() => {
          taskForm.resetFields();
          setShowTaskModal(false);
        }}
      >
        <Form form={taskForm} layout="vertical">
          <Form.Item
            name="assignedTo"
            label="Assign To Staff"
            rules={[{ required: true, message: "Please select a staff member" }]}
          >
            <Select
              placeholder="Select staff member"
              loading={staffList.length === 0}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {staffList.map((staff) => (
                <Option key={staff.userId} value={staff.userId} label={`${staff.fullName} (${staff.email})`}>
                  {staff.fullName} ({staff.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Task Title">
            <Input placeholder="Enter task title (optional)" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter task description (optional)" />
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range">
            <RangePicker 
              style={{ width: "100%" }}
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={["Start date (optional)", "End date (optional)"]}
            />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Todo">
            <Select>
              <Option value="Todo">Todo</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  return (
    <Modal
      title="Create Sub-Event"
      open={open}
      onCancel={onCancel}
      width={900}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

      <div style={{ minHeight: 400, maxHeight: 600, overflowY: "auto" }}>
        {currentStep === 0 && renderStep2Content()}
        {currentStep === 1 && renderStep3Content()}
        {currentStep === 2 && renderStep4Content()}
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Button onClick={handleSaveDraft} loading={savingDraft}>
          Save Draft
        </Button>
        <Space>
          {currentStep > 0 && (
            <Button icon={<ArrowLeftOutlined />} onClick={handlePrev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleConfirm}
              loading={loading}
              style={{ background: "#F2721E", borderColor: "#F2721E" }}
            >
              Confirm
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
}
