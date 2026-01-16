// src/pages/EventManager/AssignSubEventToStaff.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Spin,
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
import { getEventById, getSubEvents } from "../../services/events.api";
import { createEventTask, getUsersByRoleForTasks } from "../../services/eventTasks.api";
import { getDashboardPath } from "../../utils/roleUtils";
import authService from "../../services/authService";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AssignSubEventToStaff() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [form] = Form.useForm();
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [tasks, setTasks] = useState({}); // { subEventId: [tasks] }
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  // Load staff (roleId = 4) from API
  useEffect(() => {
    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const staffData = await getUsersByRoleForTasks("Staff");
        setStaffList(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        console.error("Error loading staff:", error);
        message.error(`Failed to load staff: ${error.message}`);
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, []);

  // Load main event and sub-events
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const eventData = await getEventById(Number(eventId));
        
        // Handle API response format
        let event = eventData;
        if (eventData?.success !== undefined) {
          if (eventData.success) {
            event = eventData.data;
          } else {
            throw new Error(eventData.message || "Event not found");
          }
        }
        
        setMainEvent(event);

        // Load sub-events
        const subEventsData = await getSubEvents(Number(eventId));
        setSubEvents(Array.isArray(subEventsData) ? subEventsData : []);
      } catch (error) {
        console.error("Error loading event:", error);
        message.error(error.message || "Failed to load event");
        navigate(getDashboardPath(user?.roleId, user?.roleName));
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadData();
    }
  }, [eventId, navigate, user]);

  const openTaskModal = (subEvent, index = null) => {
    setSelectedSubEvent(subEvent);
    if (index !== null && tasks[subEvent.eventId]?.[index]) {
      const task = tasks[subEvent.eventId][index];
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
    setSelectedSubEvent(null);
    setEditingTaskIndex(null);
    form.resetFields();
  };

  const handleSaveTask = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedSubEvent?.eventId) {
        message.error("Sub-event ID is missing");
        return;
      }

      setLoadingTask(true);

      const taskData = {
        eventId: selectedSubEvent.eventId, // Use sub-event ID
        assignedTo: values.assignedTo,
        title: values.title,
        description: values.description || null,
        status: values.status || "Todo",
        startDate: values.startDate,
        dueDate: values.dueDate,
        isTemplate: false,
        parentTaskId: null,
      };

      // For editing, update in local state
      if (editingTaskIndex !== null) {
        const updatedTasks = { ...tasks };
        if (!updatedTasks[selectedSubEvent.eventId]) {
          updatedTasks[selectedSubEvent.eventId] = [];
        }
        updatedTasks[selectedSubEvent.eventId][editingTaskIndex] = {
          ...taskData,
          taskId: tasks[selectedSubEvent.eventId][editingTaskIndex].taskId,
        };
        setTasks(updatedTasks);
        message.success("Task updated");
      } else {
        // For new task, add to local state (will be saved when clicking Save All)
        const updatedTasks = { ...tasks };
        if (!updatedTasks[selectedSubEvent.eventId]) {
          updatedTasks[selectedSubEvent.eventId] = [];
        }
        const newTask = {
          ...taskData,
          taskId: `temp-${Date.now()}-${Math.random()}`,
        };
        updatedTasks[selectedSubEvent.eventId].push(newTask);
        setTasks(updatedTasks);
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

  const deleteTask = (subEventId, index) => {
    Modal.confirm({
      title: "Delete Task",
      content: "Are you sure you want to delete this task?",
      onOk: () => {
        const updatedTasks = { ...tasks };
        if (updatedTasks[subEventId]) {
          updatedTasks[subEventId] = updatedTasks[subEventId].filter((_, i) => i !== index);
          setTasks(updatedTasks);
          message.success("Task deleted");
        }
      },
    });
  };

  const handleSaveAll = async () => {
    if (!mainEvent?.eventId) {
      message.error("Main event ID is missing");
      return;
    }

    // Collect all tasks from all sub-events
    const allTasks = [];
    Object.keys(tasks).forEach((subEventId) => {
      if (tasks[subEventId] && tasks[subEventId].length > 0) {
        allTasks.push(...tasks[subEventId]);
      }
    });

    if (allTasks.length === 0) {
      message.warning("No tasks to save");
      return;
    }

    try {
      message.loading({ content: "Saving tasks...", key: "saving" });
      
      const savePromises = allTasks.map((task) => {
        return createEventTask({
          eventId: task.eventId, // Sub-event ID
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
      
      // Clear tasks
      setTasks({});
      
      // Navigate back
      navigate(getDashboardPath(user?.roleId, user?.roleName));
    } catch (error) {
      console.error("Error saving tasks:", error);
      message.error({ content: error.message || "Failed to save tasks", key: "saving" });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!mainEvent) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Text type="secondary">Event not found</Text>
      </div>
    );
  }

  const taskColumns = (subEventId) => [
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
            onClick={() => {
              const subEvent = subEvents.find((se) => se.eventId === subEventId);
              if (subEvent) {
                openTaskModal(subEvent, index);
              }
            }}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteTask(subEventId, index)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(getDashboardPath(user?.roleId, user?.roleName))}
          style={{ marginBottom: "16px" }}
        >
          Back to Dashboard
        </Button>
        <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
          Assign Tasks to Staff for: {mainEvent.eventName}
        </Title>
        <Text type="secondary">
          Assign tasks to staff members for each sub-event
        </Text>
      </div>

      {subEvents.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary">No sub-events found. Please create sub-events first.</Text>
          </div>
        </Card>
      ) : (
        subEvents.map((subEvent) => (
          <Card
            key={subEvent.eventId}
            title={
              <div>
                <Text strong style={{ fontSize: "16px" }}>
                  {subEvent.eventName}
                </Text>
                <div style={{ marginTop: "4px" }}>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    {subEvent.startTime && subEvent.endTime
                      ? `${dayjs(subEvent.startTime).format("MMM DD, YYYY HH:mm")} - ${dayjs(subEvent.endTime).format("MMM DD, YYYY HH:mm")}`
                      : "Date TBD"}
                  </Text>
                </div>
              </div>
            }
            style={{ marginBottom: "16px" }}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openTaskModal(subEvent)}
                style={{ background: "#F2721E", borderColor: "#F2721E" }}
              >
                Add Task
              </Button>
            }
          >
            {tasks[subEvent.eventId] && tasks[subEvent.eventId].length > 0 ? (
              <Table
                columns={taskColumns(subEvent.eventId)}
                dataSource={tasks[subEvent.eventId]}
                rowKey={(record, index) => record.taskId || index}
                pagination={false}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Text type="secondary">No tasks added yet. Click "Add Task" to create one.</Text>
              </div>
            )}
          </Card>
        ))
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(getDashboardPath(user?.roleId, user?.roleName))}>
          Cancel
        </Button>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleSaveAll}
          style={{ background: "#F2721E", borderColor: "#F2721E" }}
        >
          Save All Tasks
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
        {selectedSubEvent && (
          <div style={{ marginBottom: "16px" }}>
            <Text strong>Sub-Event: </Text>
            <Text>{selectedSubEvent.eventName}</Text>
          </div>
        )}
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
                rules={[{ required: true, message: "Please select start date" }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                  size="large"
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
                  ({ getFieldValue }) => ({
                    validator: (_, value) => {
                      const startDate = getFieldValue("startDate");
                      if (!startDate || !value) {
                        return Promise.resolve();
                      }
                      if (dayjs(value).isBefore(dayjs(startDate))) {
                        return Promise.reject(new Error("Due date must be after start date"));
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
