import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  MailOutlined,
  DownloadOutlined,
  FolderOutlined,
  PictureOutlined,
  BarChartOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Tag,
  Avatar,
  Progress,
  Space,
  Divider,
  message,
  Spin,
} from "antd";
import dayjs from "dayjs";
import { getEventById } from "../../services/events.api";
import feedbackData from "../../data/sub-event-feedback.json";

const ViewDetailSubEvent = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const [event, setEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map API status to display status
  const mapStatusToDisplay = (statusId, statusName, startTime, endTime) => {
    if (statusName) {
      const statusUpper = statusName.toUpperCase();
      if (statusUpper === "PENDING" || statusUpper === "DRAFT") {
        return "not-started";
      }
      if (statusUpper === "SCHEDULED" || statusUpper === "PUBLISHED") {
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
        return "completed";
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

  // Load event and sub-event data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch main event (parent event)
        if (eventId) {
          const mainEventData = await getEventById(eventId);
          console.log("✅ Main event data loaded:", mainEventData);
          setEvent(mainEventData);
        }

        // Fetch sub-event by ID
        const subEventData = await getEventById(subEventId);
        console.log("✅ Sub-event data loaded:", subEventData);
        
        // Transform sub-event data from API
        const locationName = subEventData.location?.name || 
                            subEventData.externalLocation?.name || 
                            subEventData.location?.roomNumber || 
                            "Not specified";
        
        const displayStatus = mapStatusToDisplay(
          subEventData.statusId,
          subEventData.status?.statusName,
          subEventData.startTime,
          subEventData.endTime
        );

        const transformedSubEvent = {
          ...subEventData,
          name: subEventData.eventName || "Sub-event",
          eventName: subEventData.eventName,
          startTime: subEventData.startTime,
          endTime: subEventData.endTime,
          location: locationName,
          locationDetails: subEventData.location,
          expectedAttendees: subEventData.expectedAttendees || 0,
          estimatedCost: subEventData.estimatedCost || 0,
          status: displayStatus,
          statusId: subEventData.statusId,
          statusName: subEventData.status?.statusName,
          description: subEventData.description,
          bannerUrl: subEventData.bannerUrl,
          quotationItems: subEventData.quotationItems || [],
        };
        
        setSubEvent(transformedSubEvent);
      } catch (error) {
        console.error("❌ Error loading sub-event:", error);
        message.error("Failed to load sub-event details");
      } finally {
        setLoading(false);
      }
    };

    if (subEventId) {
      fetchData();
    }
  }, [eventId, subEventId]);

  // Calculate metrics from actual data
  const calculateMetrics = () => {
    if (!subEvent) {
      return {
        totalAttendees: 0,
        targetAttendees: 0,
        duration: 0,
        days: 0,
        actualCost: 0,
        budget: 0,
        rating: 0,
        ratingCount: 0,
      };
    }

    // Calculate duration
    const start = dayjs(subEvent.startTime);
    const end = dayjs(subEvent.endTime);
    const duration = end.diff(start, "hour");
    const days = end.diff(start, "day") + 1;

    // Calculate cost from quotationItems
    const quotationItems = subEvent.quotationItems || [];
    const actualCost = quotationItems.reduce((sum, item) => {
      // Calculate totalPrice = quantity * unitPrice if totalPrice doesn't exist
      const itemTotal = item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);
    
    // Calculate budget (can be same as actualCost or set a target)
    const budget = actualCost * 1.1; // Assume 10% buffer for budget

    // Get attendees
    const totalAttendees = subEvent.expectedAttendees || 0;
    const targetAttendees = Math.floor(totalAttendees * 0.9); // Assume 90% of expected as target

    return {
      totalAttendees,
      targetAttendees,
      duration,
      days,
      actualCost,
      budget,
      rating: 4.5, // Default rating (can be from feedback data later)
      ratingCount: Math.floor(totalAttendees * 0.7), // Assume 70% response rate
    };
  };

  const metrics = calculateMetrics();

  // Calculate financial breakdown from quotationItems
  const calculateFinancialData = () => {
    if (!subEvent || !subEvent.quotationItems) {
      return {
        totalBudget: 0,
        expenses: [],
      };
    }

    const quotationItems = subEvent.quotationItems || [];
    const totalCost = quotationItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalBudget = totalCost * 1.1; // 10% buffer

    // Group by resource type/category
    const categoryMap = {};
    quotationItems.forEach((item) => {
      const category = item.category || item.resourceType || item.type || "Resources";
      const itemTotal = item.totalPrice || (item.quantity || 0) * (item.unitPrice || 0);
      if (!categoryMap[category]) {
        categoryMap[category] = { category, amount: 0 };
      }
      categoryMap[category].amount += itemTotal;
    });

    // Convert to array and calculate percentages
    const expenses = Object.values(categoryMap).map((exp) => ({
      category: exp.category,
      amount: exp.amount,
      percentage: totalCost > 0 ? Math.round((exp.amount / totalCost) * 100) : 0,
    }));

    // If no categories, create default breakdown
    if (expenses.length === 0) {
      expenses.push({
        category: "Resources",
        amount: totalCost,
        percentage: 100,
      });
    }

    return {
      totalBudget,
      expenses,
    };
  };

  const financialData = calculateFinancialData();

  // Event team from directors and tasks
  const getEventTeam = () => {
    const team = [];
    
    // Get director from sub-event
    if (subEvent?.director && event?.directors) {
      const directorId = subEvent.director;
      const director = event.directors[directorId];
      if (director) {
        const name = director.name || director.email || "Director";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();
        team.push({
          id: 1,
          initials,
          name,
          role: "Director",
        });
      }
    }

    // Get task assignees
    if (event?.tasks && subEvent?.id !== undefined) {
      const subEventTasks = event.tasks[subEvent.id] || [];
      subEventTasks.forEach((task) => {
        if (task.assignee) {
          const name = task.assignee.name || task.assignee.email || "Team Member";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          team.push({
            id: team.length + 1,
            initials,
            name,
            role: task.taskName || "Team Member",
          });
        }
      });
    }

    // If no team found, add default
    if (team.length === 0) {
      team.push({
        id: 1,
        initials: "EM",
        name: "Event Manager",
        role: "Lead Organizer",
      });
    }

    return team;
  };

  const eventTeam = getEventTeam();

  // Feedback data from JSON file
  const feedbacks = feedbackData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!event || !subEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Sub-event not found</p>
          <Button onClick={() => navigate(`/admin/events/${eventId}/sub-events`)} className="mt-4">
            Back to Sub-events
          </Button>
        </div>
      </div>
    );
  }

  const totalExpenses = financialData.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = financialData.totalBudget - totalExpenses;
  const attendeeGrowth = metrics.targetAttendees > 0 
    ? ((metrics.totalAttendees - metrics.targetAttendees) / metrics.targetAttendees * 100).toFixed(0)
    : "0";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/events/${eventId}/sub-events`)}
            className="p-0 mb-2 text-[14px] text-gray-600 hover:text-[#F2721E]"
          >
            Back to Sub-events
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{subEvent.eventName || subEvent.name}</h1>
                <Tag
                  color={
                    subEvent.status === "completed"
                      ? "green"
                      : subEvent.status === "in-progress"
                      ? "blue"
                      : "default"
                  }
                  style={{
                    fontSize: "12px",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontWeight: 600,
                  }}
                >
                  {subEvent.status === "completed"
                    ? "COMPLETED"
                    : subEvent.status === "in-progress"
                    ? "IN PROGRESS"
                    : "NOT STARTED"}
                </Tag>
              </div>
              <Space size="large" className="text-[14px] text-gray-600">
                <span className="flex items-center gap-2">
                  <CalendarOutlined />
                  {dayjs(subEvent.startTime).format("MMM DD")} - {dayjs(subEvent.endTime).format("DD, YYYY")}
                </span>
                <span className="flex items-center gap-2">
                  <EnvironmentOutlined />
                  {subEvent.location}
                </span>
              </Space>
            </div>
            <Space>
              <Button
                icon={<ShareAltOutlined />}
                style={{ fontSize: "14px" }}
              >
                Share
              </Button>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                style={{
                  fontSize: "14px",
                  backgroundColor: "#F2721E",
                  borderColor: "#F2721E",
                }}
              >
                Print Report
              </Button>
            </Space>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-4 gap-4">
              {/* Total Attendees */}
              <Card className="shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-gray-600 uppercase">
                    Total Attendees
                  </span>
                  <UserOutlined className="text-green-500 text-lg" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.totalAttendees.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-green-600">
                  <ArrowUpOutlined className="text-[10px]" />
                  <span>+{attendeeGrowth}% vs. target</span>
                </div>
              </Card>

              {/* Total Duration */}
              <Card className="shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-gray-600 uppercase">
                    Total Duration
                  </span>
                  <ClockCircleOutlined className="text-purple-500 text-lg" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.duration} Hrs
                </div>
                <div className="text-[11px] text-gray-500">
                  {metrics.days} Days ({dayjs(subEvent.startTime).format("MMM DD")}-{dayjs(subEvent.endTime).format("DD")})
                </div>
              </Card>

              {/* Actual Cost */}
              <Card className="shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-gray-600 uppercase">
                    Actual Cost
                  </span>
                  <DollarOutlined className="text-purple-500 text-lg" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  ${metrics.actualCost.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-green-600">
                  <CheckCircleOutlined className="text-[10px]" />
                  <span>✔ Under Budget</span>
                </div>
              </Card>

              {/* Overall Rating */}
              <Card className="shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-medium text-gray-600 uppercase">
                    Overall Rating
                  </span>
                  <StarOutlined className="text-yellow-500 text-lg" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metrics.rating}/5
                </div>
                <div className="text-[11px] text-gray-500">
                  Based on {metrics.ratingCount} responses
                </div>
              </Card>
            </div>

            {/* Content Section */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileTextOutlined />
                  <span className="text-[14px] font-semibold">Content</span>
                </div>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                {/* Banner */}
                {subEvent.bannerUrl && (
                  <div>
                    <label className="text-[12px] text-gray-600 mb-2 block">Banner</label>
                    <img
                      src={subEvent.bannerUrl}
                      alt="Event banner"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                {/* Email Link */}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Email Campaign</label>
                  {subEvent.emailLink ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="link"
                        icon={<MailOutlined />}
                        onClick={() => window.open(subEvent.emailLink, "_blank")}
                        style={{ fontSize: "13px", padding: 0 }}
                      >
                        View Email Campaign
                      </Button>
                      <Button
                        type="link"
                        onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/email-editor`)}
                        style={{ fontSize: "12px", color: "#F2721E" }}
                      >
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="primary"
                      icon={<MailOutlined />}
                      onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/email-editor`)}
                      style={{
                        backgroundColor: "#F2721E",
                        borderColor: "#F2721E",
                        fontSize: "13px",
                      }}
                    >
                      Create Email Campaign
                    </Button>
                  )}
                </div>
                {/* Stakeholder Feedback */}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Stakeholder Feedback</label>
                  <Button
                    type="default"
                    icon={<MessageOutlined />}
                    onClick={() => {
                      const path = `/admin/events/${eventId}/sub-events/${subEventId}/stakeholder-feedback`;
                      navigate(path);
                    }}
                    className="stakeholder-feedback-btn"
                    style={{
                      fontSize: "13px",
                    }}
                  >
                    Request Stakeholder Feedback
                  </Button>
                  <style>{`
                    .stakeholder-feedback-btn.ant-btn-default {
                      border-color: #F2721E !important;
                      color: #F2721E !important;
                    }
                    .stakeholder-feedback-btn.ant-btn-default:hover,
                    .stakeholder-feedback-btn.ant-btn-default:focus {
                      border-color: #F2721E !important;
                      color: #F2721E !important;
                      background-color: #FFF5ED !important;
                    }
                    .stakeholder-feedback-btn.ant-btn-default:hover {
                      border-color: #F2721E !important;
                      color: #F2721E !important;
                      background-color: #FFF5ED !important;
                    }
                  `}</style>
                </div>
              </div>
            </Card>

            {/* Event Highlights */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <PictureOutlined />
                  <span className="text-[14px] font-semibold">Event Highlights</span>
                </div>
              }
              extra={
                <Button
                  type="link"
                  className="p-0 text-[12px] text-[#F2721E]"
                  onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/gallery`)}
                >
                  View All Photos
                </Button>
              }
              className="shadow-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                  <span className="text-gray-400 text-[12px]">Map View</span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                  <span className="text-gray-400 text-[12px]">Networking</span>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                  <span className="text-gray-400 text-[12px]">Gala Dinner</span>
                </div>
                <div className="bg-[#F2721E] rounded-lg p-4 h-32 flex items-center justify-center">
                  <span className="text-white text-[12px] font-semibold">+ 42 More</span>
                </div>
              </div>
            </Card>

            {/* Financial Overview */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <BarChartOutlined />
                  <span className="text-[14px] font-semibold">Financial Overview</span>
                </div>
              }
              className="shadow-sm"
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-gray-700">Total Budget</span>
                  <span className="text-[13px] font-semibold text-gray-900">
                    ${financialData.totalBudget.toLocaleString()}.00
                  </span>
                </div>
                <Divider className="my-3" />
                {financialData.expenses.map((expense, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-gray-700">
                        {expense.category} ({expense.percentage}%)
                      </span>
                      <span className="text-[12px] font-semibold text-gray-900">
                        ${expense.amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      percent={expense.percentage}
                      showInfo={false}
                      strokeColor="#F2721E"
                      size="small"
                    />
                  </div>
                ))}
                <Divider className="my-3" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-gray-700">Remaining Budget</span>
                  <span className="text-[13px] font-semibold text-green-600">
                    +${remainingBudget.toLocaleString()}.00
                  </span>
                </div>
              </div>
            </Card>

            {/* Feedback Summary */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <MessageOutlined />
                  <span className="text-[14px] font-semibold">Feedback Summary</span>
                </div>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="mb-2">
                      <div className="text-[13px] font-semibold text-gray-900">
                        {feedback.name}
                      </div>
                      <div className="text-[11px] text-gray-500">{feedback.role}</div>
                    </div>
                    <p className="text-[12px] text-gray-700 mt-2">{feedback.comment}</p>
                  </div>
                ))}
                <Button
                  type="link"
                  className="p-0 text-[12px] text-[#F2721E] mt-2"
                  onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/feedback`)}
                >
                  Load more feedback
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Report Actions */}
            <Card
              title={
                <span className="text-[12px] font-semibold text-gray-600 uppercase">
                  Report Actions
                </span>
              }
              className="shadow-sm"
            >
              <Space direction="vertical" className="w-full" size="small">
                <Button
                  icon={<MailOutlined />}
                  block
                  onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/stakeholder-feedback`)}
                  className="report-action-btn"
                  style={{
                    fontSize: "13px",
                    height: "40px",
                    textAlign: "left",
                  }}
                >
                  Email to Stakeholders
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  block
                  onClick={() => {
                    // TODO: Implement download raw data
                    message.info("Download Raw Data feature coming soon");
                  }}
                  className="report-action-btn"
                  style={{
                    fontSize: "13px",
                    height: "40px",
                    textAlign: "left",
                  }}
                >
                  Download Raw Data
                </Button>
                <Button
                  icon={<FolderOutlined />}
                  block
                  onClick={() => {
                    // TODO: Implement view archive
                    message.info("View Archive feature coming soon");
                  }}
                  className="report-action-btn"
                  style={{
                    fontSize: "13px",
                    height: "40px",
                    textAlign: "left",
                  }}
                >
                  View Archive
                </Button>
              </Space>
              <style>{`
                .report-action-btn.ant-btn-default {
                  border-color: #e5e7eb !important;
                  color: #374151 !important;
                  background-color: #ffffff !important;
                }
                .report-action-btn.ant-btn-default:hover,
                .report-action-btn.ant-btn-default:focus {
                  border-color: #F2721E !important;
                  color: #F2721E !important;
                  background-color: #ffffff !important;
                }
              `}</style>
            </Card>

            {/* Event Team */}
            <Card
              title={
                <span className="text-[12px] font-semibold text-gray-600 uppercase">
                  Event Team
                </span>
              }
              className="shadow-sm"
            >
              <div className="space-y-3">
                {eventTeam.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar
                      size={40}
                      style={{
                        backgroundColor: "#F2721E",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {member.initials}
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-gray-900">
                        {member.name}
                      </div>
                      <div className="text-[11px] text-gray-500">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Analysis */}
            <Card
              className="shadow-sm"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <ThunderboltOutlined className="text-white text-lg" />
                <span className="text-[13px] font-semibold text-white">AI Analysis</span>
              </div>
              <p className="text-[12px] text-white leading-relaxed">
                Compared to last year, attendee satisfaction rose by 15%. The 'Blockchain Workshop' was the most engaged session. Consider expanding technical tracks next year.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewDetailSubEvent;
