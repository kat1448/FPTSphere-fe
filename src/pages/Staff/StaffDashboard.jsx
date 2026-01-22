import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  message,
  Space,
  Empty,
  Spin
} from "antd";
import dayjs from "dayjs";
import { getMyTasks } from "../../services/eventTasks.api";
import { getEventById } from "../../services/events.api";
import authService from "../../services/authService";


const StaffDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.fullName || "Staff";
  const roleName = user?.roleName || "Staff";

  // Load tasks from API
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log("📤 Fetching my tasks...");
      
      const tasksData = await getMyTasks();
      console.log("✅ Tasks retrieved:", tasksData);
      
      const tasksList = Array.isArray(tasksData) ? tasksData : [];
      
      // Filter tasks: Only show tasks from approved events (statusId = 3)
      // Load event info for each task to check approval status
      const approvedTasks = [];
      
      for (const task of tasksList) {
        if (!task.eventId) {
          // Skip tasks without eventId
          continue;
        }
        
        try {
          // Load event info to check status
          const event = await getEventById(task.eventId);
          
          // Check if event is approved (statusId = 3 or statusName = "Approved")
          const isApproved = event.statusId === 3 || 
                           event.status?.statusName === "Approved" || 
                           event.statusName === "Approved";
          
          if (isApproved) {
            // Add event info to task for display
            approvedTasks.push({
              ...task,
              event: event
            });
          }
        } catch (error) {
          console.error(`Error loading event ${task.eventId}:`, error);
          // Skip this task if we can't load event info
        }
      }
      
      console.log(`✅ Filtered ${approvedTasks.length} approved tasks out of ${tasksList.length} total tasks`);
      setTasks(approvedTasks);
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
      message.error(error.message || "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "Todo" || t.status === "To Do").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const completed = tasks.filter(t => t.status === "Completed").length;

    return {
      total,
      todo,
      inProgress,
      completed,
    };
  }, [tasks]);

  // Handle view task detail
  const handleViewTaskDetail = (task) => {
    if (task.taskId) {
      navigate(`/staff/taskDetail/${task.taskId}`);
    } else {
      message.warning("No task information available");
    }
  };

  // Table columns
  const columns = [
    {
      title: "TASK",
      key: "task",
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-semibold text-[14px] text-gray-900 mb-1">
            {record.title}
          </div>
          <div className="text-[12px] text-gray-500 line-clamp-2">
            {record.description || "No description"}
          </div>
        </div>
      ),
    },
    {
      title: "EVENT",
      key: "event",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-[14px] text-gray-900">
            {record.event?.eventName || "N/A"}
          </div>
          {record.event?.startTime && (
            <div className="text-[12px] text-gray-500">
              {dayjs(record.event.startTime).format("MMM DD, YYYY")}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "ASSIGNED BY",
      key: "assignBy",
      width: 150,
      render: (_, record) => (
        <div className="text-[14px]">
          <UserOutlined className="mr-1 text-gray-400" />
          {record.assignByName || "N/A"}
        </div>
      ),
    },
    {
      title: "DEADLINE",
      key: "deadline",
      width: 150,
      render: (_, record) => {
        if (!record.dueDate) return <span className="text-gray-400">N/A</span>;
        const dueDate = dayjs(record.dueDate);
        const isOverdue = dueDate.isBefore(dayjs()) && record.status !== "Completed";
        
        return (
          <div>
            <div className={`text-[14px] ${isOverdue ? "text-red-500 font-semibold" : "text-gray-900"}`}>
              {dueDate.format("MMM DD, YYYY")}
            </div>
            <div className="text-[12px] text-gray-500">
              {dueDate.format("hh:mm A")}
            </div>
          </div>
        );
      },
    },
    {
      title: "STATUS",
      key: "status",
      width: 120,
      render: (_, record) => {
        const statusMap = {
          "Todo": { color: "default", text: "To Do" },
          "To Do": { color: "default", text: "To Do" },
          "In Progress": { color: "processing", text: "In Progress" },
          "Completed": { color: "success", text: "Completed" },
        };
        
        const statusConfig = statusMap[record.status] || { color: "default", text: record.status };
        
        return (
          <Tag color={statusConfig.color} style={{ borderRadius: "12px", padding: "2px 12px" }}>
            {statusConfig.text}
          </Tag>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewTaskDetail(record)}
          className="p-0 text-[14px]"
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-gray-600">
              {roleName} Dashboard • Manage your assigned tasks
            </p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTasks}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Tasks"
                value={stats.total}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="To Do"
                value={stats.todo}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={stats.inProgress}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tasks Table */}
        <Card className="shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F2721E] mb-4">My Tasks</h2>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchTasks}
                loading={loading}
              >
                Refresh
              </Button>
            <Button
              type="primary"
              icon={<AppstoreOutlined />}
              onClick={() => navigate("/staff/tasks")}
              style={{ background: "#F2721E", borderColor: "#F2721E" }}
            >
              View all my tasks
            </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={tasks}
            loading={loading}
            rowKey="taskId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `Showing ${range[0]} to ${range[1]} of ${total} tasks`,
            }}
            scroll={{ x: 1200 }}
            locale={{
              emptyText: (
                <Empty
                  description="No tasks assigned"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </Card>

      </div>
    </div>
  );
};

export default StaffDashboard;
