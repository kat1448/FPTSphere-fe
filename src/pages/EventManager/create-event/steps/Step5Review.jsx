import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Row,
  Col,
  Divider,
  Descriptions,
  Image,
  notification,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { WizardSS } from "../wizardStorage";
// import { useNavigate } from "react-router-dom"; // Reserved for future navigation based on role
import { useAuth } from "../../../../contexts/AuthContext";

const { Text, Title } = Typography;

// Mock users for display
const MOCK_USERS = [
  { id: 1, name: "Nguyen Van A", email: "a.nguyen@fpt.edu.vn", role: "Staff" },
  { id: 2, name: "Tran Thi B", email: "b.tran@fpt.edu.vn", role: "Staff" },
  { id: 3, name: "Le Van C", email: "c.le@fpt.edu.vn", role: "Manager" },
  { id: 4, name: "Pham Thi D", email: "d.pham@fpt.edu.vn", role: "Staff" },
  { id: 5, name: "Hoang Van E", email: "e.hoang@fpt.edu.vn", role: "Staff" },
];

export default function Step5Review({ onPrev }) {
  // const navigate = useNavigate(); // Reserved for future navigation based on role
  const { user } = useAuth();
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [directors, setDirectors] = useState({});
  const [tasks, setTasks] = useState({});
  const [showSubEventModal, setShowSubEventModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);

  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    const subs = WizardSS.get("subEvents", []);
    const savedDirectors = WizardSS.get("directors", {});
    const savedTasks = WizardSS.get("tasks", {});

    setMainEvent(me);
    setSubEvents(subs);
    setDirectors(savedDirectors);
    setTasks(savedTasks);
  }, []);

  const openSubEventModal = (subEvent, index) => {
    setSelectedSubEvent({ ...subEvent, index });
    setShowSubEventModal(true);
  };

  const closeSubEventModal = () => {
    setShowSubEventModal(false);
    setSelectedSubEvent(null);
  };

  const handleEdit = () => {
    // Navigate back to edit
    onPrev();
  };

  const handleSubmit = () => {
    Modal.confirm({
      title: "Confirm Event Submission",
      content: "Are you sure you want to submit this event? You can still edit it later.",
      okText: "Yes, Submit",
      cancelText: "Cancel",
      centered: true, // Popup ở chính giữa màn hình
      okButtonProps: {
        style: { background: "#F2721E", borderColor: "#F2721E" },
      },
      onOk: async () => {
        try {
          // ============================================
          // REGION: TEMPORARY JSON STORAGE
          // TODO: Replace with actual API call when backend is ready
          // This section saves event data to a local JSON file
          // ============================================
          const eventData = {
            id: Date.now(),
            mainEvent: mainEvent,
            subEvents: subEvents,
            directors: directors,
            tasks: tasks,
            createdAt: new Date().toISOString(),
            createdBy: user?.email || user?.name || "Unknown",
          };

          // Load existing events from localStorage (temporary storage)
          // Note: In browser environment, we use localStorage as fallback
          // In production, this should be replaced with actual API call to save to backend
          // File location for reference: /src/data/events-storage.json (for future API implementation)
          const existingEvents = JSON.parse(localStorage.getItem("events_storage") || "[]");
          existingEvents.push(eventData);
          localStorage.setItem("events_storage", JSON.stringify(existingEvents));
          // ============================================
          // END REGION: TEMPORARY JSON STORAGE
          // ============================================

          // Custom success toast message (green, top right, 3 seconds, smaller size)
          notification.success({
            message: "Event Submitted Successfully!",
            description: "Your event has been created and saved.",
            placement: "topRight",
            duration: 3,
            style: {
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              width: "320px", // Thu nhỏ lại khoảng 1 nửa so với default
              fontSize: "12px",
            },
            messageStyle: {
              fontSize: "13px",
              fontWeight: 600,
            },
            descriptionStyle: {
              fontSize: "12px",
            },
          });

          // Clear wizard storage
          WizardSS.clearAll();

          // Determine dashboard route based on user role
          // Note: Navigation is NOT automatic - user can manually navigate
          // The toast message will show success, but user stays on review page
          // to allow them to review or navigate manually
          // When ready to navigate, use:
          // const userRole = user?.role?.toLowerCase() || "manager";
          // const dashboardRoute = userRole === "admin" ? "/admin/dashboard" 
          //   : userRole === "staff" ? "/staff/dashboard" : "/manager/dashboard";
          // navigate(dashboardRoute);
        } catch (error) {
          console.error("Error submitting event:", error);
          notification.error({
            message: "Submission Failed",
            description: "There was an error submitting your event. Please try again.",
            placement: "topRight",
            duration: 3,
          });
        }
      },
    });
  };

  // Quotation columns for sub-event detail
  const quotationColumns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
      render: (text) => <Text style={{ fontSize: 14 }}>{text}</Text>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      align: "center",
      render: (value) => <Text style={{ fontSize: 14 }}>{value}</Text>,
    },
    {
      title: "Rental Unit",
      dataIndex: "rentalUnit",
      key: "rentalUnit",
      width: 120,
      render: (value) => (
        <Text style={{ fontSize: 14 }}>
          {value === "hour" ? "Per Hour" : value === "day" ? "Per Day" : "Per Week"}
        </Text>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 150,
      align: "right",
      render: (value) => (
        <Text style={{ fontSize: 14 }}>{(value || 0).toLocaleString("vi-VN")} ₫</Text>
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 150,
      align: "right",
      render: (_, record) => (
        <Text strong style={{ fontSize: 14 }}>
          {((record.quantity || 0) * (record.unitPrice || 0)).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
  ];

  if (!mainEvent) {
    return (
      <div className="p-6">
        <Text type="secondary" style={{ fontSize: 14 }}>
          Loading review...
        </Text>
      </div>
    );
  }

  const totalCost = subEvents.reduce((sum, sub) => sum + (sub.totalCost || 0), 0);
  const totalAttendees = subEvents.reduce((sum, sub) => sum + (sub.expectedAttendees || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: "#F2721E", fontWeight: 700 }}>
          Step 5: Review & Submit
        </Title>
        <Text style={{ fontSize: 14 }}>
          Review all information before submitting your event
        </Text>
      </div>

      {/* Main Event Overview */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <Text strong style={{ fontSize: 16 }}>
              Main Event Information
            </Text>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(1)}
              style={{ fontSize: 14, color: "#F2721E" }}
            >
              Edit
            </Button>
          </div>
        }
      >
        <Row gutter={24}>
          <Col span={24} md={8}>
            {mainEvent.bannerUrl && (
              <div className="mb-4">
                <Image
                  src={mainEvent.bannerUrl}
                  alt="Event Banner"
                  style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }}
                  preview={false}
                />
              </div>
            )}
          </Col>
          <Col span={24} md={16}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Event Name</Text>}>
                <Text style={{ fontSize: 14 }}>{mainEvent.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Description</Text>}>
                <Text style={{ fontSize: 14 }}>{mainEvent.description || "No description"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Event Type</Text>}>
                <Tag color="blue" style={{ fontSize: 12 }}>{mainEvent.eventType || "Conference"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Category</Text>}>
                <Tag color="geekblue" style={{ fontSize: 12 }}>{mainEvent.category || "Technology"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <CalendarOutlined />
                    <Text style={{ fontSize: 14, fontWeight: 600 }}>Date & Time</Text>
                  </Space>
                }
              >
                <Text style={{ fontSize: 14 }}>
                  {dayjs(mainEvent.start).format("MMM DD, YYYY HH:mm")} - {dayjs(mainEvent.end).format("MMM DD, YYYY HH:mm")}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <EnvironmentOutlined />
                    <Text style={{ fontSize: 14, fontWeight: 600 }}>Location</Text>
                  </Space>
                }
              >
                <Text style={{ fontSize: 14 }}>{mainEvent.locationName || "TBA"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Expected Attendees</Text>}>
                <Text style={{ fontSize: 14 }}>{mainEvent.expectedAttendees || 0} people</Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Sub-Events
              </Text>
              <Text strong style={{ fontSize: 22, color: "#F2721E" }}>
                {subEvents.length}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Expected Attendees
              </Text>
              <Text strong style={{ fontSize: 22 }}>
                {totalAttendees.toLocaleString("vi-VN")}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Estimated Cost
              </Text>
              <Text strong style={{ fontSize: 22, color: "#F2721E" }}>
                {totalCost.toLocaleString("vi-VN")} ₫
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Sub-Events List */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <Text strong style={{ fontSize: 16 }}>
              Sub-Events ({subEvents.length})
            </Text>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(2)}
              style={{ fontSize: 14, color: "#F2721E" }}
            >
              Edit Sub-Events
            </Button>
          </div>
        }
      >
        {subEvents.length === 0 ? (
          <div className="text-center py-8">
            <Text type="secondary" style={{ fontSize: 14 }}>
              No sub-events created.
            </Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {subEvents.map((sub, index) => {
              const subDirector = directors[index];
              const subTasks = tasks[index] || [];
              return (
                <Card
                  key={index}
                  size="small"
                  style={{ marginBottom: 12 }}
                  cover={
                    sub.bannerUrl && (
                      <div
                        style={{
                          height: 120,
                          backgroundImage: `url(${sub.bannerUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )
                  }
                >
                  <div className="flex items-start justify-between">
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16, display: "block", marginBottom: 8 }}>
                        {sub.eventName}
                      </Text>
                      <Space direction="vertical" size={4}>
                        <Space>
                          <CalendarOutlined style={{ color: "#F2721E" }} />
                          <Text style={{ fontSize: 14 }}>
                            {dayjs(sub.startTime).format("MMM DD, YYYY HH:mm")} - {dayjs(sub.endTime).format("HH:mm")}
                          </Text>
                        </Space>
                        <Space>
                          <EnvironmentOutlined style={{ color: "#3b82f6" }} />
                          <Text style={{ fontSize: 14 }}>
                            {sub.selectedLocation?.name || sub.selectedLocation?.code || "TBA"}
                          </Text>
                        </Space>
                        {subDirector && (
                          <Space>
                            <UserOutlined style={{ color: "#F2721E" }} />
                            <Text style={{ fontSize: 14 }}>
                              Director: {MOCK_USERS.find((u) => u.id === subDirector)?.name}
                            </Text>
                          </Space>
                        )}
                        <Space>
                          <Tag color="volcano" style={{ fontSize: 12 }}>{sub.sessionType}</Tag>
                          <Tag color="geekblue" style={{ fontSize: 12 }}>{sub.trackCategory}</Tag>
                          <Tag color="green" style={{ fontSize: 12 }}>{subTasks.length} tasks</Tag>
                        </Space>
                        {sub.totalCost && (
                          <Space>
                            <DollarOutlined style={{ color: "#22c55e" }} />
                            <Text strong style={{ fontSize: 14, color: "#F2721E" }}>
                              {sub.totalCost.toLocaleString("vi-VN")} ₫
                            </Text>
                          </Space>
                        )}
                      </Space>
                    </div>
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => openSubEventModal(sub, index)}
                      style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14, marginLeft: 16 }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Card>

      {/* Sub-Event Detail Modal */}
      <Modal
        title={
          <div>
            <Text strong style={{ fontSize: 18 }}>
              {selectedSubEvent?.eventName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedSubEvent &&
                `${dayjs(selectedSubEvent.startTime).format("MMM DD, YYYY HH:mm")} - ${dayjs(selectedSubEvent.endTime).format("HH:mm")}`}
            </Text>
          </div>
        }
        open={showSubEventModal}
        onCancel={closeSubEventModal}
        footer={null}
        width={900}
      >
        {selectedSubEvent && (
          <div className="space-y-4">
            {/* Sub-Event Info */}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Session Type</Text>} span={1}>
                <Tag color="volcano" style={{ fontSize: 12 }}>{selectedSubEvent.sessionType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Track Category</Text>} span={1}>
                <Tag color="geekblue" style={{ fontSize: 12 }}>{selectedSubEvent.trackCategory}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Location</Text>} span={2}>
                <Text style={{ fontSize: 14 }}>
                  {selectedSubEvent.selectedLocation?.name || selectedSubEvent.selectedLocation?.code || "TBA"}
                  {selectedSubEvent.selectedLocation?.building && (
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      {" "}• {selectedSubEvent.selectedLocation.building} • {selectedSubEvent.selectedLocation.roomNumber || "Room"}
                    </Text>
                  )}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Expected Attendees</Text>} span={1}>
                <Text style={{ fontSize: 14 }}>{selectedSubEvent.expectedAttendees || 0} people</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Feasibility</Text>} span={1}>
                <Tag
                  color={selectedSubEvent.feasibility === "High" ? "green" : selectedSubEvent.feasibility === "Medium" ? "orange" : "red"}
                  style={{ fontSize: 12 }}
                >
                  {selectedSubEvent.feasibility || "High"}
                </Tag>
              </Descriptions.Item>
              {directors[selectedSubEvent.index] && (
                <Descriptions.Item label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Director</Text>} span={2}>
                  <Space>
                    <UserOutlined style={{ color: "#F2721E" }} />
                    <Text style={{ fontSize: 14 }}>
                      {MOCK_USERS.find((u) => u.id === directors[selectedSubEvent.index])?.name}
                    </Text>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            {/* Quotation Table */}
            <div>
              <Text strong style={{ fontSize: 16, marginBottom: 12, display: "block" }}>
                Resource Cost Breakdown
              </Text>
              {selectedSubEvent.quotationItems && selectedSubEvent.quotationItems.length > 0 ? (
                <>
                  <Table
                    columns={quotationColumns}
                    dataSource={selectedSubEvent.quotationItems}
                    pagination={false}
                    size="small"
                    rowKey="id"
                    summary={(pageData) => {
                      const total = pageData.reduce(
                        (sum, record) => sum + (record.quantity || 0) * (record.unitPrice || 0),
                        0
                      );
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row style={{ background: "#fafafa" }}>
                            <Table.Summary.Cell index={0} colSpan={4}>
                              <Text strong style={{ fontSize: 14 }}>
                                Total Cost
                              </Text>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4} align="right">
                              <Text strong style={{ fontSize: 16, color: "#F2721E" }}>
                                {total.toLocaleString("vi-VN")} ₫
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                </>
              ) : (
                <Text type="secondary" style={{ fontSize: 14 }}>
                  No resources assigned.
                </Text>
              )}
            </div>

            <Divider />

            {/* Tasks Summary */}
            {tasks[selectedSubEvent.index] && tasks[selectedSubEvent.index].length > 0 && (
              <div>
                <Text strong style={{ fontSize: 16, marginBottom: 12, display: "block" }}>
                  Assigned Tasks ({tasks[selectedSubEvent.index].length})
                </Text>
                <Space wrap>
                  {tasks[selectedSubEvent.index].map((task, idx) => {
                    const user = MOCK_USERS.find((u) => u.id === task.assignedUser);
                    return (
                      <Tag key={idx} color="blue" style={{ fontSize: 12 }}>
                        {task.taskType} - {user?.name || "Unassigned"}
                      </Tag>
                    );
                  })}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 mt-6">
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev} style={{ fontSize: 14 }}>
          Back to Tasks
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14 }}
          size="large"
        >
          Submit Event
        </Button>
      </div>
    </div>
  );
}
