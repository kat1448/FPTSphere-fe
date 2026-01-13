import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SearchOutlined, 
  FilterOutlined, 
  CalendarOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Input, Select, Table, Avatar, Tag, Progress, Button, Card, Statistic, Row, Col, message } from "antd";
import dayjs from "dayjs";
import { getEvents } from "../../services/events.api";
import authService from "../../services/authService";

const { Option } = Select;

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for stats
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const displayName = user?.fullName || "Event Manager";
  const roleName = user?.roleName || "Event Manager";
  const userId = user?.userId ? Number(user.userId) : null;

  // Load events from API - only events created by this Event Manager
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        const params = {
          page: 1,
          pageSize: 100, // Get more events for statistics
          includeDeleted: false,
          sortBy: "CreatedAt",
          sortDescending: true,
        };

        // Fetch events from API
        const response = await getEvents(params);
        
        console.log("📦 Full API response from getEvents:", response);

        // Extract events array from response
        let events = [];
        if (response && response.data && Array.isArray(response.data)) {
          events = response.data;
        } else if (Array.isArray(response)) {
          events = response;
        } else {
          console.error("❌ Unexpected response structure:", response);
          setEvents([]);
          setAllEvents([]);
          setLoading(false);
          return;
        }

        console.log("📋 Total events from API:", events.length);
        console.log("👤 Current user ID:", userId);

        // Filter: Only main events (parentEventId === null)
        let mainEvents = events.filter((ev) => {
          const parentId = ev.parentEventId;
          return parentId === null || parentId === undefined;
        });

        console.log("✅ Filtered main events:", mainEvents.length);

        // Filter: Only events created by this Event Manager (createdBy === userId)
        if (userId) {
          mainEvents = mainEvents.filter((ev) => {
            const createdBy = ev.createdBy ? Number(ev.createdBy) : null;
            const isMyEvent = createdBy === userId;
            
            if (!isMyEvent) {
              console.log(`⚠️ Filtered out event not created by me: "${ev.eventName}" (eventId: ${ev.eventId}, createdBy: ${createdBy}, my userId: ${userId})`);
            }
            return isMyEvent;
          });
        } else {
          console.warn("⚠️ No userId found, cannot filter events by creator");
          mainEvents = [];
        }

        console.log("✅ Filtered events created by me:", mainEvents.length);

        // Store all events for statistics
        setAllEvents(mainEvents);

        // Transform API events to match table format
        const transformedEvents = mainEvents.map((event) => {
          // Get location name from location or externalLocation
          let locationName = "Location TBD";
          if (event.location) {
            locationName = event.location.name || 
                          event.location.roomNumber || 
                          locationName;
          } else if (event.externalLocation) {
            locationName = event.externalLocation.name || locationName;
          }
          
          // Map statusId to status name
          const statusMap = {
            1: "Pending",
            2: "Pending Approval",
            3: "Scheduled",
            4: "Published",
            5: "Ended",
            6: "Cancelled"
          };
          const status = statusMap[event.statusId] || event.status?.statusName || "Pending";
          
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
          };
        });

        setEvents(transformedEvents);
      } catch (error) {
        console.error("❌ Error loading events:", error);
        message.error("Failed to load events");
        setEvents([]);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEvents();
    } else {
      console.warn("⚠️ No userId found, skipping event fetch");
      setLoading(false);
    }
  }, [userId]);

  // Calculate overview stats
  const stats = useMemo(() => {
    const totalEvents = allEvents.length;
    const now = dayjs();

    // Calculate status counts
    let pendingCount = 0;
    let scheduledCount = 0;
    let publishedCount = 0;
    let endedCount = 0;
    let cancelledCount = 0;
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;

    allEvents.forEach((event) => {
      // Count by statusId
      if (event.statusId === 1 || event.statusId === 2) pendingCount++;
      if (event.statusId === 3) scheduledCount++;
      if (event.statusId === 4) publishedCount++;
      if (event.statusId === 5) endedCount++;
      if (event.statusId === 6) cancelledCount++;

      // Count by time
      if (!event.startTime || !event.endTime) return;
      const startTime = dayjs(event.startTime);
      const endTime = dayjs(event.endTime);

      if (startTime.isAfter(now)) {
        upcomingCount++;
      } else if (startTime.isBefore(now) && endTime.isAfter(now)) {
        ongoingCount++;
      } else if (endTime.isBefore(now)) {
        completedCount++;
      }
    });

    // Calculate total expected attendees
    const totalAttendees = allEvents.reduce((sum, ev) => {
      return sum + (ev.expectedAttendees || 0);
    }, 0);

    return {
      totalEvents,
      pendingCount,
      scheduledCount,
      publishedCount,
      endedCount,
      cancelledCount,
      upcomingCount,
      ongoingCount,
      completedCount,
      totalAttendees,
    };
  }, [allEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Search filter
    if (searchText) {
      filtered = filtered.filter((e) =>
        e.eventName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter - map UI status names to statusId
    if (statusFilter !== "all") {
      const statusIdMap = {
        "Published": 4,
        "Pending": 1,
        "Scheduled": 3,
        "Ended": 5,
        "Cancelled": 6
      };
      const targetStatusId = statusIdMap[statusFilter];
      if (targetStatusId) {
        filtered = filtered.filter((e) => e.statusId === targetStatusId);
      } else {
        filtered = filtered.filter((e) => e.status === statusFilter);
      }
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    return filtered;
  }, [events, searchText, statusFilter, typeFilter]);

  // Table columns
  const columns = [
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
        const statusConfig = {
          Published: { color: "green", bg: "#f6ffed", border: "#b7eb8f" },
          Pending: { color: "orange", bg: "#fff7e6", border: "#ffd591" },
          "Pending Approval": { color: "orange", bg: "#fff7e6", border: "#ffd591" },
          Scheduled: { color: "blue", bg: "#e6f7ff", border: "#91d5ff" },
          Ended: { color: "default", bg: "#fafafa", border: "#d9d9d9" },
          Cancelled: { color: "red", bg: "#fff1f0", border: "#ffa39e" },
        };
        const config = statusConfig[status] || statusConfig.Pending;
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
      title: "ACTIONS",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="link"
            onClick={() => navigate(`/manager/events/${record.eventId || record.id}/sub-events`)}
            className="p-0 text-[14px]"
          >
            View
          </Button>
          <Button
            type="link"
            onClick={() => navigate(`/manager/events/${record.eventId || record.id}`)}
            className="p-0 text-[14px]"
          >
            Details
          </Button>
        </div>
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
              {roleName} Dashboard • Manage your assigned events
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            size="large"
            onClick={() => navigate("/manager/events/create")}
            className="flex items-center"
          >
            Create New Event
          </Button>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Events"
                value={stats.totalEvents}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                My events
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Upcoming"
                value={stats.upcomingCount}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                Events starting soon
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Ongoing"
                value={stats.ongoingCount}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                Currently active
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completedCount}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#8c8c8c" }}
              />
              <div className="mt-2 text-xs text-gray-500">
                Past events
              </div>
            </Card>
          </Col>
        </Row>

        {/* Events List Section */}
        <Card className="shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#F2721E] mb-4">My Events</h2>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search events..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 min-w-[200px]"
                style={{ fontSize: "14px" }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150, fontSize: "14px" }}
              >
                <Option value="all">Status: All</Option>
                <Option value="Published">Published</Option>
                <Option value="Pending">Pending</Option>
                <Option value="Scheduled">Scheduled</Option>
                <Option value="Ended">Ended</Option>
                <Option value="Cancelled">Cancelled</Option>
              </Select>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: 150, fontSize: "14px" }}
              >
                <Option value="all">Type: All</Option>
                <Option value="Conference">Conference</Option>
                <Option value="Workshop">Workshop</Option>
                <Option value="Networking">Networking</Option>
                <Option value="Webinar">Webinar</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            dataSource={filteredEvents}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `Showing ${range[0]} to ${range[1]} of ${total} results`,
              style: { fontSize: "14px" },
            }}
            rowKey="key"
            scroll={{ x: 1200 }}
            locale={{
              emptyText: userId 
                ? "No events found. Create your first event!" 
                : "Please log in to view your events"
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
