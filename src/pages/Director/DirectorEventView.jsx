import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Space,
  Descriptions,
  Tag,
  Modal,
  Input,
  message,
  Spin,
  Table,
  Image,
  Alert,
  Divider,
  Empty,
  Form,
  Select,
  DatePicker,
  Popconfirm,
} from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, ReloadOutlined, CloseCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

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
import { approveEvent, rejectEvent, getEventById, getSubEvents } from "../../services/events.api";
import { getTasksByEventId, getUsersByRoleForTasks, createEventTask, getMyAssignedTasks, deleteEventTask } from "../../services/eventTasks.api";
import { getDashboardPath } from "../../utils/roleUtils";
import authService from "../../services/authService";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function DirectorEventView() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [subEvents, setSubEventsState] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [eventMap, setEventMap] = useState({}); // Cache event info: {eventId: {eventName, isSubEvent}}

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [processingReject, setProcessingReject] = useState(false);
  const [subEventsModalOpen, setSubEventsModalOpen] = useState(false);

  const [subEventDetailModalOpen, setSubEventDetailModalOpen] = useState(false);
  const [selectedSubEventId, setSelectedSubEventId] = useState(null);
  const [subEventDetail, setSubEventDetail] = useState(null);
  const [loadingSubEventDetail, setLoadingSubEventDetail] = useState(false);
  const [subEventTasks, setSubEventTasks] = useState([]);
  const [loadingSubEventTasks, setLoadingSubEventTasks] = useState(false);
  
  const [approveSubEventModalOpen, setApproveSubEventModalOpen] = useState(false);
  const [subEventComment, setSubEventComment] = useState("");
  const [processingSubEvent, setProcessingSubEvent] = useState(false);
  
  const [rejectSubEventModalOpen, setRejectSubEventModalOpen] = useState(false);
  const [rejectSubEventComment, setRejectSubEventComment] = useState("");
  const [processingRejectSubEvent, setProcessingRejectSubEvent] = useState(false);
  
  const [assignTaskModalOpen, setAssignTaskModalOpen] = useState(false);
  const [taskForm] = Form.useForm();
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const isMainEvent = useMemo(() => {
    return event && (event.parentEventId === null || event.parentEventId === undefined);
  }, [event]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getEventById(Number(eventId));
      setEvent(res);

      let subEventsList = [];
      if (res && (res.parentEventId === null || res.parentEventId === undefined)) {
        setLoadingSubs(true);
        const subs = await getSubEvents(Number(eventId));
        subEventsList = Array.isArray(subs) ? subs : [];
        setSubEventsState(subEventsList);
        
        // Build event map
        const map = {};
        // Add main event
        map[res.eventId] = {
          eventName: res.eventName,
          isSubEvent: false,
        };
        // Add sub-events
        subEventsList.forEach(sub => {
          map[sub.eventId] = {
            eventName: sub.eventName,
            isSubEvent: true,
          };
        });
        setEventMap(map);
      } else {
        setSubEventsState([]);
        // For sub-event view, just add the event itself
        if (res) {
          setEventMap({
            [res.eventId]: {
              eventName: res.eventName,
              isSubEvent: res.parentEventId !== null && res.parentEventId !== undefined,
            },
          });
        }
      }

      // Load tasks for the event using my-assigned-tasks API
      setLoadingTasks(true);
      try {
        const allAssignedTasks = await getMyAssignedTasks();
        // Filter tasks by eventId (main event or sub-events of this main event)
        const mainEventId = Number(eventId);
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
    } catch (e) {
      message.error(e.message || "Failed to load event");
      navigate(getDashboardPath(user?.roleId, user?.roleName));
    } finally {
      setLoading(false);
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const canApprove = useMemo(() => {
    // Status rule may be adjusted based on backend; allow Director to attempt approve if pending-ish
    return !!event && (event.statusId === 1 || event.statusId === 2);
  }, [event]);

  const canReject = useMemo(() => {
    // Allow reject for pending (2) and approved (3) events
    return !!event && (event.statusId === 2 || event.statusId === 3);
  }, [event]);

  const onApprove = async () => {
    try {
      if (!comment.trim()) {
        message.warning("Please enter a comment");
        return;
      }
      setProcessing(true);
      await approveEvent(Number(eventId), comment.trim());
      message.success("Approved successfully");
      setApproveModalOpen(false);
      setComment("");
      await load();
    } catch (e) {
      // Backend may return: "You don't have permission to approve this event"
      message.error(e.message || "Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const onReject = async () => {
    try {
      if (!rejectComment.trim()) {
        message.warning("Please enter a comment");
        return;
      }
      setProcessingReject(true);
      await rejectEvent(Number(eventId), rejectComment.trim());
      message.success("Rejected successfully");
      setRejectModalOpen(false);
      setRejectComment("");
      await load();
    } catch (e) {
      message.error(e.message || "Failed to reject");
    } finally {
      setProcessingReject(false);
    }
  };

  const onApproveSubEvent = async () => {
    if (!selectedSubEventId) return;
    try {
      if (!subEventComment.trim()) {
        message.warning("Please enter a comment");
        return;
      }
      setProcessingSubEvent(true);
      await approveEvent(Number(selectedSubEventId), subEventComment.trim());
      message.success("Sub-event approved successfully");
      setApproveSubEventModalOpen(false);
      setSubEventComment("");
      // Reload sub-event detail and sub-events list
      await openSubEventDetail(selectedSubEventId);
      await load();
    } catch (e) {
      message.error(e.message || "Failed to approve sub-event");
    } finally {
      setProcessingSubEvent(false);
    }
  };

  const onRejectSubEvent = async () => {
    if (!selectedSubEventId) return;
    try {
      if (!rejectSubEventComment.trim()) {
        message.warning("Please enter a comment");
        return;
      }
      setProcessingRejectSubEvent(true);
      await rejectEvent(Number(selectedSubEventId), rejectSubEventComment.trim());
      message.success("Sub-event rejected successfully");
      setRejectSubEventModalOpen(false);
      setRejectSubEventComment("");
      // Reload sub-event detail and sub-events list
      await openSubEventDetail(selectedSubEventId);
      await load();
    } catch (e) {
      message.error(e.message || "Failed to reject sub-event");
    } finally {
      setProcessingRejectSubEvent(false);
    }
  };

  const handleOpenAssignTask = async () => {
    setAssignTaskModalOpen(true);
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

  const handleAssignTask = async () => {
    try {
      const values = await taskForm.validateFields();
      
      if (!eventId) {
        message.error("Event ID is missing");
        return;
      }

      setCreatingTask(true);
      
      await createEventTask({
        eventId: Number(eventId),
        assignedTo: values.assignedTo,
        title: values.title,
        description: values.description || "",
        status: values.status || "Todo",
        startDate: values.dateRange?.[0] ? values.dateRange[0].toISOString() : new Date().toISOString(),
        dueDate: values.dateRange?.[1] ? values.dateRange[1].toISOString() : new Date().toISOString(),
        isTemplate: false,
        parentTaskId: 0,
      });

      message.success("Task assigned successfully");
      setAssignTaskModalOpen(false);
      taskForm.resetFields();
      
      // Reload assigned tasks for the event
      try {
        setLoadingTasks(true);
        const allAssignedTasks = await getMyAssignedTasks();
        const filteredTasks = allAssignedTasks.filter(task => task.eventId === Number(eventId));
        setTasks(filteredTasks);
      } catch (err) {
        console.error("Error reloading assigned tasks:", err);
      } finally {
        setLoadingTasks(false);
      }
    } catch (err) {
      if (err?.errorFields) return; // Form validation error
      message.error(err.message || "Failed to assign task");
    } finally {
      setCreatingTask(false);
    }
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
      width: 240,
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
      width: 240,
      render: (_, r) =>
        r.location?.name || r.externalLocation?.name || r.locationName || r.externalLocationName || "N/A",
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, r) => <Tag color="blue">{r.status?.statusName || r.statusName || "N/A"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, r) => (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            openSubEventDetail(r.eventId);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const openSubEventDetail = async (subEventId) => {
    setSelectedSubEventId(subEventId);
    setSubEventDetail(null);
    setSubEventTasks([]);
    setSubEventDetailModalOpen(true);

    try {
      setLoadingSubEventDetail(true);
      const detail = await getEventById(Number(subEventId));
      setSubEventDetail(detail);
    } catch (e) {
      message.error(e.message || "Failed to load sub-event detail");
    } finally {
      setLoadingSubEventDetail(false);
    }

    try {
      setLoadingSubEventTasks(true);
      const tasks = await getTasksByEventId(Number(subEventId));
      setSubEventTasks(Array.isArray(tasks) ? tasks : []);
    } catch (e) {
      // tasks might be empty or endpoint not configured for some roles
      console.error(e);
      setSubEventTasks([]);
    } finally {
      setLoadingSubEventTasks(false);
    }
  };

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
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/director/dashboard")}
          >
            Back
          </Button>
          <Button icon={<ReloadOutlined />} onClick={load}>
            Refresh
          </Button>
        </Space>
      </div>

      <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
        Director Event View
      </Title>
      <Text type="secondary">
        {isMainEvent ? "Main event" : "Sub-event"} • Event ID: {event.eventId}
      </Text>

      <Divider />

      <Card style={{ borderRadius: 12 }}>
        {event.bannerUrl ? (
          <div style={{ marginBottom: 16 }}>
            <Image
              src={event.bannerUrl}
              alt="Event banner"
              style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 12 }}
            />
          </div>
        ) : null}

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Event Name" span={2}>
            <Text strong style={{ fontSize: 16 }}>{event.eventName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="orange">{event.status?.statusName || event.statusName || `Status ${event.statusId}`}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Parent Event ID">{event.parentEventId ?? "—"}</Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {event.startTime ? dayjs(event.startTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {event.endTime ? dayjs(event.endTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Attendees">{event.expectedAttendees ?? "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Estimated Cost">{event.estimatedCost ?? "N/A"}</Descriptions.Item>
          <Descriptions.Item label="Location" span={2}>
            {event.location?.name || event.externalLocation?.name || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {event.description || "N/A"}
          </Descriptions.Item>
        </Descriptions>

        {isMainEvent && (
          <>
            <Divider />
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <Space>
                <Text strong>Sub-Events</Text>
                <Tag color="blue">{subEvents.length}</Tag>
              </Space>
            </div>
            {loadingSubs ? (
              <div style={{ padding: 16, textAlign: "center" }}>
                <Spin />
              </div>
            ) : (
              <Table
                columns={subCols}
                dataSource={subEvents}
                rowKey="eventId"
                size="small"
                pagination={{ pageSize: 6 }}
                scroll={{ x: 900 }}
                onRow={(record) => ({
                  onClick: () => openSubEventDetail(record.eventId),
                  style: { cursor: "pointer" },
                })}
              />
            )}
          </>
        )}

        <Divider />

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
          {loadingTasks ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Spin />
            </div>
          ) : tasks.length === 0 ? (
            <Empty description="No tasks assigned yet" />
          ) : (
            <Table
              size="small"
              rowKey="taskId"
              pagination={{ pageSize: 5 }}
              dataSource={tasks}
              columns={[
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
                  width: 120,
                  render: (_, task) => {
                    // Only show Confirm button for Completed tasks
                    if (task.status === "Completed" || task.status === "Done") {
                      return (
                        <Popconfirm
                          title="Confirm Task"
                          description="Are you sure you want to confirm and hide this completed task?"
                          onConfirm={async () => {
                            try {
                              await deleteEventTask(task.taskId);
                              message.success("Task confirmed and hidden successfully");
                              // Reload tasks
                              try {
                                const allAssignedTasks = await getMyAssignedTasks();
                                const mainEventId = Number(eventId);
                                const filteredTasks = allAssignedTasks.filter(t => {
                                  const taskEventId = t.eventId;
                                  if (taskEventId === mainEventId) return true;
                                  return subEvents.some(sub => sub.eventId === taskEventId);
                                });
                                setTasks(filteredTasks);
                              } catch (err) {
                                console.error("Error reloading tasks:", err);
                              }
                            } catch (err) {
                              message.error(err.message || "Failed to confirm task");
                            }
                          }}
                          okText="Confirm"
                          cancelText="Cancel"
                          okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
                        >
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            style={{ background: "#52c41a", borderColor: "#52c41a" }}
                          >
                            Confirm
                          </Button>
                        </Popconfirm>
                      );
                    }
                    return null;
                  },
                },
              ]}
            />
          )}
        </div>

        <Divider />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canApprove && (
            <>
              <Alert
                type="warning"
                showIcon
                message="Pending approval"
                description="Approve this event. Backend will approve sub-events when approving the parent event."
                style={{ marginBottom: 12, width: "100%" }}
              />
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
                onClick={() => setApproveModalOpen(true)}
              >
                Approve
              </Button>
            </>
          )}
          {canReject && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setRejectModalOpen(true)}
            >
              Reject
            </Button>
          )}
          {!canApprove && !canReject && (
            <Alert type="info" showIcon message="This event is not in an approvable or rejectable status." />
          )}
        </div>
      </Card>

      <Modal
        title="Approve Event"
        open={approveModalOpen}
        onCancel={() => {
          setApproveModalOpen(false);
          setComment("");
        }}
        onOk={onApprove}
        confirmLoading={processing}
        okText="Approve"
        okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
      >
        <Text type="secondary">Comment *</Text>
        <TextArea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter approve comment..."
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Reject Event Modal */}
      <Modal
        title="Reject Event"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectComment("");
        }}
        onOk={onReject}
        confirmLoading={processingReject}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Alert
          type="warning"
          showIcon
          message="Confirm Rejection"
          description="Are you sure you want to reject this event? This action cannot be undone."
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary">Comment *</Text>
        <TextArea
          rows={4}
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
          placeholder="Enter rejection comment..."
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Sub-Events popup */}
      <Modal
        title="Sub-Events"
        open={subEventsModalOpen}
        onCancel={() => setSubEventsModalOpen(false)}
        footer={null}
        width={900}
      >
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
            onRow={(record) => ({
              onClick: () => openSubEventDetail(record.eventId),
              style: { cursor: "pointer" },
            })}
          />
        )}
      </Modal>

      {/* Sub-Event detail popup (click row in Sub-Events table) */}
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
          <div className="space-y-4">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Event ID">{subEventDetail.eventId}</Descriptions.Item>
              <Descriptions.Item label="Parent Event ID">{subEventDetail.parentEventId ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Sub-Event Name" span={2}>
                <Text strong style={{ fontSize: 16 }}>{subEventDetail.eventName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {subEventDetail.startTime ? dayjs(subEventDetail.startTime).format("YYYY-MM-DD HH:mm") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="End Time">
                {subEventDetail.endTime ? dayjs(subEventDetail.endTime).format("YYYY-MM-DD HH:mm") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Location" span={2}>
                {subEventDetail.location?.name || subEventDetail.externalLocation?.name || subEventDetail.locationName || subEventDetail.externalLocationName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{subEventDetail.status?.statusName || subEventDetail.statusName || "N/A"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {subEventDetail.creator?.fullName || subEventDetail.creator?.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {subEventDetail.description || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {(subEventDetail.statusId === 2 || subEventDetail.statusId === 3) && (
              <div style={{ marginBottom: 16 }}>
                <Space>
                  {subEventDetail.statusId === 2 && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      style={{ background: "#52c41a", borderColor: "#52c41a" }}
                      onClick={() => setApproveSubEventModalOpen(true)}
                    >
                      Approve Sub-Event
                    </Button>
                  )}
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => setRejectSubEventModalOpen(true)}
                  >
                    Reject Sub-Event
                  </Button>
                </Space>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Text strong>Assigned Tasks</Text>
                <Tag color="orange">{subEventTasks.length}</Tag>
              </div>
              {loadingSubEventTasks ? (
                <div style={{ padding: 16, textAlign: "center" }}>
                  <Spin />
                </div>
              ) : subEventTasks.length === 0 ? (
                <Empty description="No tasks assigned" />
              ) : (
                <Table
                  size="small"
                  rowKey="taskId"
                  pagination={{ pageSize: 6 }}
                  dataSource={subEventTasks}
                  columns={[
                    {
                      title: "Title",
                      dataIndex: "title",
                      key: "title",
                    },
                    {
                      title: "Assigned To",
                      key: "assignedToName",
                      render: (_, t) => t.assignedToName || t.assignedTo || "N/A",
                      width: 180,
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      width: 120,
                      render: (s) => <Tag color={s === "Completed" ? "green" : s === "In Progress" ? "blue" : "orange"}>{s || "Todo"}</Tag>,
                    },
                    {
                      title: "Due",
                      dataIndex: "dueDate",
                      key: "dueDate",
                      width: 180,
                      render: (d) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "N/A"),
                    },
                    {
                      title: "Assigned By",
                      key: "assignByName",
                      render: (_, t) => t.assignByName || t.assignBy || "N/A",
                      width: 180,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Sub-Event Modal */}
      <Modal
        title="Approve Sub-Event"
        open={approveSubEventModalOpen}
        onCancel={() => {
          setApproveSubEventModalOpen(false);
          setSubEventComment("");
        }}
        onOk={onApproveSubEvent}
        confirmLoading={processingSubEvent}
        okText="Approve"
        okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
      >
        <Text type="secondary">Comment *</Text>
        <TextArea
          rows={4}
          value={subEventComment}
          onChange={(e) => setSubEventComment(e.target.value)}
          placeholder="Enter approve comment..."
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Reject Sub-Event Modal */}
      <Modal
        title="Reject Sub-Event"
        open={rejectSubEventModalOpen}
        onCancel={() => {
          setRejectSubEventModalOpen(false);
          setRejectSubEventComment("");
        }}
        onOk={onRejectSubEvent}
        confirmLoading={processingRejectSubEvent}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <Alert
          type="warning"
          showIcon
          message="Confirm Rejection"
          description="Are you sure you want to reject this sub-event? This action cannot be undone."
          style={{ marginBottom: 16 }}
        />
        <Text type="secondary">Comment *</Text>
        <TextArea
          rows={4}
          value={rejectSubEventComment}
          onChange={(e) => setRejectSubEventComment(e.target.value)}
          placeholder="Enter rejection comment..."
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        title="Assign Task to Staff"
        open={assignTaskModalOpen}
        onCancel={() => {
          setAssignTaskModalOpen(false);
          taskForm.resetFields();
        }}
        onOk={handleAssignTask}
        confirmLoading={creatingTask}
        okText="Assign"
        okButtonProps={{ style: { background: "#F2721E", borderColor: "#F2721E" } }}
      >
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
            rules={[{ required: true, message: "Please enter task title" }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Enter task description" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[
              { required: true, message: "Please select date range" },
              {
                validator: (_, value) => {
                  if (!value || !value[0] || !value[1]) {
                    return Promise.resolve();
                  }
                  const start = toGMT7(value[0]);
                  const end = toGMT7(value[1]);
                  const now = getNowGMT7();
                  
                  if (start.isBefore(now, "minute")) {
                    return Promise.reject(new Error("Start date must be in the future (GMT+7)"));
                  }
                  if (end.isBefore(start, "minute")) {
                    return Promise.reject(new Error("End date must be after start date (GMT+7)"));
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
              disabledDate={(current) => {
                if (!current) return false;
                const gmt7Current = toGMT7(dayjs(current));
                const gmt7Now = getNowGMT7();
                return gmt7Current.isBefore(gmt7Now, "day");
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
        </Form>
      </Modal>
    </div>
  );
}

