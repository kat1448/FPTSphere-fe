import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  message,
  Spin,
  Empty,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getMyTasks, updateTaskStatus } from "../../services/eventTasks.api";
import { getEventById } from "../../services/events.api";

const { Title, Text } = Typography;

// Map status from API to kanban columns
const mapStatusToKanban = (status) => {
  if (!status) return "Not Started";
  
  // Map various status formats to kanban columns
  const statusLower = status.toLowerCase().trim();
  if (statusLower === "todo" || statusLower === "to do" || statusLower === "not started") {
    return "Not Started";
  }
  if (statusLower === "in progress") {
    return "In Progress";
  }
  if (statusLower === "completed" || statusLower === "done") {
    return "Completed";
  }
  
  // If status is already in correct format, return as is
  if (status === "Not Started" || status === "In Progress" || status === "Completed") {
    return status;
  }
  
  // Default to "Not Started"
  return "Not Started";
};

// Map kanban status to API status
const mapKanbanToApiStatus = (kanbanStatus) => {
  return kanbanStatus; // API expects "Not Started", "In Progress", "Completed"
};

export default function StaffTasksKanban() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [eventMap, setEventMap] = useState({});

  const columns = [
    {
      id: "Not Started",
      title: "TO DO",
      color: "#faad14",
    },
    {
      id: "In Progress",
      title: "IN PROGRESS",
      color: "#1890ff",
    },
    {
      id: "Completed",
      title: "COMPLETED",
      color: "#52c41a",
    },
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await getMyTasks();
      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      
      // Filter tasks: Only show tasks from approved events (statusId = 3)
      // Load event info for tasks and filter by approval status
      const eventIds = [...new Set(tasksList.map(t => t.eventId).filter(Boolean))];
      const map = {};
      const approvedTasks = [];
      
      // Load event info
      await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const event = await getEventById(eventId);
            map[eventId] = event;
          } catch (error) {
            console.error(`Error loading event ${eventId}:`, error);
          }
        })
      );
      
      // Filter tasks: only include tasks from approved events
      for (const task of tasksList) {
        if (!task.eventId) {
          continue;
        }
        
        const event = map[task.eventId];
        if (!event) {
          // Skip if event not found
          continue;
        }
        
        // Check if event is approved (statusId = 3 or statusName = "Approved")
        const isApproved = event.statusId === 3 || 
                         event.status?.statusName === "Approved" || 
                         event.statusName === "Approved";
        
        if (isApproved) {
          approvedTasks.push({
            ...task,
            event: event
          });
        }
      }
      
      console.log(`✅ Filtered ${approvedTasks.length} approved tasks out of ${tasksList.length} total tasks`);
      setEventMap(map);
      setTasks(approvedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      message.error(error.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      
      const apiStatus = mapKanbanToApiStatus(newStatus);
      await updateTaskStatus(taskId, apiStatus);
      
      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.taskId === taskId
            ? { ...task, status: apiStatus }
            : task
        )
      );
      
      message.success("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task status:", error);
      message.error(error.message || "Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => {
      const kanbanStatus = mapStatusToKanban(task.status);
      return kanbanStatus === status;
    });
  };

  const renderTaskCard = (task, currentColumn) => {
    const event = eventMap[task.eventId] || task.event;
    const isUpdating = updatingTaskId === task.taskId;
    
    // Get adjacent columns for navigation
    const currentIndex = columns.findIndex(col => col.id === currentColumn.id);
    const leftColumn = currentIndex > 0 ? columns[currentIndex - 1] : null;
    const rightColumn = currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
    
    return (
      <Card
        key={task.taskId}
        size="small"
        style={{
          marginBottom: 12,
          opacity: isUpdating ? 0.6 : 1,
          border: "1px solid #e8e8e8",
        }}
        loading={isUpdating}
      >
        <div>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            {task.title}
          </Text>
          
          {task.description && (
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginBottom: 8 }}
              ellipsis={{ tooltip: task.description }}
            >
              {task.description}
            </Text>
          )}

          {event && (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Event: </Text>
              <Text style={{ fontSize: 11 }}>{event.eventName || "N/A"}</Text>
            </div>
          )}

          {task.dueDate && (
            <div style={{ marginBottom: 8 }}>
              <Space size={4}>
                <CalendarOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
                <Text style={{ fontSize: 11 }}>
                  {dayjs(task.dueDate).format("MMM DD, YYYY")}
                </Text>
              </Space>
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <Space size={4}>
              <UserOutlined style={{ fontSize: 11, color: "#8c8c8c" }} />
              <Text style={{ fontSize: 11 }}>
                {task.assignByName || "Director"}
              </Text>
            </Space>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {/* Left button (blue) */}
            {leftColumn && (
              <Button
                size="small"
                type="primary"
                icon={<ArrowLeftOutlined />}
                onClick={() => handleStatusChange(task.taskId, leftColumn.id)}
                disabled={isUpdating}
                style={{ 
                  background: "#1890ff", 
                  borderColor: "#1890ff",
                  fontSize: 11,
                  height: 28,
                }}
              >
                {leftColumn.title}
              </Button>
            )}
            
            {/* Right button (orange) */}
            {rightColumn && (
              <Button
                size="small"
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => handleStatusChange(task.taskId, rightColumn.id)}
                disabled={isUpdating}
                style={{ 
                  background: "#F2721E", 
                  borderColor: "#F2721E",
                  fontSize: 11,
                  height: 28,
                }}
              >
                {rightColumn.title}
              </Button>
            )}

            {/* View Event button (only for IN PROGRESS) */}
            {currentColumn.id === "In Progress" && task.eventId && (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  const eventId = task.eventId;
                  // Try to open event view page - could be event-manager or director view
                  window.open(`/event-manager/${eventId}/view`, "_blank");
                }}
                style={{ 
                  fontSize: 11,
                  height: 28,
                }}
              >
                View Event
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderColumn = (column) => {
    const columnTasks = getTasksByStatus(column.id);
    
    return (
      <Col xs={24} md={8} key={column.id}>
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ color: column.color, fontSize: 14 }}>
                {column.title}
              </Text>
              <Tag color={column.color}>{columnTasks.length}</Tag>
            </div>
          }
          style={{ height: "100%", minHeight: 600 }}
          bodyStyle={{ padding: 12, maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}
        >
          {columnTasks.length === 0 ? (
            <Empty
              description="No tasks"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 40 }}
            />
          ) : (
            <div>
              {columnTasks.map((task) => renderTaskCard(task, column))}
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
                My Tasks Kanban
              </Title>
              <Text type="secondary">Click buttons to move tasks between columns</Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTasks}
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

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={16}>
            {columns.map((column) => renderColumn(column))}
          </Row>
        )}
      </div>
    </div>
  );
}
