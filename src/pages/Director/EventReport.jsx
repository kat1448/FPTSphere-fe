import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Tag,
  Spin,
  Row,
  Col,
  Statistic,
  Divider,
  Table,
  Image,
  Empty,
  Alert,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getEventById, getSubEvents } from "../../services/events.api";
import { getTasksByEventId } from "../../services/eventTasks.api";
import { getDashboardPath } from "../../utils/roleUtils";
import authService from "../../services/authService";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

export default function EventReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingSubEvents, setLoadingSubEvents] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const eventData = await getEventById(Number(id));
      setEvent(eventData);

      // Load sub-events if this is a main event
      if (eventData && (eventData.parentEventId === null || eventData.parentEventId === undefined)) {
        setLoadingSubEvents(true);
        try {
          const subs = await getSubEvents(Number(id));
          setSubEvents(Array.isArray(subs) ? subs : []);
        } catch (err) {
          console.error("Error loading sub-events:", err);
          setSubEvents([]);
        } finally {
          setLoadingSubEvents(false);
        }
      }

      // Load tasks
      setLoadingTasks(true);
      try {
        const tasksData = await getTasksByEventId(Number(id));
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        console.error("Error loading tasks:", err);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    } catch (error) {
      message.error(error.message || "Failed to load event data");
      navigate(getDashboardPath(user?.roleId, user?.roleName));
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const statistics = React.useMemo(() => {
    if (!event) return null;

    const totalSubEvents = subEvents.length;
    const completedSubEvents = subEvents.filter((sub) => sub.statusId === 5).length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "Completed").length;
    const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length;
    const pendingTasks = tasks.filter((task) => task.status === "Pending").length;

    const expectedAttendees = event.expectedAttendees || 0;
    // Note: Actual attendees would come from attendance API if available
    const actualAttendees = 0; // Placeholder - would need attendance API

    return {
      totalSubEvents,
      completedSubEvents,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      expectedAttendees,
      actualAttendees,
      attendanceRate: expectedAttendees > 0 ? (actualAttendees / expectedAttendees) * 100 : 0,
    };
  }, [event, subEvents, tasks]);

  // Format date/time
  const formatDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    return dayjs(dateTime).format("DD/MM/YYYY HH:mm");
  };

  // Get status tag
  const getStatusTag = (statusId) => {
    const statusMap = {
      1: { color: "default", text: "Draft" },
      2: { color: "warning", text: "Pending Approval" },
      3: { color: "success", text: "Approved" },
      4: { color: "processing", text: "In Progress" },
      5: { color: "success", text: "Completed" },
      6: { color: "error", text: "Cancelled" },
      7: { color: "error", text: "Rejected" },
    };
    const status = statusMap[statusId] || { color: "default", text: "Unknown" };
    return <Tag color={status.color}>{status.text}</Tag>;
  };

  // Sub-events table columns
  const subEventColumns = [
    {
      title: "Sub-Event Name",
      dataIndex: "eventName",
      key: "eventName",
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      key: "startTime",
      render: (text) => formatDateTime(text),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      key: "endTime",
      render: (text) => formatDateTime(text),
    },
    {
      title: "Status",
      dataIndex: "statusId",
      key: "statusId",
      render: (statusId) => getStatusTag(statusId),
    },
  ];

  // Tasks table columns
  const taskColumns = [
    {
      title: "Task Name",
      dataIndex: "taskName",
      key: "taskName",
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (text) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const statusMap = {
          Pending: { color: "warning" },
          "In Progress": { color: "processing" },
          Completed: { color: "success" },
        };
        const config = statusMap[status] || { color: "default" };
        return <Tag color={config.color}>{status}</Tag>;
      },
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (text) => formatDateTime(text),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Empty description="Event not found" />
      </div>
    );
  }

  // Check if event is completed
  if (event.statusId !== 5) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Alert
          message="Event Not Completed"
          description="This report is only available for completed events."
          type="warning"
          showIcon
          action={
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2">
                Event Report
              </Title>
              <Text type="secondary">Comprehensive report for completed event</Text>
            </div>
            <Tag color="success" style={{ fontSize: "14px", padding: "4px 12px" }}>
              Completed
            </Tag>
          </div>
        </div>

        {/* Event Overview Card */}
        <Card className="mb-6">
          <div className="flex items-start gap-6">
            {event.bannerUrl && (
              <Image
                src={event.bannerUrl}
                alt={event.eventName}
                width={200}
                height={120}
                className="rounded-lg object-cover"
                preview={false}
              />
            )}
            <div className="flex-1">
              <Title level={3} className="mb-4">
                {event.eventName}
              </Title>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="Description">
                  {event.description || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  {event.categoryName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {event.typeName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {event.location?.name || event.externalLocation?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Start Time" span={2}>
                  <Space>
                    <CalendarOutlined />
                    {formatDateTime(event.startTime)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="End Time" span={2}>
                  <Space>
                    <ClockCircleOutlined />
                    {formatDateTime(event.endTime)}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Creator">
                  {event.creator?.fullName || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {formatDateTime(event.createdAt)}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        {statistics && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Expected Attendees"
                  value={statistics.expectedAttendees}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Actual Attendees"
                  value={statistics.actualAttendees}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Attendance Rate"
                  value={statistics.attendanceRate.toFixed(1)}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Tasks"
                  value={statistics.totalTasks}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed Tasks"
                  value={statistics.completedTasks}
                  suffix={`/ ${statistics.totalTasks}`}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Sub-Events"
                  value={statistics.totalSubEvents}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Completed Sub-Events"
                  value={statistics.completedSubEvents}
                  suffix={`/ ${statistics.totalSubEvents}`}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Estimated Cost"
                  value={event.estimatedCost || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: "#fa8c16" }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Task Statistics */}
        {statistics && statistics.totalTasks > 0 && (
          <Card title="Task Statistics" className="mb-6">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Completed"
                  value={statistics.completedTasks}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="In Progress"
                  value={statistics.inProgressTasks}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Pending"
                  value={statistics.pendingTasks}
                  valueStyle={{ color: "#faad14" }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Sub-Events Section */}
        {subEvents.length > 0 && (
          <Card title="Sub-Events" className="mb-6">
            <Table
              columns={subEventColumns}
              dataSource={subEvents}
              rowKey="eventId"
              loading={loadingSubEvents}
              pagination={false}
            />
          </Card>
        )}

        {/* Tasks Section */}
        {tasks.length > 0 && (
          <Card title="Tasks" className="mb-6">
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="taskId"
              loading={loadingTasks}
              pagination={false}
            />
          </Card>
        )}

        {/* Empty States */}
        {subEvents.length === 0 && tasks.length === 0 && (
          <Card>
            <Empty description="No sub-events or tasks found for this event" />
          </Card>
        )}
      </div>
    </div>
  );
}
