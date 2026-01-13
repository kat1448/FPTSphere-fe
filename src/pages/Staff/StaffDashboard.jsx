import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message,
  Space,
  Empty,
  Spin
} from "antd";
import dayjs from "dayjs";
import { getMyTasks } from "../../services/eventTasks.api";
import authService from "../../services/authService";

const { TextArea } = Input;

const StaffDashboard = () => {
  const user = authService.getCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportForm] = Form.useForm();

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
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
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

  // Handle open report modal
  const handleOpenReport = (task) => {
    setSelectedTask(task);
    reportForm.setFieldsValue({
      report: task.report || "",
    });
    setReportModalVisible(true);
  };

  // Handle submit report
  const handleSubmitReport = async () => {
    try {
      const values = await reportForm.validateFields();
      
      // TODO: Call API to update report
      // For now, just update local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.taskId === selectedTask.taskId
            ? { ...task, report: values.report }
            : task
        )
      );

      message.success("Report saved successfully!");
      setReportModalVisible(false);
      setSelectedTask(null);
      reportForm.resetFields();
    } catch (error) {
      console.error("Error submitting report:", error);
      if (error.errorFields) {
        // Form validation errors
        return;
      }
      message.error("Failed to save report");
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
          icon={<FileTextOutlined />}
          onClick={() => handleOpenReport(record)}
          className="p-0 text-[14px]"
        >
          {record.report ? "View Report" : "Add Report"}
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
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#F2721E] mb-4">My Tasks</h2>
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

        {/* Report Modal */}
        <Modal
          title={
            <div>
              <div className="text-lg font-semibold">
                {selectedTask?.report ? "View/Update Report" : "Add Report"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {selectedTask?.title}
              </div>
            </div>
          }
          open={reportModalVisible}
          onOk={handleSubmitReport}
          onCancel={() => {
            setReportModalVisible(false);
            setSelectedTask(null);
            reportForm.resetFields();
          }}
          okText="Save Report"
          cancelText="Cancel"
          width={700}
        >
          {selectedTask && (
            <div>
              <Form form={reportForm} layout="vertical">
                <Form.Item
                  name="report"
                  label="Report Content"
                  rules={[
                    {
                      required: true,
                      message: "Please enter report content",
                    },
                  ]}
                >
                  <TextArea
                    rows={8}
                    placeholder="Enter detailed report about this task..."
                    maxLength={2000}
                    showCount
                  />
                </Form.Item>
              </Form>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Task Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Event:</strong> {selectedTask.event?.eventName || "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedTask.description || "N/A"}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {selectedTask.dueDate
                      ? dayjs(selectedTask.dueDate).format("MMM DD, YYYY hh:mm A")
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedTask.status}
                  </p>
                  <p>
                    <strong>Assigned By:</strong> {selectedTask.assignByName || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default StaffDashboard;
