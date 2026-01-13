import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Input, Select, Button, Card, Tag, Space, Spin } from "antd";
import dayjs from "dayjs";
import CreateSubEventModal from "./CreateSubEventModal";
import { getEventById, getSubEvents } from "../../services/events.api";

const { Option } = Select;

// Map API status to kanban status
const mapStatusToKanban = (statusId, statusName, startTime, endTime) => {
    // If we have statusId or statusName, use them
    if (statusName) {
      const statusUpper = statusName.toUpperCase();
      if (statusUpper === "PENDING" || statusUpper === "DRAFT") {
        return "not-started";
      }
      if (statusUpper === "SCHEDULED" || statusUpper === "PUBLISHED") {
        // Check if event has started
        const now = dayjs();
        const start = dayjs(startTime);
        const end = dayjs(endTime);
        
        if (end.isBefore(now)) {
          return "completed";
        } else if (start.isBefore(now) && end.isAfter(now)) {
          return "in-progress";
        } else {
          return "not-started";
        }
      }
      if (statusUpper === "ENDED") {
        return "completed";
      }
      if (statusUpper === "CANCELLED") {
        return "completed"; // Or handle cancelled separately
      }
    }

    // Fallback: determine by time
    if (!startTime || !endTime) {
      return "not-started";
    }

    const now = dayjs();
    const start = dayjs(startTime);
    const end = dayjs(endTime);

    if (end.isBefore(now)) {
      return "completed";
    } else if (start.isBefore(now) && end.isAfter(now)) {
      return "in-progress";
    } else {
      return "not-started";
    }
};

const SubEventOperations = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load event and sub-events from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch main event
        const eventData = await getEventById(eventId);
        console.log("✅ Event data loaded:", eventData);
        setEvent(eventData);

        // Fetch sub-events
        const subEventsData = await getSubEvents(eventId);
        console.log("✅ Sub-events data loaded:", subEventsData);
        
        // Transform sub-events for kanban display
        const transformedSubs = subEventsData.map((sub) => {
          const locationName = sub.location?.name || 
                              sub.externalLocation?.name || 
                              sub.location?.roomNumber || 
                              "Not specified";
          
          const kanbanStatus = mapStatusToKanban(
            sub.statusId,
            sub.status?.statusName,
            sub.startTime,
            sub.endTime
          );

          return {
            id: sub.eventId,
            eventId: sub.eventId,
            name: sub.eventName || "Untitled Sub-event",
            startTime: sub.startTime,
            endTime: sub.endTime,
            location: locationName,
            locationDetails: sub.location,
            status: kanbanStatus,
            statusId: sub.statusId,
            statusName: sub.status?.statusName,
            description: sub.description,
            bannerUrl: sub.bannerUrl,
            eventTag: eventData.eventName || "Event",
          };
        });
        
        setSubEvents(transformedSubs);
      } catch (error) {
        console.error("❌ Error loading event and sub-events:", error);
        // Set empty state on error
        setEvent(null);
        setSubEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // Filter and sort sub-events
  const filteredSubEvents = React.useMemo(() => {
    let filtered = subEvents;

    // Search filter
    if (searchText) {
      filtered = filtered.filter((sub) =>
        sub.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((sub) => sub.location === locationFilter);
    }

    // Sort
    if (sortBy === "time") {
      filtered = [...filtered].sort((a, b) =>
        dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
      );
    }

    return filtered;
  }, [subEvents, searchText, sortBy, locationFilter]);

  // Group sub-events by status
  const groupedSubEvents = React.useMemo(() => {
    const groups = {
      "not-started": filteredSubEvents.filter((sub) => sub.status === "not-started"),
      "in-progress": filteredSubEvents.filter((sub) => sub.status === "in-progress"),
      completed: filteredSubEvents.filter((sub) => sub.status === "completed"),
    };
    return groups;
  }, [filteredSubEvents]);

  // Get unique locations for filter
  const uniqueLocations = React.useMemo(() => {
    return [...new Set(subEvents.map((sub) => sub.location))];
  }, [subEvents]);

  const handleStart = (subEventId) => {
    setSubEvents((prev) =>
      prev.map((sub) =>
        sub.id === subEventId ? { ...sub, status: "in-progress" } : sub
      )
    );
    // TODO: Call API to update sub-event status
  };

  const handleComplete = (subEventId) => {
    setSubEvents((prev) =>
      prev.map((sub) =>
        sub.id === subEventId ? { ...sub, status: "completed" } : sub
      )
    );
    // TODO: Call API to update sub-event status
  };

  const renderSubEventCard = (subEvent) => {
    const isCompleted = subEvent.status === "completed";
    const isInProgress = subEvent.status === "in-progress";
    const isNotStarted = subEvent.status === "not-started";

    return (
      <Card
        key={subEvent.id}
        className="mb-4"
        style={{
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}
        bodyStyle={{ padding: "16px" }}
      >
        <div className="flex items-start justify-between mb-3">
          <Tag
            color="blue"
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "4px",
            }}
          >
            {subEvent.eventTag}
          </Tag>
          {isCompleted && (
            <CheckCircleOutlined className="text-green-500 text-lg" />
          )}
        </div>

        <h3 className="text-[14px] font-semibold text-gray-900 mb-3">
          {subEvent.name}
        </h3>

        <Space direction="vertical" size={8} className="w-full">
          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <ClockCircleOutlined className="text-gray-400" />
            <span>
              {dayjs(subEvent.startTime).format("hh:mm A")} -{" "}
              {dayjs(subEvent.endTime).format("hh:mm A")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-gray-600">
            <EnvironmentOutlined className="text-gray-400" />
            <span>{subEvent.location}</span>
          </div>
        </Space>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
          <Button
            type="link"
            className="p-0 text-[12px] text-blue-600"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEvent.eventId || subEvent.id}/detail`)}
          >
            View Content
          </Button>
          {isNotStarted && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStart(subEvent.id)}
              className="ml-auto"
              style={{ fontSize: "12px" }}
            >
              Start →
            </Button>
          )}
          {isInProgress && (
            <Button
              type="default"
              size="small"
              onClick={() => handleComplete(subEvent.id)}
              className="ml-auto"
              icon={<CheckCircleOutlined />}
              style={{ fontSize: "12px", color: "#52c41a", borderColor: "#52c41a" }}
            >
              ← Complete
            </Button>
          )}
          {isCompleted && (
            <Button
              type="default"
              size="small"
              className="ml-auto"
              icon={<FileTextOutlined />}
              style={{ fontSize: "12px" }}
            >
              View Report
            </Button>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Event not found</p>
          <Button onClick={() => navigate("/admin/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/dashboard")}
            className="p-0 mb-2 text-[14px] text-gray-600 hover:text-[#F2721E]"
          >
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#F2721E]">
                Sub-event Operations
              </h1>
              <p className="text-gray-600 mt-1">{event.eventName}</p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
              style={{ fontSize: "14px", backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              New Sub-event
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search subevents..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 max-w-xs"
              style={{ fontSize: "14px" }}
            />
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600">SORT BY:</span>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 200, fontSize: "14px" }}
              >
                <Option value="time">Time (Earliest first)</Option>
                <Option value="name">Name (A-Z)</Option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600">FILTER:</span>
              <Select
                value={locationFilter}
                onChange={setLocationFilter}
                style={{ width: 180, fontSize: "14px" }}
              >
                <Option value="all">All Locations</Option>
                {uniqueLocations.map((loc) => (
                  <Option key={loc} value={loc}>
                    {loc}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-3 gap-4">
          {/* Not Started Column */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Not Started
                </h2>
                <Tag
                  color="blue"
                  style={{
                    fontSize: "11px",
                    padding: "0 8px",
                    borderRadius: "12px",
                  }}
                >
                  {groupedSubEvents["not-started"].length}
                </Tag>
              </div>
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="p-0"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {groupedSubEvents["not-started"].map((subEvent) =>
                renderSubEventCard(subEvent)
              )}
              {groupedSubEvents["not-started"].length === 0 && (
                <div className="text-center text-gray-400 text-[12px] py-8">
                  No sub-events
                </div>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h2 className="text-[14px] font-semibold text-gray-900">
                  In Progress
                </h2>
                <Tag
                  color="blue"
                  style={{
                    fontSize: "11px",
                    padding: "0 8px",
                    borderRadius: "12px",
                  }}
                >
                  {groupedSubEvents["in-progress"].length}
                </Tag>
              </div>
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="p-0"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {groupedSubEvents["in-progress"].map((subEvent) =>
                renderSubEventCard(subEvent)
              )}
              {groupedSubEvents["in-progress"].length === 0 && (
                <div className="text-center text-gray-400 text-[12px] py-8">
                  No sub-events
                </div>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Completed
                </h2>
                <Tag
                  color="green"
                  style={{
                    fontSize: "11px",
                    padding: "0 8px",
                    borderRadius: "12px",
                  }}
                >
                  {groupedSubEvents.completed.length}
                </Tag>
              </div>
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="p-0"
              />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
              {groupedSubEvents.completed.map((subEvent) =>
                renderSubEventCard(subEvent)
              )}
              {groupedSubEvents.completed.length === 0 && (
                <div className="text-center text-gray-400 text-[12px] py-8">
                  No sub-events
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Sub-event Modal */}
        <CreateSubEventModal
          open={showCreateModal}
          onCancel={() => setShowCreateModal(false)}
          event={event}
          onSuccess={async () => {
            // Reload sub-events after creation
            try {
              setLoading(true);
              const subEventsData = await getSubEvents(eventId);
              
              const transformedSubs = subEventsData.map((sub) => {
                const locationName = sub.location?.name || 
                                    sub.externalLocation?.name || 
                                    sub.location?.roomNumber || 
                                    "Not specified";
                
                const kanbanStatus = mapStatusToKanban(
                  sub.statusId,
                  sub.status?.statusName,
                  sub.startTime,
                  sub.endTime
                );

                return {
                  id: sub.eventId,
                  eventId: sub.eventId,
                  name: sub.eventName || "Untitled Sub-event",
                  startTime: sub.startTime,
                  endTime: sub.endTime,
                  location: locationName,
                  locationDetails: sub.location,
                  status: kanbanStatus,
                  statusId: sub.statusId,
                  statusName: sub.status?.statusName,
                  description: sub.description,
                  bannerUrl: sub.bannerUrl,
                  eventTag: event.eventName || "Event",
                };
              });
              
              setSubEvents(transformedSubs);
            } catch (error) {
              console.error("❌ Error reloading sub-events:", error);
            } finally {
              setLoading(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SubEventOperations;
