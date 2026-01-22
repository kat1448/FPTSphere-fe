import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Tag,
  Spin,
  Image,
  Empty,
  message,
  Divider,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined, UserAddOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getMyTasks } from "../../services/eventTasks.api";
import { getEventById } from "../../services/events.api";

const { Title, Text } = Typography;

export default function StaffTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const tasksData = await getMyTasks();
      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      
      // Find task by taskId
      const foundTask = tasksList.find(t => t.taskId === Number(taskId));
      
      if (!foundTask) {
        message.error("Task not found");
        setTask(null);
        return;
      }
      
      // Check if event is approved - Staff can only view tasks from approved events
      if (foundTask.eventId) {
        try {
          const event = await getEventById(foundTask.eventId);
          
          // Check if event is approved (statusId = 3 or statusName = "Approved")
          const isApproved = event.statusId === 3 || 
                           event.status?.statusName === "Approved" || 
                           event.statusName === "Approved";
          
          if (!isApproved) {
            message.error("This task is not available. The event is pending approval.");
            setTask(null);
            return;
          }
          
          // Add event info to task
          setTask({
            ...foundTask,
            event: event
          });
        } catch (error) {
          console.error(`Error loading event ${foundTask.eventId}:`, error);
          message.error("Failed to load event information");
          setTask(null);
        }
      } else {
        // Task without eventId - allow viewing (edge case)
        setTask(foundTask);
      }
    } catch (error) {
      console.error("Error loading task:", error);
      message.error(error.message || "Failed to load task");
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Empty description="Task not found" />
          <div className="text-center mt-4">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/staff/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const event = task.event;
  const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs()) && task.status !== "Completed";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
                Task Detail
              </Title>
              <Text type="secondary">Task ID: {task.taskId}</Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadTask}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/staff/dashboard")}
              >
                Back to Dashboard
              </Button>
            </Space>
          </div>
        </div>

        {/* Action Buttons */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Title level={4} style={{ margin: 0 }}>
              Actions
            </Title>
            <Space size="middle">
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  if (task.event?.eventId) {
                    window.open(`/staff/inviteStudent/${task.event.eventId}`, '_blank');
                  } else {
                    message.warning("No event information available");
                  }
                }}
                style={{ 
                  background: "#1890ff", 
                  borderColor: "#1890ff",
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Invite
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  if (task.event?.eventId) {
                    navigate(`/staff/attendance/${task.event.eventId}`);
                  } else {
                    message.warning("No event information available");
                  }
                }}
                style={{ 
                  background: "#52c41a", 
                  borderColor: "#52c41a",
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Participation
              </Button>
            </Space>
          </div>
        </Card>

        {/* Task Information */}
        <Card className="shadow-sm mb-6">
          <Title level={4} style={{ marginBottom: 24 }}>
            Task Information
          </Title>
          
          <Descriptions bordered column={2} size="middle">
            <Descriptions.Item label="Title" span={2}>
              <Text strong>{task.title}</Text>
            </Descriptions.Item>
            
            <Descriptions.Item label="Status">
              <Tag 
                color={
                  task.status === "Completed" || task.status === "Done" 
                    ? "green" 
                    : task.status === "In Progress" 
                    ? "blue" 
                    : "orange"
                }
              >
                {task.status || "Not Started"}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Assigned To">
              {task.assignedToName || "N/A"}
            </Descriptions.Item>
            
            <Descriptions.Item label="Assigned By">
              {task.assignByName || "Director"}
            </Descriptions.Item>
            
            <Descriptions.Item label="Start Date">
              {task.startDate
                ? dayjs(task.startDate).format("YYYY-MM-DD HH:mm")
                : "N/A"}
            </Descriptions.Item>
            
            <Descriptions.Item label="Due Date">
              <div>
                {task.dueDate
                  ? dayjs(task.dueDate).format("YYYY-MM-DD HH:mm")
                  : "N/A"}
                {isOverdue && (
                  <Tag color="red" style={{ marginLeft: 8 }}>Overdue</Tag>
                )}
              </div>
            </Descriptions.Item>
            
            {task.completedAt && (
              <Descriptions.Item label="Completed At">
                {dayjs(task.completedAt).format("YYYY-MM-DD HH:mm")}
              </Descriptions.Item>
            )}
            
            <Descriptions.Item label="Description" span={2}>
              {task.description || "N/A"}
            </Descriptions.Item>
            
            {task.report && (
              <Descriptions.Item label="Report" span={2}>
                {task.report}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* Event Information */}
        {event && (
          <Card className="shadow-sm">
            <Title level={4} style={{ marginBottom: 24 }}>
              Event Information
            </Title>
            
            {/* Event Banner */}
            {event.bannerUrl && (
              <div className="mb-4">
                <Image
                  src={event.bannerUrl}
                  alt={event.eventName}
                  style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 }}
                  preview={false}
                />
              </div>
            )}
            
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="Event Name" span={2}>
                <Text strong>{event.eventName}</Text>
                {event.parentEventId && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>Sub-Event</Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="Event ID">
                {event.eventId}
              </Descriptions.Item>
              
              {event.parentEventId && (
                <Descriptions.Item label="Parent Event ID">
                  {event.parentEventId}
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label="Start Time">
                {event.startTime
                  ? dayjs(event.startTime).format("YYYY-MM-DD HH:mm")
                  : "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="End Time">
                {event.endTime
                  ? dayjs(event.endTime).format("YYYY-MM-DD HH:mm")
                  : "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="Location">
                {event.location?.name || event.externalLocation?.name || "N/A"}
                {event.location && (
                  <div style={{ marginTop: 4, fontSize: "12px", color: "#8c8c8c" }}>
                    {event.location.building} - Room {event.location.roomNumber} (Capacity: {event.location.capacity})
                  </div>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label="Expected Attendees">
                {event.expectedAttendees ?? "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="Estimated Cost">
                {event.estimatedCost
                  ? `${event.estimatedCost.toLocaleString("vi-VN")} ₫`
                  : "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="Category">
                {event.categoryName || "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="Type">
                {event.typeName || "N/A"}
              </Descriptions.Item>
              
              <Descriptions.Item label="Description" span={2}>
                {event.description || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>
    </div>
  );
}
