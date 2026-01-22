import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SearchOutlined, 
  FilterOutlined, 
  CalendarOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Input, Select, Table, Avatar, Tag, Progress, Button, Card, Statistic, Row, Col, message, Modal, Space } from "antd";
import { CheckCircleOutlined as ApproveIcon, SwapOutlined, FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getEvents, getEventById, updateEvent, changeEventStatus } from "../../services/events.api";
import authService from "../../services/authService";

const { Option } = Select;

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // Store all events for stats
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loadingStatusChange, setLoadingStatusChange] = useState(false);

  const displayName = user?.fullName || "Director";
  const roleName = user?.roleName || "Director";

  // Load events from API
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
        // Response structure: {data: [...], totalRecords, page, pageSize, ...}
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

        // Filter: STRICTLY only get events with parentEventId === null (main events, not sub-events)
        let mainEvents = events.filter((ev) => {
          const parentId = ev.parentEventId;
          const isMainEvent = parentId === null || parentId === undefined;
          
          if (!isMainEvent) {
            console.log(`⚠️ Filtered out sub-event: "${ev.eventName}" (eventId: ${ev.eventId}, parentEventId: ${JSON.stringify(parentId)})`);
          }
          return isMainEvent;
        });

        console.log("✅ Filtered main events (parentEventId === null):", mainEvents.length);

        // Store all main events for statistics
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
        setEvents([]);
        setAllEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Calculate overview stats from allEvents (not filtered)
  const stats = useMemo(() => {
    const totalEvents = allEvents.length;
    const now = dayjs();
    
    // Calculate events by status
    let pendingCount = 0;
    let scheduledCount = 0;
    let publishedCount = 0;
    let endedCount = 0;
    let cancelledCount = 0;

    // Calculate events by timing
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;

    allEvents.forEach((event) => {
      // Count by statusId (according to database status table)
      switch (event.statusId) {
        case 1:
          // Draft - count as pending for stats
          pendingCount++;
          break;
        case 2:
          // Pending Approval
          pendingCount++;
          break;
        case 3:
          // Approved
          scheduledCount++;
          break;
        case 4:
          // In Progress
          publishedCount++;
          break;
        case 5:
          // Completed
          endedCount++;
          break;
        case 6:
          // Cancelled
          cancelledCount++;
          break;
        case 7:
          // Rejected - count as cancelled for stats
          cancelledCount++;
          break;
      }

      // Count by timing
      if (event.startTime && event.endTime) {
        const startTime = dayjs(event.startTime);
        const endTime = dayjs(event.endTime);
        
        if (endTime.isBefore(now)) {
          completedCount++;
        } else if (startTime.isBefore(now) && endTime.isAfter(now)) {
          ongoingCount++;
        } else {
          upcomingCount++;
        }
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

    // Status filter - map UI status names to statusId (according to database status table)
    if (statusFilter !== "all") {
      const statusIdMap = {
        "Draft": 1,
        "Pending Approval": 2,
        "Approved": 3,
        "In Progress": 4,
        "Completed": 5,
        "Cancelled": 6,
        "Rejected": 7,
        // Legacy mappings for backward compatibility
        "Published": 4, // In Progress
        "Pending": 2, // Pending Approval
        "Scheduled": 3, // Approved
        "Ended": 5, // Completed
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

  const handleChangeEventStatus = async (record) => {
    const isApproved = record.statusId === 3 || record.status === "Approved";
    const isInProgress = record.statusId === 4 || record.status === "In Progress";
    
    let newStatusId;
    let newStatusName;
    let confirmTitle;
    let confirmContent;
    
    if (isApproved) {
      // From Approved (3) -> In Progress (4)
      newStatusId = 4;
      newStatusName = "In Progress";
      confirmTitle = "Start Event";
      confirmContent = "Are you sure you want to start this event? This will change the status to 'In Progress'.";
    } else if (isInProgress) {
      // From In Progress (4) -> Completed (5)
      newStatusId = 5;
      newStatusName = "Completed";
      confirmTitle = "Complete Event";
      confirmContent = "Are you sure you want to complete this event? This will change the status to 'Completed'.";
    } else {
      return;
    }
    
    Modal.confirm({
      title: confirmTitle,
      content: confirmContent,
      okText: "Confirm",
      cancelText: "Cancel",
      okButtonProps: { type: "primary" },
      onOk: async () => {
        try {
          setLoadingStatusChange(true);
          
          // Call new change-status API
          await changeEventStatus(record.eventId, newStatusId);
          
          message.success(`Event status changed to ${newStatusName} successfully.`);
          
          // Reload events list
          const params = {
            page: 1,
            pageSize: 100,
            includeDeleted: false,
            sortBy: "CreatedAt",
            sortDescending: true,
          };
          
          const response = await getEvents(params);
          let eventsList = [];
          if (response && response.data && Array.isArray(response.data)) {
            eventsList = response.data;
          } else if (Array.isArray(response)) {
            eventsList = response;
          }
          
          const mainEvents = eventsList.filter((ev) => {
            const parentId = ev.parentEventId;
            return parentId === null || parentId === undefined;
          });
          
          const transformedEvents = mainEvents.map((event) => {
            let locationName = "Location TBD";
            if (event.location) {
              locationName = event.location.name || 
                            event.location.roomNumber || 
                            locationName;
            } else if (event.externalLocation) {
              locationName = event.externalLocation.name || locationName;
            }
            
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
          
          setAllEvents(mainEvents);
          setEvents(transformedEvents);
        } catch (error) {
          console.error("Error changing event status:", error);
          message.error(error.message || "Failed to change event status");
        } finally {
          setLoadingStatusChange(false);
        }
      },
    });
  };

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
      render: (status, record) => {
        // Map status based on statusId (according to database status table)
        const statusConfig = {
          "Draft": { color: "default", bg: "#fafafa", border: "#d9d9d9" },
          "Pending Approval": { color: "orange", bg: "#fff7e6", border: "#ffd591" },
          "Approved": { color: "green", bg: "#f6ffed", border: "#b7eb8f" },
          "In Progress": { color: "blue", bg: "#e6f7ff", border: "#91d5ff" },
          "Completed": { color: "cyan", bg: "#e6fffb", border: "#87e8de" },
          "Cancelled": { color: "red", bg: "#fff1f0", border: "#ffa39e" },
          "Rejected": { color: "red", bg: "#fff1f0", border: "#ffa39e" },
          // Legacy mappings for backward compatibility
          "Published": { color: "green", bg: "#f6ffed", border: "#b7eb8f" },
          "Pending": { color: "orange", bg: "#fff7e6", border: "#ffd591" },
          "Scheduled": { color: "blue", bg: "#e6f7ff", border: "#91d5ff" },
          "Ended": { color: "default", bg: "#fafafa", border: "#d9d9d9" },
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
      width: 250,
      render: (_, record) => {
        // Only events with statusId = 2 (Pending Approval) can be approved
        const canApprove = record.statusId === 2;
        // Events with status Approved (3) or In Progress (4) can change status
        const isApproved = record.statusId === 3 || record.status === "Approved";
        const isInProgress = record.statusId === 4 || record.status === "In Progress";
        const canChangeStatus = isApproved || isInProgress;
        // Events with status Completed (5) can view report
        const isCompleted = record.statusId === 5 || record.status === "Completed";
        
        return (
          <Space>
            <Button
              type="link"
              onClick={() => {
                navigate(`/director/events/${record.eventId || record.id}/view`);
              }}
              className="p-0 text-[14px]"
            >
              View
            </Button>
            {canApprove && (
              <Button
                type="primary"
                size="small"
                icon={<ApproveIcon />}
                onClick={() => {
                  navigate(`/director/events/${record.eventId || record.id}/view`);
                }}
                style={{ fontSize: "12px" }}
              >
                Approve
              </Button>
            )}
            {canChangeStatus && (
              <Button
                type="primary"
                size="small"
                icon={<SwapOutlined />}
                onClick={() => handleChangeEventStatus(record)}
                loading={loadingStatusChange}
                style={{ 
                  background: isApproved ? "#52c41a" : "#1890ff",
                  borderColor: isApproved ? "#52c41a" : "#1890ff",
                  fontSize: "12px"
                }}
              >
                {isApproved ? "Start Event" : "Complete Event"}
              </Button>
            )}
            {isCompleted && (
              <Button
                type="primary"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => {
                  navigate(`/event/${record.eventId || record.id}/report`);
                }}
                style={{ 
                  background: "#722ed1",
                  borderColor: "#722ed1",
                  fontSize: "12px"
                }}
              >
                View Report
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-gray-600">
            Director Dashboard • Manage and approve events
          </p>
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
                Main events only
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

        {/* Additional Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Pending Approval"
                value={stats.pendingCount}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Scheduled"
                value={stats.scheduledCount}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Published"
                value={stats.publishedCount}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Expected Attendees"
                value={stats.totalAttendees}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Events List Section */}
        <Card className="shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#F2721E] mb-4">Events List</h2>
            
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
                style={{ width: 180, fontSize: "14px" }}
              >
                <Option value="all">Status: All</Option>
                <Option value="Draft">Draft</Option>
                <Option value="Pending Approval">Pending Approval</Option>
                <Option value="Approved">Approved</Option>
                <Option value="In Progress">In Progress</Option>
                <Option value="Completed">Completed</Option>
                <Option value="Cancelled">Cancelled</Option>
                <Option value="Rejected">Rejected</Option>
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
          />
        </Card>
      </div>
    </div>
  );
};

export default DirectorDashboard;
