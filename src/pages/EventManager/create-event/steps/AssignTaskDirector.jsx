// src/pages/EventManager/create-event/steps/AssignTaskDirector.jsx
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Divider,
  DatePicker,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { WizardSS } from "../wizardStorage";
import { createEventTask, getUsersByRoleForTasks } from "../../../../services/eventTasks.api.js";

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

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AssignTaskDirector({ onPrev, onNext }) {
  const [form] = Form.useForm();
  const [mainEvent, setMainEvent] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  // Load users for task assignment from API
  useEffect(() => {
    const loadUsers = async () => {
      setLoadingStaff(true);
      try {
        // Load Staff (roleId = 4) for task assignment
        const staffData = await getUsersByRoleForTasks("Staff");
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        console.error("Error loading users for tasks:", error);
        message.error(`Failed to load users: ${error.message}`);
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    const savedTasks = WizardSS.get("directorTasks", []);

    setMainEvent(me);
    setTasks(savedTasks || []);
  }, []);

  const openTaskModal = (index = null) => {
    if (index !== null) {
      const task = tasks[index];
      form.setFieldsValue({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        startDate: task.startDate ? dayjs(task.startDate) : null,
        dueDate: task.dueDate ? dayjs(task.dueDate) : null,
        status: task.status || "Todo",
      });
      setEditingTaskIndex(index);
    } else {
      form.resetFields();
      setEditingTaskIndex(null);
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTaskIndex(null);
    form.resetFields();
  };

  const handleSaveTask = async () => {
    try {
      const values = await form.validateFields();

      if (!mainEvent?.eventId) {
        message.error("Main event ID is missing");
        return;
      }

      setLoadingTask(true);

      const taskData = {
        eventId: mainEvent.eventId,
        assignedTo: values.assignedTo,
        title: values.title,
        description: values.description || null,
        status: values.status || "Todo",
        startDate: values.startDate,
        dueDate: values.dueDate,
        isTemplate: false,
        parentTaskId: null,
      };

      // For editing, we'll update in local state (API doesn't have update endpoint)
      if (editingTaskIndex !== null) {
        const updatedTasks = [...tasks];
        updatedTasks[editingTaskIndex] = {
          ...taskData,
          taskId: tasks[editingTaskIndex].taskId,
        };
        setTasks(updatedTasks);
        WizardSS.set("directorTasks", updatedTasks);
        message.success("Task updated");
      } else {
        // For new task, add to local state (will be saved when clicking Next)
        const newTask = {
          ...taskData,
          taskId: `temp-${Date.now()}`,
        };
        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        WizardSS.set("directorTasks", updatedTasks);
        message.success("Task added");
      }

      closeTaskModal();
    } catch (error) {
      console.error("Error saving task:", error);
      if (error.errorFields) {
        message.error("Please fill in all required fields");
      } else {
        message.error(error.message || "Failed to save task");
      }
    } finally {
      setLoadingTask(false);
    }
  };

  const deleteTask = (index) => {
    Modal.confirm({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
      onOk: () => {
        const updatedTasks = tasks.filter((_, i) => i !== index);
        setTasks(updatedTasks);
        WizardSS.set("directorTasks", updatedTasks);
        message.success("Task deleted");
      },
    });
  };

  const handleNext = async () => {
    if (!mainEvent?.eventId) {
      message.error("Main event ID is missing");
      return;
    }

    if (tasks.length === 0) {
      message.warning("Please add at least one task");
      return;
    }

    try {
      // Save all tasks to API
      message.loading({ content: "Saving tasks...", key: "saving" });
      
      const savePromises = tasks.map((task) => {
        return createEventTask({
          eventId: mainEvent.eventId,
          assignedTo: task.assignedTo,
          title: task.title,
          description: task.description,
          status: task.status || "Todo",
          startDate: task.startDate,
          dueDate: task.dueDate,
          isTemplate: false,
          parentTaskId: null,
        });
      });

      await Promise.all(savePromises);
      
      message.success({ content: "All tasks saved successfully", key: "saving" });
      
      // Clear wizard storage
      WizardSS.remove("directorTasks");
      
      // Navigate to success page
      onNext();
    } catch (error) {
      console.error("Error saving tasks:", error);
      message.error({ content: error.message || "Failed to save tasks", key: "saving" });
    }
  };

  if (!mainEvent) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Text type="secondary">Main event not found. Please go back to Step 1.</Text>
      </div>
    );
  }

  const taskColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (userId) => {
        const staff = staffList.find((s) => s.userId === userId);
        return staff ? staff.fullName : `User ID: ${userId}`;
      },
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "N/A"),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "N/A"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colorMap = {
          Todo: "default",
          "In Progress": "processing",
          Completed: "success",
        };
        return <Tag color={colorMap[status] || "default"}>{status || "Todo"}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record, index) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openTaskModal(index)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteTask(index)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Title level={3} style={{ margin: "8px 0", color: "#F2721E", fontWeight: 700 }}>
          Assign Tasks for: {mainEvent.name}
        </Title>
        <Text type="secondary">
          Assign tasks to staff members for this event
        </Text>
      </div>

      <Card style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <Text strong style={{ fontSize: "16px" }}>
            Tasks ({tasks.length})
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openTaskModal()}
            style={{ background: "#F2721E", borderColor: "#F2721E" }}
          >
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary">No tasks added yet. Click "Add Task" to create one.</Text>
          </div>
        ) : (
          <Table
            columns={taskColumns}
            dataSource={tasks}
            rowKey={(record, index) => record.taskId || index}
            pagination={false}
          />
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev}>
          Back to Main Event
        </Button>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleNext}
          style={{ background: "#F2721E", borderColor: "#F2721E" }}
        >
          Complete & Finish
        </Button>
      </div>

      {/* Task Modal */}
      <Modal
        title={editingTaskIndex !== null ? "Edit Task" : "Add Task"}
        open={showTaskModal}
        onCancel={closeTaskModal}
        onOk={handleSaveTask}
        confirmLoading={loadingTask}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Task Title *</span>}
            rules={[{ required: true, message: "Please enter task title" }]}
          >
            <Input placeholder="e.g., Prepare event materials" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Description</span>}
          >
            <TextArea rows={3} placeholder="Task description..." />
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Assign To *</span>}
            rules={[{ required: true, message: "Please select staff member" }]}
          >
            <Select
              placeholder="Select staff member"
              size="large"
              loading={loadingStaff}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {staffList.map((staff) => (
                <Option key={staff.userId} value={staff.userId} label={staff.fullName}>
                  <Space>
                    <UserOutlined />
                    <span>{staff.fullName}</span>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      ({staff.email})
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Start Date *</span>}
                rules={[
                  { required: true, message: "Please select start date" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const gmt7Value = toGMT7(value);
                      const gmt7Now = getNowGMT7();
                      if (gmt7Value.isBefore(gmt7Now, "minute")) {
                        return Promise.reject(new Error("Start date must be in the future (GMT+7)"));
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
                  size="large"
                  disabledDate={(current) => {
                    if (!current) return false;
                    const gmt7Current = toGMT7(dayjs(current));
                    const gmt7Now = getNowGMT7();
                    return gmt7Current.isBefore(gmt7Now, "day");
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Due Date *</span>}
                dependencies={["startDate"]}
                rules={[
                  { required: true, message: "Please select due date" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const gmt7Value = toGMT7(value);
                      const gmt7Now = getNowGMT7();
                      if (gmt7Value.isBefore(gmt7Now, "minute")) {
                        return Promise.reject(new Error("Due date must be in the future (GMT+7)"));
                      }
                      return Promise.resolve();
                    },
                  },
                  ({ getFieldValue }) => ({
                    validator: (_, value) => {
                      const startDate = getFieldValue("startDate");
                      if (!startDate || !value) {
                        return Promise.resolve();
                      }
                      const gmt7Start = toGMT7(startDate);
                      const gmt7Due = toGMT7(value);
                      if (gmt7Due.isBefore(gmt7Start, "minute")) {
                        return Promise.reject(new Error("Due date must be after start date (GMT+7)"));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                  size="large"
                  disabledDate={(current) => {
                    if (!current) return false;
                    const gmt7Current = toGMT7(dayjs(current));
                    const gmt7Now = getNowGMT7();
                    if (gmt7Current.isBefore(gmt7Now, "day")) return true;
                    // Also disable dates before startDate if startDate is set
                    const startDate = form.getFieldValue("startDate");
                    if (startDate) {
                      const gmt7Start = toGMT7(startDate);
                      if (gmt7Current.isBefore(gmt7Start, "day")) return true;
                    }
                    return false;
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Status</span>}
            initialValue="Todo"
          >
            <Select size="large">
              <Option value="Todo">Todo</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
