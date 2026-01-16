import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ReloadOutlined,
  PlusCircleOutlined,
  UpOutlined,
  DownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SwapOutlined
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
  Spin,
  Descriptions,
  Upload,
  DatePicker,
  InputNumber,
  Popconfirm,
  Avatar,
  Progress
} from "antd";
import dayjs from "dayjs";
import { getMyTasks, getMyAssignedTasks } from "../../services/eventTasks.api";
import { getPendingApprovalEvents, getEventById, getSubEvents, updateEvent, updateSubEvent, deleteEvent, getEvents } from "../../services/events.api";
import authService from "../../services/authService";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EventManagerDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [expandedPendingRowKeys, setExpandedPendingRowKeys] = useState([]);
  const [subEventsByMainEventId, setSubEventsByMainEventId] = useState({}); // { [eventId]: subEvents[] }
  const [loadingSubEventsByMainEventId, setLoadingSubEventsByMainEventId] = useState({}); // { [eventId]: boolean }

  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);
  const [loadingEventDetail, setLoadingEventDetail] = useState(false);
  const [subEvents, setSubEvents] = useState([]);
  const [loadingSubEvents, setLoadingSubEvents] = useState(false);
  const [subEventsMinimized, setSubEventsMinimized] = useState(false);
  const [mainEventIdForSubEvents, setMainEventIdForSubEvents] = useState(null); // Track which main event's sub-events we're viewing
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [editForm] = Form.useForm();
  const [editBannerFileList, setEditBannerFileList] = useState([]);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reportForm] = Form.useForm();

  // Event List states
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const displayName = user?.fullName || "Event Manager";
  const roleName = user?.roleName || "Event Manager";

  // Load tasks from API
  useEffect(() => {
    fetchTasks();
    fetchPendingApproval();
    fetchEvents();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log("📤 Fetching my assigned tasks...");
      
      const tasksData = await getMyAssignedTasks();
      console.log("✅ Assigned tasks retrieved:", tasksData);
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error("❌ Error loading assigned tasks:", error);
      message.error(error.message || "Failed to load assigned tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApproval = async () => {
    try {
      setLoadingPending(true);
      const data = await getPendingApprovalEvents();
      setPendingEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error loading pending approval events:", error);
      message.error(error.message || "Failed to load pending approval events");
      setPendingEvents([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const params = {
        page: 1,
        pageSize: 100,
        includeDeleted: false,
        sortBy: "CreatedAt",
        sortDescending: true,
      };
      
      const response = await getEvents(params);
      
      // Extract events array from response
      let eventsList = [];
      if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        eventsList = response.data.data;
      } else if (response && response.data && Array.isArray(response.data)) {
        eventsList = response.data;
      } else if (Array.isArray(response)) {
        eventsList = response;
      } else {
        console.error("❌ Unexpected response structure:", response);
        setEvents([]);
        setLoadingEvents(false);
        return;
      }

      // Filter: Only get main events (parentEventId === null)
      const mainEvents = eventsList.filter((ev) => {
        const parentId = ev.parentEventId;
        return parentId === null || parentId === undefined;
      });

      // Transform API events to match table format
      const transformedEvents = mainEvents.map((event) => {
        // Get location name
        let locationName = "Location TBD";
        if (event.location) {
          locationName = event.location.name || 
                        event.location.roomNumber || 
                        locationName;
        } else if (event.externalLocation) {
          locationName = event.externalLocation.name || locationName;
        }
        
        // Map statusId to status name (according to database status table)
        const statusMap = {
          1: "Draft",
          2: "Pending Approval",
          3: "Approved",
          4: "In Progress",
          5: "Completed",
          6: "Cancelled",
          7: "Rejected"
        };
        const status = statusMap[event.statusId] || event.status?.statusName || "Draft";

        // Format date and time
        const startTime = dayjs(event.startTime);

        return {
          key: event.eventId,
          id: event.eventId,
          eventId: event.eventId,
          eventName: event.eventName || "Untitled Event",
          type: event.typeName || "Conference",
          date: event.startTime,
          time: startTime.format("hh:mm A"),
          timezone: "UTC",
          status: status,
          statusId: event.statusId,
          attendees: {
            current: event.expectedAttendees || 0,
            max: event.expectedAttendees || 0,
          },
          location: locationName,
          startTime: event.startTime,
          endTime: event.endTime,
          description: event.description,
          bannerUrl: event.bannerUrl,
          creator: event.creator,
          categoryName: event.categoryName,
        };
      });

      setEvents(transformedEvents);
    } catch (error) {
      console.error("❌ Error loading events:", error);
      message.error(error.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadSubEventsInline = async (mainEventId) => {
    if (!mainEventId) return;

    // If already cached, skip
    if (Array.isArray(subEventsByMainEventId[mainEventId])) return;

    try {
      setLoadingSubEventsByMainEventId((prev) => ({ ...prev, [mainEventId]: true }));
      const subs = await getSubEvents(mainEventId);
      setSubEventsByMainEventId((prev) => ({
        ...prev,
        [mainEventId]: Array.isArray(subs) ? subs : [],
      }));
    } catch (error) {
      console.error("❌ Error loading sub-events inline:", error);
      message.error(error.message || "Failed to load sub-events");
      setSubEventsByMainEventId((prev) => ({ ...prev, [mainEventId]: [] }));
    } finally {
      setLoadingSubEventsByMainEventId((prev) => ({ ...prev, [mainEventId]: false }));
    }
  };

  const openViewEvent = async (eventId) => {
    setSelectedEventId(eventId);
    setSelectedEventDetail(null);
    setSubEvents([]);
    setSubEventsMinimized(false);
    setViewEventModalOpen(true);
    try {
      setLoadingEventDetail(true);
      const res = await getEventById(eventId);
      // getEventById already unwraps {success,data} to the data object
      setSelectedEventDetail(res);

      // If this is a MAIN event (parentEventId === null), load sub-events for it
      if (res?.parentEventId === null || res?.parentEventId === undefined) {
        setMainEventIdForSubEvents(eventId);
        try {
          setLoadingSubEvents(true);
          const subs = await getSubEvents(eventId);
          setSubEvents(Array.isArray(subs) ? subs : []);
        } finally {
          setLoadingSubEvents(false);
        }
      } else {
        setMainEventIdForSubEvents(null);
      }
    } catch (error) {
      message.error(error.message || "Failed to load event detail");
    } finally {
      setLoadingEventDetail(false);
    }
  };

  const openEditEvent = async (eventId) => {
    setSelectedEventId(eventId);
    setSelectedEventDetail(null);
    setSubEvents([]);
    setEditBannerFileList([]);
    setEditEventModalOpen(true);
    try {
      setLoadingEventDetail(true);
      const res = await getEventById(eventId);
      setSelectedEventDetail(res);

      editForm.setFieldsValue({
        eventName: res.eventName,
        description: res.description || "",
        dateRange: [dayjs(res.startTime), dayjs(res.endTime)],
        expectedAttendees: res.expectedAttendees ?? null,
        estimatedCost: res.estimatedCost ?? null,
        locationId: res.locationId ?? 0,
        externalLocationId: res.externalLocationId ?? 0,
        templateId: res.templateId ?? 0,
        categoryId: res.categoryId ?? 0,
        typeId: res.typeId ?? 0,
      });
    } catch (error) {
      message.error(error.message || "Failed to load event detail");
    } finally {
      setLoadingEventDetail(false);
    }
  };

  const handleUpdateEvent = async () => {
    try {
      const values = await editForm.validateFields();
      const [startTime, endTime] = values.dateRange || [];

      const bannerFile = editBannerFileList?.[0]?.originFileObj || null;

      setUpdatingEvent(true);
      
      // Check if this is a sub-event (has parentEventId)
      const isSubEvent = selectedEventDetail?.parentEventId !== null && selectedEventDetail?.parentEventId !== undefined;
      
      const updateData = {
        eventName: values.eventName,
        description: values.description || null,
        bannerFile,
        startTime: startTime?.toDate ? startTime.toDate() : startTime,
        endTime: endTime?.toDate ? endTime.toDate() : endTime,
        expectedAttendees: values.expectedAttendees,
        estimatedCost: values.estimatedCost,
        locationId: values.locationId,
        externalLocationId: values.externalLocationId,
        categoryId: values.categoryId,
        typeId: values.typeId,
      };
      
      // Don't include templateId for sub-events
      if (!isSubEvent) {
        updateData.templateId = values.templateId;
      }
      
      if (isSubEvent) {
        await updateSubEvent(selectedEventId, updateData);
      } else {
        await updateEvent(selectedEventId, updateData);
      }
      
      message.success("Event updated successfully");
      setEditEventModalOpen(false);
      
      // Reload sub-events if we're viewing a main event's sub-events
      if (mainEventIdForSubEvents && viewEventModalOpen) {
        try {
          setLoadingSubEvents(true);
          const subs = await getSubEvents(mainEventIdForSubEvents);
          setSubEvents(Array.isArray(subs) ? subs : []);
        } catch (error) {
          console.error("Error reloading sub-events:", error);
        } finally {
          setLoadingSubEvents(false);
        }
      }
      
      setSelectedEventId(null);
      setSelectedEventDetail(null);
      await fetchPendingApproval();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Failed to update event");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleViewSubEvent = async (subEventId) => {
    await openViewEvent(subEventId);
  };

  const handleEditSubEvent = async (subEventId) => {
    await openEditEvent(subEventId);
  };

  const handleDeleteSubEvent = async (subEventId, mainEventId) => {
    try {
      await deleteEvent(subEventId);
      message.success("Sub-event deleted successfully");
      // Reload sub-events for the main event
      if (mainEventId) {
        try {
          setLoadingSubEvents(true);
          const subs = await getSubEvents(mainEventId);
          setSubEvents(Array.isArray(subs) ? subs : []);
          // also update inline cache if expanded
          setSubEventsByMainEventId((prev) => ({ ...prev, [mainEventId]: Array.isArray(subs) ? subs : [] }));
        } catch (error) {
          console.error("Error reloading sub-events:", error);
        } finally {
          setLoadingSubEvents(false);
        }
      }
      // Also refresh pending approval list
      await fetchPendingApproval();
    } catch (error) {
      message.error(error.message || "Failed to delete sub-event");
    }
  };

  const subEventColumns = [
    {
      title: "NAME",
      dataIndex: "eventName",
      key: "eventName",
      render: (v) => <span className="font-medium text-gray-900">{v}</span>,
    },
    {
      title: "TIME",
      key: "time",
      width: 220,
      render: (_, record) => (
        <div className="text-[12px] text-gray-700">
          <div>{dayjs(record.startTime).format("MMM DD, YYYY HH:mm")}</div>
          <div className="text-gray-500">→ {dayjs(record.endTime).format("MMM DD, YYYY HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "LOCATION",
      key: "location",
      width: 220,
      render: (_, record) => record.location?.name || record.externalLocation?.name || record.locationName || record.externalLocationName || "N/A",
    },
    {
      title: "STATUS",
      key: "status",
      width: 120,
      render: (_, record) => <Tag color="blue">{record.status?.statusName || record.statusName || "N/A"}</Tag>,
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewSubEvent(record.eventId)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSubEvent(record.eventId)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this sub-event?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteSubEvent(record.eventId, mainEventIdForSubEvents || selectedEventId)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      message.success("Event deleted");
      await fetchPendingApproval();
    } catch (error) {
      message.error(error.message || "Failed to delete event");
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

  const pendingColumns = [
    {
      title: "EVENT",
      dataIndex: "eventName",
      key: "eventName",
      render: (text) => <span className="font-semibold text-gray-900">{text}</span>,
    },
    {
      title: "DATE",
      key: "date",
      render: (_, record) => (
        <div className="text-[12px] text-gray-700">
          <div>{dayjs(record.startTime).format("MMM DD, YYYY HH:mm")}</div>
          <div className="text-gray-500">→ {dayjs(record.endTime).format("MMM DD, YYYY HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "SUB-EVENTS",
      dataIndex: "subEventsCount",
      key: "subEventsCount",
      width: 110,
      render: (count, record) => (
        <Space size={6}>
          <Tag
            color="blue"
            style={{ cursor: count > 0 ? "pointer" : "default" }}
            onClick={() => {
              if (count > 0) {
                // Toggle inline expand (preferred UX for quick view)
                const isExpanded = expandedPendingRowKeys.includes(record.eventId);
                const nextKeys = isExpanded
                  ? expandedPendingRowKeys.filter((k) => k !== record.eventId)
                  : [...expandedPendingRowKeys, record.eventId];
                setExpandedPendingRowKeys(nextKeys);
                if (!isExpanded) loadSubEventsInline(record.eventId);
              }
            }}
          >
            {count ?? 0}
          </Tag>
          <Button
            size="small"
            type="link"
            onClick={() => openViewEvent(record.eventId)}
            style={{ padding: 0, height: "auto" }}
          >
            View
          </Button>
        </Space>
      ),
    },
    {
      title: "ATTENDEES",
      dataIndex: "expectedAttendees",
      key: "expectedAttendees",
      width: 120,
      render: (v) => (v ?? 0).toLocaleString(),
    },
    {
      title: "SUBMITTED",
      dataIndex: "submittedDate",
      key: "submittedDate",
      width: 150,
      render: (v) => (v ? dayjs(v).format("MMM DD, YYYY HH:mm") : "N/A"),
    },
    {
      title: "CREATED BY",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 160,
      render: (v) => v || "N/A",
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openViewEvent(record.eventId)}>
            View
          </Button>
          <Button size="small" onClick={() => openEditEvent(record.eventId)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this event?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteEvent(record.eventId)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Load event info for tasks
  const [eventMap, setEventMap] = useState({});
  
  useEffect(() => {
    const loadEventInfo = async () => {
      if (tasks.length === 0) return;
      
      const eventIds = [...new Set(tasks.map(t => t.eventId).filter(Boolean))];
      const map = {};
      
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
      
      setEventMap(map);
    };
    
    if (tasks.length > 0) {
      loadEventInfo();
    }
  }, [tasks]);

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
      width: 250,
      render: (_, record) => {
        const event = eventMap[record.eventId] || record.event;
        const isSubEvent = event && (event.parentEventId !== null && event.parentEventId !== undefined);
        
        return (
          <div>
            <div className="font-medium text-[14px] text-gray-900 mb-1">
              {event?.eventName || "N/A"}
            </div>
            {event?.startTime && (
              <div className="text-[12px] text-gray-500 mb-1">
                {dayjs(event.startTime).format("MMM DD, YYYY")}
              </div>
            )}
            <div className="flex items-center gap-2">
              {isSubEvent ? (
                <Tag color="blue" style={{ fontSize: "11px", margin: 0 }}>Sub-Event</Tag>
              ) : (
                <Tag color="orange" style={{ fontSize: "11px", margin: 0 }}>Main Event</Tag>
              )}
              {event && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto", fontSize: "11px" }}
                  onClick={() => {
                    navigate(`/event-manager/${record.eventId}/view`);
                  }}
                >
                  View
                </Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "ASSIGNED TO",
      key: "assignedTo",
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-[14px] text-gray-900">
            {record.assignedToName || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "DEADLINE",
      key: "dueDate",
      width: 150,
      render: (_, record) => {
        if (!record.dueDate) return <span className="text-gray-500">N/A</span>;
        const dueDate = dayjs(record.dueDate);
        const isOverdue = dueDate.isBefore(dayjs()) && record.status !== "Completed";
        return (
          <div>
            <div className={`text-[14px] ${isOverdue ? "text-red-600 font-semibold" : "text-gray-900"}`}>
              {dueDate.format("MMM DD, YYYY")}
            </div>
            <div className={`text-[12px] ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
              {dueDate.format("hh:mm A")}
            </div>
            {isOverdue && (
              <Tag color="red" size="small" style={{ marginTop: "4px" }}>
                Overdue
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusConfig = {
          "Todo": { color: "default", text: "To Do" },
          "To Do": { color: "default", text: "To Do" },
          "In Progress": { color: "processing", text: "In Progress" },
          "Completed": { color: "success", text: "Completed" },
        };
        const config = statusConfig[status] || { color: "default", text: status || "N/A" };
        return <Tag color={config.color}>{config.text}</Tag>;
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
          onClick={() => {
            const eventIdForView = record.eventId || record.event?.eventId;
            if (eventIdForView) {
              navigate(`/event-manager/${eventIdForView}/view`);
            } else {
              message.warning("No event information for this task");
            }
          }}
          size="small"
        >
          View Event
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {displayName} 👋
              </h1>
              <p className="text-gray-600">
                Event Manager Dashboard • View assigned tasks and manage sub-events
              </p>
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
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => navigate("/manager/events/create")}
                style={{ background: "#F2721E", borderColor: "#F2721E" }}
              >
                Create Event
              </Button>
            </Space>
          </div>
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
                prefix={<CalendarOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#8c8c8c" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Tasks List */}
        <Card className="shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F2721E] mb-0">Assigned Tasks</h2>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => navigate("/event-manager/tasks/kanban")}
              style={{ background: "#F2721E", borderColor: "#F2721E" }}
            >
              View all my tasks
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Spin size="large" />
            </div>
          ) : tasks.length === 0 ? (
            <Empty
              description="No tasks assigned by you yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="taskId"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} tasks`,
              }}
              scroll={{ x: 1000 }}
            />
          )}
        </Card>

        {/* Pending Approval Events */}
        <Card className="shadow-sm mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#F2721E] mb-0">Pending Approve</h2>
            <Button icon={<ReloadOutlined />} onClick={fetchPendingApproval} loading={loadingPending}>
              Refresh
            </Button>
          </div>

          {loadingPending ? (
            <div className="text-center py-8">
              <Spin size="large" />
            </div>
          ) : pendingEvents.length === 0 ? (
            <Empty description="No events pending approval" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              columns={pendingColumns}
              dataSource={pendingEvents}
              rowKey="eventId"
              pagination={{ pageSize: 8, showSizeChanger: true }}
              scroll={{ x: 1100 }}
              expandable={{
                expandedRowKeys: expandedPendingRowKeys,
                onExpand: async (expanded, record) => {
                  const id = record.eventId;
                  const nextKeys = expanded
                    ? [...expandedPendingRowKeys, id]
                    : expandedPendingRowKeys.filter((k) => k !== id);
                  setExpandedPendingRowKeys(nextKeys);
                  if (expanded) {
                    await loadSubEventsInline(id);
                  }
                },
                rowExpandable: (record) => (record.subEventsCount ?? 0) > 0,
                expandedRowRender: (record) => {
                  const mainEventId = record.eventId;
                  const isLoading = !!loadingSubEventsByMainEventId[mainEventId];
                  const subs = subEventsByMainEventId[mainEventId] || [];

                  return (
                    <div style={{ background: "#fafafa", padding: 12, borderRadius: 8 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">
                          Sub-Events of: {record.eventName}
                        </div>
                        <Space>
                          <Tag color="blue">{subs.length}</Tag>
                          <Button
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={async () => {
                              // force reload cache for this main event
                              setSubEventsByMainEventId((prev) => {
                                const next = { ...prev };
                                delete next[mainEventId];
                                return next;
                              });
                              await loadSubEventsInline(mainEventId);
                            }}
                          >
                            Refresh
                          </Button>
                        </Space>
                      </div>

                      {isLoading ? (
                        <div className="text-center py-4">
                          <Spin />
                        </div>
                      ) : subs.length === 0 ? (
                        <Empty description="No sub-events" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <Table
                          columns={[
                            ...subEventColumns.filter((c) => c.key !== "actions"),
                            {
                              title: "ACTIONS",
                              key: "actions",
                              width: 200,
                              render: (_, sub) => (
                                <Space>
                                  <Button
                                    size="small"
                                    icon={<EyeOutlined />}
                                    onClick={() => openViewEvent(sub.eventId)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => openEditEvent(sub.eventId)}
                                  >
                                    Edit
                                  </Button>
                                  <Popconfirm
                                    title="Delete this sub-event?"
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => handleDeleteSubEvent(sub.eventId, mainEventId)}
                                  >
                                    <Button size="small" danger icon={<DeleteOutlined />}>
                                      Delete
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              ),
                            },
                          ]}
                          dataSource={subs}
                          rowKey="eventId"
                          size="small"
                          pagination={{ pageSize: 5 }}
                          scroll={{ x: 1100 }}
                        />
                      )}
                    </div>
                  );
                },
              }}
            />
          )}
        </Card>

        {/* Events List Section */}
        <Card className="shadow-sm mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#F2721E] mb-4">Events List</h2>
          </div>

          {loadingEvents ? (
            <div className="text-center py-8">
              <Spin size="large" />
            </div>
          ) : events.length === 0 ? (
            <Empty description="No events found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              columns={[
                {
                  title: "EVENT NAME",
                  dataIndex: "eventName",
                  key: "eventName",
                  width: 300,
                  render: (text, record) => (
                    <div className="flex items-center gap-3">
                      <Avatar
                        size={40}
                        style={{
                          backgroundColor: "#1890ff",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {text
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </Avatar>
                      <div>
                        <div className="font-semibold text-[14px] text-gray-900">{text}</div>
                        <div className="text-[12px] text-gray-500">
                          {record.type} • {record.location}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "DATE & TIME",
                  dataIndex: "date",
                  key: "date",
                  width: 200,
                  render: (date, record) => {
                    if (!date) return <span className="text-gray-500">TBD</span>;
                    const startTime = dayjs(date);
                    const endTime = dayjs(record.endTime);
                    return (
                      <div>
                        <div className="text-[14px] text-gray-900">
                          {startTime.format("MMM DD, YYYY")}
                        </div>
                        <div className="text-[12px] text-gray-500">
                          {startTime.format("hh:mm A")} - {endTime.format("hh:mm A")}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: "STATUS",
                  dataIndex: "status",
                  key: "status",
                  width: 120,
                  render: (status) => {
                    // Map status based on statusId (according to database status table)
                    const statusConfig = {
                      "Draft": { color: "default", bg: "#fafafa", border: "#d9d9d9" },
                      "Pending Approval": { color: "orange", bg: "#fff7e6", border: "#ffd591" },
                      "Approved": { color: "green", bg: "#f6ffed", border: "#b7eb8f" },
                      "In Progress": { color: "blue", bg: "#e6f7ff", border: "#91d5ff" },
                      "Completed": { color: "cyan", bg: "#e6fffb", border: "#87e8de" },
                      "Cancelled": { color: "red", bg: "#fff1f0", border: "#ffa39e" },
                      "Rejected": { color: "red", bg: "#fff1f0", border: "#ffa39e" },
                    };
                    const config = statusConfig[status] || statusConfig["Draft"];
                    return (
                      <Tag
                        color={config.color}
                        style={{
                          borderRadius: "12px",
                          padding: "2px 12px",
                          fontSize: "12px",
                          border: `1px solid ${config.border}`,
                          backgroundColor: config.bg,
                        }}
                      >
                        {status}
                      </Tag>
                    );
                  },
                },
                {
                  title: "ATTENDEES",
                  dataIndex: "attendees",
                  key: "attendees",
                  width: 150,
                  render: (attendees) => {
                    if (!attendees || attendees.max === 0) {
                      return <span className="text-[12px] text-gray-500">Not opened yet</span>;
                    }
                    const percent = (attendees.current / attendees.max) * 100;
                    return (
                      <div className="w-full">
                        <Progress
                          percent={percent}
                          showInfo={false}
                          strokeColor="#1890ff"
                          size="small"
                          style={{ marginBottom: "4px" }}
                        />
                        <div className="text-[12px] text-gray-700">
                          {attendees.current.toLocaleString()}/{attendees.max.toLocaleString()}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: "CREATOR",
                  key: "creator",
                  width: 150,
                  render: (_, record) => (
                    <div className="text-[12px]">
                      <div className="text-gray-900">{record.creator?.fullName || "N/A"}</div>
                      <div className="text-gray-500">{record.creator?.roleName || ""}</div>
                    </div>
                  ),
                },
                {
                  title: "ACTIONS",
                  key: "actions",
                  width: 120,
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => {
                        navigate(`/event-manager/${record.eventId || record.id}/view`);
                      }}
                      className="p-0 text-[14px]"
                    >
                      View
                    </Button>
                  ),
                },
              ]}
              dataSource={events}
              loading={loadingEvents}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `Showing ${range[0]} to ${range[1]} of ${total} results`,
                style: { fontSize: "14px" },
              }}
              rowKey="key"
              scroll={{ x: 1200 }}
            />
          )}
        </Card>

        {/* View Event Modal */}
        <Modal
          title="Event Detail"
          open={viewEventModalOpen}
          onCancel={() => {
            setViewEventModalOpen(false);
            setSelectedEventId(null);
            setSelectedEventDetail(null);
            setSubEvents([]);
            setSubEventsMinimized(false);
            setMainEventIdForSubEvents(null);
          }}
          footer={null}
          width={800}
        >
          {loadingEventDetail ? (
            <div className="text-center py-8">
              <Spin size="large" />
            </div>
          ) : selectedEventDetail ? (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Event ID">{selectedEventDetail.eventId}</Descriptions.Item>
                <Descriptions.Item label="Type">
                  {selectedEventDetail.parentEventId === null || selectedEventDetail.parentEventId === undefined ? (
                    <Tag color="gold">MAIN EVENT</Tag>
                  ) : (
                    <Tag color="geekblue">SUB-EVENT</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="orange">{selectedEventDetail.status?.statusName || selectedEventDetail.statusName || "Pending"}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Parent Event ID">
                  {selectedEventDetail.parentEventId ?? "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Event Name" span={2}>
                  {selectedEventDetail.eventName}
                </Descriptions.Item>
                <Descriptions.Item label="Start Time">
                  {dayjs(selectedEventDetail.startTime).format("YYYY-MM-DD HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="End Time">
                  {dayjs(selectedEventDetail.endTime).format("YYYY-MM-DD HH:mm")}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Attendees">
                  {selectedEventDetail.expectedAttendees ?? "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Estimated Cost">
                  {selectedEventDetail.estimatedCost ?? "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Location" span={2}>
                  {selectedEventDetail.location?.name || selectedEventDetail.externalLocation?.name || "N/A"}
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedEventDetail.description || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              {(selectedEventDetail.parentEventId === null || selectedEventDetail.parentEventId === undefined) && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">Sub-Events</div>
                    <Space>
                      <Tag color="blue">{subEvents.length}</Tag>
                      <Button
                        type="text"
                        size="small"
                        icon={subEventsMinimized ? <DownOutlined /> : <UpOutlined />}
                        onClick={() => setSubEventsMinimized(!subEventsMinimized)}
                      >
                        {subEventsMinimized ? "Expand" : "Minimize"}
                      </Button>
                    </Space>
                  </div>
                  {!subEventsMinimized && (
                    <>
                      {loadingSubEvents ? (
                        <div className="text-center py-6">
                          <Spin />
                        </div>
                      ) : subEvents.length === 0 ? (
                        <Empty description="No sub-events" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <Table
                          columns={subEventColumns}
                          dataSource={subEvents}
                          rowKey="eventId"
                          size="small"
                          pagination={{ pageSize: 5 }}
                          scroll={{ x: 1100 }}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Empty description="No data" />
          )}
        </Modal>

        {/* Edit Event Modal */}
        <Modal
          title="Edit Event"
          open={editEventModalOpen}
          onCancel={() => {
            setEditEventModalOpen(false);
            setSelectedEventId(null);
            setSelectedEventDetail(null);
            editForm.resetFields();
            setEditBannerFileList([]);
          }}
          onOk={handleUpdateEvent}
          confirmLoading={updatingEvent}
          okText="Save"
          width={900}
        >
          <Form form={editForm} layout="vertical">
            <Form.Item
              name="eventName"
              label="Event Name *"
              rules={[{ required: true, message: "Please enter event name" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item label="BannerUrl (file)">
              <Upload
                listType="picture"
                fileList={editBannerFileList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setEditBannerFileList(fileList.slice(-1))}
                maxCount={1}
              >
                <Button>Choose File</Button>
              </Upload>
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="StartTime - EndTime *"
              rules={[{ required: true, message: "Please select start and end time" }]}
            >
              <RangePicker showTime style={{ width: "100%" }} />
            </Form.Item>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="expectedAttendees" label="ExpectedAttendees">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="estimatedCost" label="EstimatedCost">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item name="locationId" label="LocationId">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="externalLocationId" label="ExternalLocationId">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="templateId" label="TemplateId">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="categoryId" label="CategoryId">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="typeId" label="TypeId">
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default EventManagerDashboard;
