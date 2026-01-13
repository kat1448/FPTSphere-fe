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
  ArrowRightOutlined,
  UserOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { WizardSS } from "../wizardStorage";
import { getUsersByRole } from "../../../../services/users.api.js";
import { createEventTask } from "../../../../services/eventTasks.api.js";

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function Step4Tasks({ onPrev, onNext }) {
  const [form] = Form.useForm();
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [directors, setDirectors] = useState({});
  const [directorsList, setDirectorsList] = useState([]);
  const [loadingDirectors, setLoadingDirectors] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [loadingTask, setLoadingTask] = useState(false);

  // Load directors from API
  useEffect(() => {
    const loadDirectors = async () => {
      setLoadingDirectors(true);
      try {
        const directorsData = await getUsersByRole(2); // Role ID 2 for Directors
        setDirectorsList(Array.isArray(directorsData) ? directorsData : []);
      } catch (error) {
        console.error("Error loading directors:", error);
        message.error(`Failed to load directors: ${error.message}`);
        setDirectorsList([]);
      } finally {
        setLoadingDirectors(false);
      }
    };

    loadDirectors();
  }, []);

  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    const subs = WizardSS.get("subEvents", []);
    const savedDirectors = WizardSS.get("directors", {});
    const savedTasks = WizardSS.get("tasks", {});

    setMainEvent(me);
    setSubEvents(subs);
    setDirectors(savedDirectors);
    
    // Load tasks for each sub-event
    const tasksMap = {};
    subs.forEach((sub, idx) => {
      tasksMap[idx] = savedTasks[idx] || [];
    });
    setTasks(tasksMap);
  }, []);

  const openTaskModal = (subEvent, index) => {
    setSelectedSubEvent({ ...subEvent, index });
    setTasks((prev) => ({
      ...prev,
      [index]: prev[index] || [],
    }));
    setEditingTaskIndex(null);
    form.resetFields();
    // Set director value in form if exists
    if (directors[index]) {
      form.setFieldsValue({ director: directors[index] });
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setSelectedSubEvent(null);
    setEditingTaskIndex(null);
    form.resetFields();
  };

  const handleAddTask = async () => {
    try {
      const values = await form.validateFields();
      
      // Check if mainEvent has eventId
      if (!mainEvent?.eventId) {
        message.error("Main event ID is missing. Please go back to Step 1.");
        return;
      }

      // Validate date range
      if (!values.dateRange || values.dateRange.length !== 2) {
        message.error("Please select start date and due date");
        return;
      }

      const [startDate, dueDate] = values.dateRange;

      // Prepare task data for API
      const taskData = {
        eventId: mainEvent.eventId,
        assignedTo: values.assignedUser,
        title: values.title || values.taskType || "Task",
        description: values.description || null,
        status: "Todo",
        startDate: dayjs(startDate).format("YYYY-MM-DDTHH:mm:ss"),
        dueDate: dayjs(dueDate).format("YYYY-MM-DDTHH:mm:ss"),
        isTemplate: false,
        parentTaskId: null,
      };

      setLoadingTask(true);

      if (editingTaskIndex !== null) {
        // TODO: Implement update task API when available
        message.warning("Update task feature is not yet implemented");
        setLoadingTask(false);
        return;
      }

      // Create new task via API
      const createdTask = await createEventTask(taskData);

      // Add to local state
      const currentTasks = tasks[selectedSubEvent.index] || [];
      const newTask = {
        taskId: createdTask.taskId,
        title: createdTask.title,
        assignedTo: createdTask.assignedTo,
        assignedToName: createdTask.assignedToName,
        description: createdTask.description || "",
        status: createdTask.status,
        startDate: createdTask.startDate,
        dueDate: createdTask.dueDate,
      };

      setTasks((prev) => ({
        ...prev,
        [selectedSubEvent.index]: [...currentTasks, newTask],
      }));

      message.success("Task created successfully");
      form.resetFields();
      setEditingTaskIndex(null);
    } catch (error) {
      console.error("Error creating task:", error);
      message.error(`Failed to create task: ${error.message}`);
    } finally {
      setLoadingTask(false);
    }
  };

  const handleEditTask = (taskIndex) => {
    const currentTasks = tasks[selectedSubEvent.index] || [];
    const task = currentTasks[taskIndex];
    
    form.setFieldsValue({
      title: task.title,
      assignedUser: task.assignedTo,
      description: task.description,
      dateRange: task.startDate && task.dueDate 
        ? [dayjs(task.startDate), dayjs(task.dueDate)]
        : null,
    });
    setEditingTaskIndex(taskIndex);
  };

  const handleDeleteTask = (taskIndex) => {
    const currentTasks = tasks[selectedSubEvent.index] || [];
    const updated = currentTasks.filter((_, idx) => idx !== taskIndex);
    setTasks((prev) => ({
      ...prev,
      [selectedSubEvent.index]: updated,
    }));
    message.success("Task deleted");
  };

  const handleSave = () => {
    // Save directors and tasks to sessionStorage
    WizardSS.set("directors", directors);
    WizardSS.set("tasks", tasks);
    message.success("Tasks saved");
  };

  const handleNext = () => {
    handleSave();
    onNext();
  };

  const taskColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (text) => <Text style={{ fontSize: 14 }}>{text || "-"}</Text>,
    },
    {
      title: "Assigned To",
      dataIndex: "assignedToName",
      key: "assignedToName",
      width: 200,
      render: (name) => {
        return (
          <Space>
            <UserOutlined />
            <Text style={{ fontSize: 14 }}>{name || "Unassigned"}</Text>
          </Space>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <Text type="secondary" style={{ fontSize: 14 }}>
          {text || "-"}
        </Text>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 150,
      render: (date) => (
        <Text style={{ fontSize: 14 }}>
          {date ? dayjs(date).format("MMM DD, YYYY HH:mm") : "-"}
        </Text>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      render: (date) => (
        <Text style={{ fontSize: 14 }}>
          {date ? dayjs(date).format("MMM DD, YYYY HH:mm") : "-"}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const color = status === "Completed" ? "green" : status === "In Progress" ? "blue" : "orange";
        return (
          <Tag color={color} style={{ fontSize: 12 }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record, index) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(index)}
            style={{ fontSize: 12, padding: 0 }}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(index)}
            style={{ fontSize: 12, padding: 0 }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (!mainEvent) {
    return (
      <div className="p-6">
        <Text type="secondary" style={{ fontSize: 14 }}>
          Loading tasks...
        </Text>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: "#F2721E", fontWeight: 700 }}>
          Step 4: Task Assignment
        </Title>
        <Text style={{ fontSize: 14 }}>
          {mainEvent.name} • {dayjs(mainEvent.start).format("MMM DD")} - {dayjs(mainEvent.end).format("MMM DD, YYYY")}
        </Text>
      </div>

      {/* Sub-Events List */}
      <Card
        title={
          <Text strong style={{ fontSize: 14 }}>
            Sub-Events Task Assignment
          </Text>
        }
      >
        {subEvents.length === 0 ? (
          <div className="text-center py-8">
            <Text type="secondary" style={{ fontSize: 14 }}>
              No sub-events found. Please create sub-events first.
            </Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {subEvents.map((sub, index) => {
              const subTasks = tasks[index] || [];
              const subDirector = directors[index];
              return (
                <Card
                  key={index}
                  size="small"
                  style={{ marginBottom: 12 }}
                  title={
                    <div className="flex items-center justify-between">
                      <div>
                        <Text strong style={{ fontSize: 14 }}>
                          {sub.eventName}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(sub.startTime).format("MMM DD, YYYY HH:mm")} - {dayjs(sub.endTime).format("HH:mm")}
                        </Text>
                        {subDirector && (
                          <>
                            <br />
                            <Space>
                              <UserOutlined style={{ color: "#F2721E", fontSize: 12 }} />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Director: {directorsList.find((u) => u.userId === subDirector)?.fullName || "Unknown"}
                              </Text>
                            </Space>
                          </>
                        )}
                      </div>
                      <Space>
                        <Tag color="blue" style={{ fontSize: 12 }}>
                          {subTasks.length} tasks
                        </Tag>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={() => openTaskModal(sub, index)}
                          style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 12 }}
                        >
                          Assign Tasks
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  {subTasks.length > 0 ? (
                    <Table
                      columns={taskColumns}
                      dataSource={subTasks}
                      pagination={false}
                      size="small"
                      rowKey="taskId"
                    />
                  ) : (
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      No tasks assigned yet. Click "Assign Tasks" to add tasks.
                    </Text>
                  )}
                </Card>
              );
            })}
          </Space>
        )}
      </Card>

      {/* Task Assignment Modal */}
      <Modal
        title={
          <div>
            <Text strong style={{ fontSize: 16 }}>
              Assign Tasks: {selectedSubEvent?.eventName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedSubEvent &&
                `${dayjs(selectedSubEvent.startTime).format("MMM DD, YYYY HH:mm")} - ${dayjs(selectedSubEvent.endTime).format("HH:mm")}`}
            </Text>
          </div>
        }
        open={showTaskModal}
        onCancel={closeTaskModal}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical">
          {/* Director Assignment */}
          <Form.Item
            name="director"
            label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Director</Text>}
            rules={[{ required: true, message: "Please select Director" }]}
          >
            <Select
              placeholder="Select Director for this sub-event"
              size="large"
              style={{ fontSize: 14 }}
              loading={loadingDirectors}
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onChange={(value) => {
                setDirectors((prev) => ({
                  ...prev,
                  [selectedSubEvent.index]: value,
                }));
              }}
            >
              {directorsList.map((user) => (
                <Option key={user.userId} value={user.userId}>
                  {user.fullName} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider style={{ margin: "16px 0" }} />

          <Text strong style={{ fontSize: 14, marginBottom: 12, display: "block" }}>
            Assign Tasks:
          </Text>

          <Form.Item
            name="title"
            label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Task Title</Text>}
            rules={[{ required: true, message: "Please enter task title" }]}
          >
            <Input
              placeholder="Enter task title"
              size="large"
              style={{ fontSize: 14 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="assignedUser"
                label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Assign To</Text>}
                rules={[{ required: true, message: "Please select user" }]}
              >
                <Select
                  placeholder="Select user"
                  size="large"
                  style={{ fontSize: 14 }}
                  loading={loadingDirectors}
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {directorsList.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.fullName} ({user.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateRange"
                label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Start Date - Due Date</Text>}
                rules={[{ required: true, message: "Please select date range" }]}
              >
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  size="large"
                  style={{ width: "100%", fontSize: 14 }}
                  placeholder={["Start Date", "Due Date"]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={<Text style={{ fontSize: 14, fontWeight: 600 }}>Description (Optional)</Text>}
          >
            <TextArea
              rows={3}
              placeholder="Add task description..."
              style={{ fontSize: 14 }}
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mb-4">
            <Button onClick={closeTaskModal} style={{ fontSize: 14 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={editingTaskIndex !== null ? <EditOutlined /> : <PlusOutlined />}
              onClick={handleAddTask}
              loading={loadingTask}
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14 }}
            >
              {editingTaskIndex !== null ? "Update Task" : "Add Task"}
            </Button>
          </div>
        </Form>

        <Divider />

        <div>
          <Text strong style={{ fontSize: 14, marginBottom: 12, display: "block" }}>
            Assigned Tasks:
          </Text>
          {tasks[selectedSubEvent?.index]?.length > 0 ? (
            <Table
              columns={taskColumns}
              dataSource={tasks[selectedSubEvent?.index] || []}
              pagination={false}
              size="small"
              rowKey="id"
            />
          ) : (
            <Text type="secondary" style={{ fontSize: 14 }}>
              No tasks assigned yet.
            </Text>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            icon={<FileTextOutlined />}
            style={{ fontSize: 14 }}
          >
            Generate Report
          </Button>
          <Button
            onClick={closeTaskModal}
            style={{ fontSize: 14 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => {
              handleSave();
              closeTaskModal();
            }}
            style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14 }}
          >
            Save & Close
          </Button>
        </div>
      </Modal>

      <div className="flex justify-end items-center gap-3 mt-6">
        <Button icon={<ArrowLeftOutlined />} onClick={onPrev} style={{ fontSize: 14 }}>
          Back to Resources
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleNext}
          style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14 }}
        >
          Next → Review
        </Button>
      </div>
    </div>
  );
}
