import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Tag,
  Spin,
  Table,
  Image,
  Empty,
  Modal,
  Input,
  Form,
  Select,
  DatePicker,
  message,
} from "antd";
import { ArrowLeftOutlined, ReloadOutlined, PlusCircleOutlined, EyeOutlined, UserAddOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getEventById, getSubEvents } from "../../services/events.api";
import { getTasksByEventId, getUsersByRoleForTasks, createEventTask, getMyAssignedTasks } from "../../services/eventTasks.api";
import authService from "../../services/authService";
import CreateSubEventModal from "./components/CreateSubEventModal";

dayjs.extend(utc);
dayjs.extend(timezone);

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

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function EventManagerEventView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [subEvents, setSubEventsState] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showCreateSubEventModal, setShowCreateSubEventModal] = useState(false);
  const [eventMap, setEventMap] = useState({}); // Cache event info: {eventId: {eventName, isSubEvent}}
  
  const [subEventDetailModalOpen, setSubEventDetailModalOpen] = useState(false);
  const [selectedSubEventId, setSelectedSubEventId] = useState(null);
  const [subEventDetail, setSubEventDetail] = useState(null);
  const [loadingSubEventDetail, setLoadingSubEventDetail] = useState(false);
  const [subEventTasks, setSubEventTasks] = useState([]);
  const [loadingSubEventTasks, setLoadingSubEventTasks] = useState(false);
  
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [draftTasks, setDraftTasks] = useState([]); // Tasks created in this session before confirming
  const [viewTaskModalOpen, setViewTaskModalOpen] = useState(false);
  const [selectedTaskToView, setSelectedTaskToView] = useState(null);

  const isMainEvent = useMemo(() => {
    return event && (event.parentEventId === null || event.parentEventId === undefined);
  }, [event]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getEventById(Number(eventId));
      setEvent(res);

      setLoadingSubs(true);
      const subs = await getSubEvents(Number(eventId));
      const subEventsList = Array.isArray(subs) ? subs : [];
      setSubEventsState(subEventsList);
      setLoadingSubs(false);

      // Build event map for display
      const map = {};
      // Add main event
      if (res) {
        map[res.eventId] = {
          eventName: res.eventName,
          isSubEvent: false,
        };
      }
      // Add sub-events
      subEventsList.forEach(sub => {
        map[sub.eventId] = {
          eventName: sub.eventName,
          isSubEvent: true,
        };
      });
      setEventMap(map);

      // Load tasks using my-assigned-tasks API and filter by eventId (main event or sub-events)
      setLoadingTasks(true);
      try {
        const allAssignedTasks = await getMyAssignedTasks();
        const mainEventId = Number(eventId);
        // Filter tasks: include tasks for main event and all its sub-events
        const filteredTasks = allAssignedTasks.filter(task => {
          const taskEventId = task.eventId;
          // Include tasks for main event
          if (taskEventId === mainEventId) return true;
          // Include tasks for sub-events of this main event
          return subEventsList.some(sub => sub.eventId === taskEventId);
        });
        setTasks(filteredTasks);
      } catch (err) {
        console.error("Error loading tasks:", err);
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setLoadingSubs(false);
      setLoadingTasks(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const openSubEventDetail = async (subEventId) => {
    setSelectedSubEventId(subEventId);
    setSubEventDetail(null);
    setSubEventTasks([]);
    setSubEventDetailModalOpen(true);

    try {
      setLoadingSubEventDetail(true);
      const detail = await getEventById(Number(subEventId));
      setSubEventDetail(detail);
    } catch (err) {
      message.error(err.message || "Failed to load sub-event detail");
    } finally {
      setLoadingSubEventDetail(false);
    }

    // Load assigned tasks for this sub-event
    try {
      setLoadingSubEventTasks(true);
      const allAssignedTasks = await getMyAssignedTasks();
      // Filter tasks by eventId (subEventId)
      const filteredTasks = allAssignedTasks.filter(task => task.eventId === Number(subEventId));
      setSubEventTasks(filteredTasks);
    } catch (err) {
      console.error("Error loading assigned tasks:", err);
      setSubEventTasks([]);
    } finally {
      setLoadingSubEventTasks(false);
    }
  };

  const handleOpenAssignTask = async () => {
    setAssignTaskModalOpen(true);
    setDraftTasks([]); // Reset draft tasks
    taskForm.resetFields();
    
    // Load staff list
    try {
      setLoadingStaff(true);
      const staffData = await getUsersByRoleForTasks("Staff");
      setStaffList(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error("Error loading staff:", err);
      message.error("Failed to load staff list");
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAddTask = async () => {
    try {
      // Only validate assignedTo field
      const values = await taskForm.validateFields(["assignedTo"]);
      
      if (!selectedSubEventId) {
        message.error("Sub-event ID is missing");
        return;
      }

      if (!values.assignedTo) {
        message.error("Please select a staff member");
        return;
      }

      setCreatingTask(true);
      
      // Get all form values (including optional fields)
      const allValues = taskForm.getFieldsValue();
      
      // Default values if not provided
      const defaultTitle = allValues.title || `Task for ${staffList.find(s => s.userId === values.assignedTo)?.fullName || "Staff"}`;
      const defaultStartDate = allValues.dateRange?.[0] ? allValues.dateRange[0].toISOString() : new Date().toISOString();
      const defaultDueDate = allValues.dateRange?.[1] ? allValues.dateRange[1].toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default to 7 days from now
      
      const createdTask = await createEventTask({
        eventId: Number(selectedSubEventId),
        assignedTo: values.assignedTo,
        title: defaultTitle,
        description: allValues.description || "",
        status: allValues.status || "Todo",
        startDate: defaultStartDate,
        dueDate: defaultDueDate,
        isTemplate: false,
        parentTaskId: 0,
      });

      // Add to draft tasks list
      const newDraftTask = {
        ...createdTask,
        assignedToName: staffList.find(s => s.userId === values.assignedTo)?.fullName || "N/A",
      };
      setDraftTasks(prev => [...prev, newDraftTask]);
      
      message.success("Task added successfully. Review and confirm when done.");
      taskForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return; // Form validation error
      message.error(err.message || "Failed to add task");
    } finally {
      setCreatingTask(false);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTaskToView(task);
    setViewTaskModalOpen(true);
  };

  const handleConfirmAllTasks = async () => {
    if (draftTasks.length === 0) {
      message.warning("No tasks to confirm");
      return;
    }

    try {
      message.success(`All ${draftTasks.length} task(s) have been assigned successfully`);
      setAssignTaskModalOpen(false);
      setDraftTasks([]);
      taskForm.resetFields();
      
      // Reload assigned tasks for the sub-event using my-assigned-tasks API
      if (selectedSubEventId) {
        try {
          setLoadingSubEventTasks(true);
          const allAssignedTasks = await getMyAssignedTasks();
          const filteredTasks = allAssignedTasks.filter(task => task.eventId === Number(selectedSubEventId));
          setSubEventTasks(filteredTasks);
        } catch (err) {
          console.error("Error reloading assigned tasks:", err);
          message.error("Failed to reload tasks");
        } finally {
          setLoadingSubEventTasks(false);
        }
      }
    } catch (err) {
      message.error(err.message || "Failed to confirm tasks");
    }
  };

  const handleRemoveDraftTask = (taskId) => {
    setDraftTasks(prev => prev.filter(t => t.taskId !== taskId));
    message.success("Task removed from list");
  };

  const subCols = [
    {
      title: "Sub-Event",
      dataIndex: "eventName",
      key: "eventName",
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Time",
      key: "time",
      width: 220,
      render: (_, r) => (
        <div className="text-[12px] text-gray-700">
          <div>{dayjs(r.startTime).format("YYYY-MM-DD HH:mm")}</div>
          <div className="text-gray-500">→ {dayjs(r.endTime).format("YYYY-MM-DD HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      width: 220,
      render: (_, r) =>
        r.location?.name || r.externalLocation?.name || r.locationName || r.externalLocationName || "N/A",
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_, r) => <Tag color="blue">{r.status?.statusName || r.statusName || "N/A"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            openSubEventDetail(record.eventId);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const taskCols = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Event",
      key: "event",
      width: 200,
      render: (_, t) => {
        const eventInfo = eventMap[t.eventId];
        if (!eventInfo) {
          // Fallback: try to get from subEvents or event
          const subEvent = subEvents.find(sub => sub.eventId === t.eventId);
          if (subEvent) {
            return (
              <Space direction="vertical" size={0}>
                <Text strong style={{ fontSize: "13px" }}>{subEvent.eventName}</Text>
                <Tag color="blue" style={{ fontSize: "11px", margin: 0 }}>Sub-Event</Tag>
              </Space>
            );
          }
          if (t.eventId === event?.eventId) {
            return (
              <Space direction="vertical" size={0}>
                <Text strong style={{ fontSize: "13px" }}>{event.eventName}</Text>
                <Tag color="orange" style={{ fontSize: "11px", margin: 0 }}>Main Event</Tag>
              </Space>
            );
          }
          return <Text type="secondary">N/A</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: "13px" }}>{eventInfo.eventName}</Text>
            <Tag color={eventInfo.isSubEvent ? "blue" : "orange"} style={{ fontSize: "11px", margin: 0 }}>
              {eventInfo.isSubEvent ? "Sub-Event" : "Main Event"}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "Assigned To",
      key: "assignedToName",
      width: 180,
      render: (_, t) => t.assignedToName || t.assignedTo || "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s) => (
        <Tag color={s === "Completed" ? "green" : s === "In Progress" ? "blue" : "orange"}>
          {s || "Todo"}
        </Tag>
      ),
    },
    {
      title: "Due",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 180,
      render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "N/A"),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Text type="secondary">Event not found</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/event-manager/dashboard")}>
            Back
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
        </Space>
        {isMainEvent && (
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={() => setShowCreateSubEventModal(true)}
            style={{ background: "#F2721E", borderColor: "#F2721E" }}
          >
            Add Sub-Event
          </Button>
        )}
      </div>

      <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
        Event Detail
      </Title>
      <Text type="secondary">
        {isMainEvent ? "Main event" : "Sub-event"} • Event ID: {event.eventId}
      </Text>

      <Card style={{ marginTop: 16, borderRadius: 12 }}>
        {event.bannerUrl && (
          <div style={{ marginBottom: 16 }}>
            <Image
              src={event.bannerUrl}
              alt="Event banner"
              style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 12 }}
            />
          </div>
        )}

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Event Name" span={2}>
            <Text strong style={{ fontSize: 16 }}>{event.eventName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="orange">{event.status?.statusName || event.statusName || `Status ${event.statusId}`}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Parent Event ID">
            {event.parentEventId ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {event.startTime ? dayjs(event.startTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {event.endTime ? dayjs(event.endTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Attendees">
            {event.expectedAttendees ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Estimated Cost">
            {event.estimatedCost ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Location" span={2}>
            {event.location?.name || event.externalLocation?.name || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {event.description || "N/A"}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            Assigned Tasks
          </Title>
          {loadingTasks ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Spin />
            </div>
          ) : tasks.length === 0 ? (
            <Empty description="No tasks for this event" />
          ) : (
            <Table
              columns={taskCols}
              dataSource={tasks}
              rowKey="taskId"
              size="small"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 800 }}
            />
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            Sub-Events
          </Title>
          {loadingSubs ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Spin />
            </div>
          ) : subEvents.length === 0 ? (
            <Empty description="No sub-events" />
          ) : (
            <Table
              columns={subCols}
              dataSource={subEvents}
              rowKey="eventId"
              size="small"
              pagination={{ pageSize: 8 }}
              scroll={{ x: 900 }}
            />
          )}
        </div>
      </Card>

      {/* Sub-Event Detail Modal */}
      <Modal
        title="Sub-Event Detail"
        open={subEventDetailModalOpen}
        onCancel={() => {
          setSubEventDetailModalOpen(false);
          setSelectedSubEventId(null);
          setSubEventDetail(null);
          setSubEventTasks([]);
        }}
        footer={null}
        width={900}
      >
        {loadingSubEventDetail ? (
          <div style={{ padding: 16, textAlign: "center" }}>
            <Spin />
          </div>
        ) : !subEventDetail ? (
          <Empty description="No data" />
        ) : (
          <div>
            {subEventDetail.bannerUrl && (
              <div style={{ marginBottom: 16 }}>
                <Image
                  src={subEventDetail.bannerUrl}
                  alt="Sub-event banner"
                  style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }}
                />
              </div>
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Sub-Event Name" span={2}>
                <Text strong style={{ fontSize: 16 }}>{subEventDetail.eventName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{subEventDetail.status?.statusName || subEventDetail.statusName || "N/A"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Parent Event ID">{subEventDetail.parentEventId ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {subEventDetail.startTime ? dayjs(subEventDetail.startTime).format("YYYY-MM-DD HH:mm") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {subEventDetail.endTime ? dayjs(subEventDetail.endTime).format("YYYY-MM-DD HH:mm") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Attendees">
                {subEventDetail.expectedAttendees ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Estimated Cost">
                {subEventDetail.estimatedCost ? `${subEventDetail.estimatedCost.toLocaleString("vi-VN")} ₫` : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={2}>
                {subEventDetail.location?.name || subEventDetail.externalLocation?.name || "N/A"}
                {subEventDetail.location && (
                  <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                    {subEventDetail.location.building} - Room {subEventDetail.location.roomNumber} (Capacity: {subEventDetail.location.capacity})
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {subEventDetail.categoryName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {subEventDetail.typeName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Created By" span={2}>
                {subEventDetail.creator?.fullName || subEventDetail.creator?.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {subEventDetail.description || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Title level={4} style={{ margin: 0 }}>Assigned Tasks</Title>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleOpenAssignTask}
                  style={{ background: "#F2721E", borderColor: "#F2721E" }}
                >
                  Assign Task
                </Button>
              </div>

              {loadingSubEventTasks ? (
                <div style={{ padding: 16, textAlign: "center" }}>
                  <Spin />
                </div>
              ) : subEventTasks.length === 0 ? (
                <Empty description="No tasks assigned yet" />
              ) : (
                <Table
                  size="small"
                  rowKey="taskId"
                  pagination={{ pageSize: 5 }}
                  dataSource={subEventTasks}
                  columns={[
                    {
                      title: "Title",
                      dataIndex: "title",
                      key: "title",
                      render: (text) => <Text strong>{text || "N/A"}</Text>,
                    },
                    {
                      title: "Assigned To",
                      key: "assignedToName",
                      width: 150,
                      render: (_, t) => (
                        <div>
                          <div>{t.assignedToName || "N/A"}</div>
                          {t.assignedTo && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              ID: {t.assignedTo}
                            </Text>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: "Assigned By",
                      key: "assignByName",
                      width: 150,
                      render: (_, t) => (
                        <div>
                          <div>{t.assignByName || "Director"}</div>
                          {t.assignBy && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              ID: {t.assignBy}
                            </Text>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      width: 120,
                      render: (s) => {
                        const statusConfig = {
                          "Todo": { color: "default", text: "To Do" },
                          "To Do": { color: "default", text: "To Do" },
                          "Not Started": { color: "default", text: "Not Started" },
                          "In Progress": { color: "processing", text: "In Progress" },
                          "Completed": { color: "success", text: "Completed" },
                        };
                        const config = statusConfig[s] || { color: "default", text: s || "N/A" };
                        return <Tag color={config.color}>{config.text}</Tag>;
                      },
                    },
                    {
                      title: "Start Date",
                      dataIndex: "startDate",
                      key: "startDate",
                      width: 180,
                      render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "N/A"),
                    },
                    {
                      title: "Due Date",
                      dataIndex: "dueDate",
                      key: "dueDate",
                      width: 180,
                      render: (d) => {
                        if (!d) return "N/A";
                        const dueDate = dayjs(d);
                        const isOverdue = dueDate.isBefore(dayjs()) && !["Completed", "Done"].includes(d?.status);
                        return (
                          <div>
                            <div className={isOverdue ? "text-red-600 font-semibold" : ""}>
                              {dueDate.format("YYYY-MM-DD HH:mm")}
                            </div>
                            {isOverdue && (
                              <Tag color="red" size="small" style={{ marginTop: 4 }}>
                                Overdue
                              </Tag>
                            )}
                          </div>
                        );
                      },
                    },
                    {
                      title: "Description",
                      dataIndex: "description",
                      key: "description",
                      render: (text) => (
                        <Text type="secondary" ellipsis={{ tooltip: text }}>
                          {text || "N/A"}
                        </Text>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        title="Assign Task to Staff"
        open={assignTaskModalOpen}
        onCancel={() => {
          setAssignTaskModalOpen(false);
          setDraftTasks([]);
          taskForm.resetFields();
        }}
        footer={null}
        width={900}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Add New Task</Title>
          <Form form={taskForm} layout="vertical">
            <Form.Item
              name="assignedTo"
              label="Assign To Staff"
              rules={[{ required: true, message: "Please select a staff member" }]}
            >
              <Select
                placeholder="Select staff member"
                loading={loadingStaff}
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

            <Form.Item
              name="title"
              label="Task Title"
            >
              <Input placeholder="Enter task title (optional)" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={4} placeholder="Enter task description (optional)" />
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="Date Range"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || !value[0] || !value[1]) {
                      // Optional field, so allow empty
                      return Promise.resolve();
                    }
                    
                    if (!subEventDetail) {
                      return Promise.resolve();
                    }
                    
                    const startDate = toGMT7(value[0]);
                    const endDate = toGMT7(value[1]);
                    const subEventStart = subEventDetail.startTime ? toGMT7(dayjs(subEventDetail.startTime)) : null;
                    const subEventEnd = subEventDetail.endTime ? toGMT7(dayjs(subEventDetail.endTime)) : null;
                    const now = getNowGMT7();
                    
                    // Check if start date is in the past
                    if (startDate.isBefore(now)) {
                      return Promise.reject(new Error("Start date must be in the future (GMT+7)"));
                    }
                    
                    // Check if end date is before start date
                    if (endDate.isBefore(startDate)) {
                      return Promise.reject(new Error("End date must be after start date"));
                    }
                    
                    // Check if dates are within sub-event time range
                    if (subEventStart && startDate.isBefore(subEventStart)) {
                      return Promise.reject(new Error(`Start date must be on or after sub-event start time: ${dayjs(subEventDetail.startTime).format("YYYY-MM-DD HH:mm")}`));
                    }
                    
                    if (subEventEnd && endDate.isAfter(subEventEnd)) {
                      return Promise.reject(new Error(`End date must be on or before sub-event end time: ${dayjs(subEventDetail.endTime).format("YYYY-MM-DD HH:mm")}`));
                    }
                    
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <RangePicker
                style={{ width: "100%" }}
                showTime
                format="YYYY-MM-DD HH:mm"
                placeholder={["Start date (optional)", "End date (optional)"]}
                disabledDate={(current) => {
                  if (!subEventDetail || !subEventDetail.startTime || !subEventDetail.endTime) {
                    // If no sub-event info, only disable past dates
                    return current && current < getNowGMT7().startOf("day");
                  }
                  
                  const subEventStart = dayjs(subEventDetail.startTime).startOf("day");
                  const subEventEnd = dayjs(subEventDetail.endTime).endOf("day");
                  const now = getNowGMT7().startOf("day");
                  
                  // Disable dates before today (GMT+7) or outside sub-event range
                  return current && (current < now || current < subEventStart || current > subEventEnd);
                }}
                disabledTime={(current, type) => {
                  if (!subEventDetail || !subEventDetail.startTime || !subEventDetail.endTime) {
                    return {};
                  }
                  
                  const now = getNowGMT7();
                  const subEventStart = dayjs(subEventDetail.startTime);
                  const subEventEnd = dayjs(subEventDetail.endTime);
                  
                  if (type === "start") {
                    const disabledHours = [];
                    const disabledMinutes = [];
                    
                    // If current date is today, disable past hours/minutes
                    if (current && current.isSame(now, "day")) {
                      const currentHour = now.hour();
                      const currentMinute = now.minute();
                      
                      for (let h = 0; h < currentHour; h++) {
                        disabledHours.push(h);
                      }
                      
                      if (currentHour === now.hour()) {
                        for (let m = 0; m <= currentMinute; m++) {
                          disabledMinutes.push(m);
                        }
                      }
                    }
                    
                    // If current date is sub-event start date, disable hours/minutes before sub-event start
                    if (current && current.isSame(subEventStart, "day")) {
                      const subStartHour = subEventStart.hour();
                      const subStartMinute = subEventStart.minute();
                      
                      for (let h = 0; h < subStartHour; h++) {
                        if (!disabledHours.includes(h)) {
                          disabledHours.push(h);
                        }
                      }
                      
                      if (subStartHour === current.hour()) {
                        for (let m = 0; m < subStartMinute; m++) {
                          if (!disabledMinutes.includes(m)) {
                            disabledMinutes.push(m);
                          }
                        }
                      }
                    }
                    
                    return {
                      disabledHours: () => disabledHours,
                      disabledMinutes: () => disabledMinutes,
                    };
                  } else {
                    // For end time
                    const disabledHours = [];
                    const disabledMinutes = [];
                    
                    // If current date is sub-event end date, disable hours/minutes after sub-event end
                    if (current && current.isSame(subEventEnd, "day")) {
                      const subEndHour = subEventEnd.hour();
                      const subEndMinute = subEventEnd.minute();
                      
                      for (let h = subEndHour + 1; h < 24; h++) {
                        disabledHours.push(h);
                      }
                      
                      if (subEndHour === current.hour()) {
                        for (let m = subEndMinute + 1; m < 60; m++) {
                          disabledMinutes.push(m);
                        }
                      }
                    }
                    
                    return {
                      disabledHours: () => disabledHours,
                      disabledMinutes: () => disabledMinutes,
                    };
                  }
                }}
              />
            </Form.Item>

            <Form.Item name="status" label="Status" initialValue="Todo">
              <Select>
                <Option value="Todo">Todo</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Completed">Completed</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={handleAddTask}
                loading={creatingTask}
                style={{ background: "#F2721E", borderColor: "#F2721E" }}
              >
                Add Task
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* Draft Tasks List */}
        {draftTasks.length > 0 && (
          <div style={{ marginTop: 24, borderTop: "1px solid #e8e8e8", paddingTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Tasks to Confirm ({draftTasks.length})</Title>
              <Button
                type="primary"
                onClick={handleConfirmAllTasks}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Confirm All
              </Button>
            </div>
            <Table
              size="small"
              rowKey="taskId"
              dataSource={draftTasks}
              pagination={false}
              columns={[
                {
                  title: "Title",
                  dataIndex: "title",
                  key: "title",
                  render: (text) => <Text strong>{text}</Text>,
                },
                {
                  title: "Assigned To",
                  key: "assignedToName",
                  width: 180,
                  render: (_, t) => t.assignedToName || "N/A",
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  width: 120,
                  render: (s) => (
                    <Tag color={s === "Completed" ? "green" : s === "In Progress" ? "blue" : "orange"}>
                      {s || "Todo"}
                    </Tag>
                  ),
                },
                {
                  title: "Start Date",
                  dataIndex: "startDate",
                  key: "startDate",
                  width: 180,
                  render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "N/A"),
                },
                {
                  title: "Due Date",
                  dataIndex: "dueDate",
                  key: "dueDate",
                  width: 180,
                  render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "N/A"),
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 150,
                  render: (_, task) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewTask(task)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveDraftTask(task.taskId)}
                      >
                        Remove
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      {/* View Task Modal */}
      <Modal
        title="Task Details"
        open={viewTaskModalOpen}
        onCancel={() => {
          setViewTaskModalOpen(false);
          setSelectedTaskToView(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewTaskModalOpen(false);
            setSelectedTaskToView(null);
          }}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedTaskToView && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Task ID">{selectedTaskToView.taskId}</Descriptions.Item>
            <Descriptions.Item label="Title">
              <Text strong>{selectedTaskToView.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedTaskToView.description || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned To">
              {selectedTaskToView.assignedToName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedTaskToView.status === "Completed" ? "green" : selectedTaskToView.status === "In Progress" ? "blue" : "orange"}>
                {selectedTaskToView.status || "Todo"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Start Date">
              {selectedTaskToView.startDate ? dayjs(selectedTaskToView.startDate).format("YYYY-MM-DD HH:mm") : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {selectedTaskToView.dueDate ? dayjs(selectedTaskToView.dueDate).format("YYYY-MM-DD HH:mm") : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Event ID">
              {selectedTaskToView.eventId || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {event && (
        <CreateSubEventModal
          open={showCreateSubEventModal}
          onCancel={() => setShowCreateSubEventModal(false)}
          parentEventId={event.eventId}
          mainEvent={event}
          onSuccess={() => {
            // Reload sub-events after successful creation
            const reloadSubs = async () => {
              try {
                setLoadingSubs(true);
                const subs = await getSubEvents(Number(eventId));
                setSubEventsState(Array.isArray(subs) ? subs : []);
              } catch (err) {
                console.error("Error reloading sub-events:", err);
              } finally {
                setLoadingSubs(false);
              }
            };
            reloadSubs();
          }}
        />
      )}
    </div>
  );
}

