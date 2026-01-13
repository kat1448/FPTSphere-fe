import React, { useState, useEffect, useMemo } from "react";
import {
  DownloadOutlined,
  ReloadOutlined,
  DollarOutlined,
  UserOutlined,
  CalendarOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import {
  Card,
  Table,
  Button,
  DatePicker,
  Space,
  Spin,
  message,
  Tag,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getEvents, getSubEvents } from "../../services/events.api";
import * as XLSX from "xlsx";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);

  // Load all events
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents({
        page: 1,
        pageSize: 1000, // Get all events for reporting
        includeDeleted: false,
        sortBy: "CreatedAt",
        sortDescending: true,
      });

      if (response && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      message.error("Failed to load events data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Filter events by date range
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter((event) => {
        const eventStart = dayjs(event.startTime);
        return (
          eventStart.isAfter(startDate.subtract(1, "day")) &&
          eventStart.isBefore(endDate.add(1, "day"))
        );
      });
    }

    return filtered;
  }, [events, dateRange]);

  // Organize events: main events with their sub-events
  const organizedEvents = useMemo(() => {
    const mainEvents = filteredEvents.filter((e) => e.parentEventId === null);
    const subEventsMap = new Map();

    // Group sub-events by parent event ID
    filteredEvents
      .filter((e) => e.parentEventId !== null)
      .forEach((subEvent) => {
        const parentId = subEvent.parentEventId;
        if (!subEventsMap.has(parentId)) {
          subEventsMap.set(parentId, []);
        }
        subEventsMap.get(parentId).push(subEvent);
      });

    // Calculate total cost for each main event
    return mainEvents.map((mainEvent) => {
      const subEvents = subEventsMap.get(mainEvent.eventId) || [];
      const subEventsCost = subEvents.reduce(
        (sum, se) => sum + (se.estimatedCost || 0),
        0
      );
      const totalCost =
        (mainEvent.estimatedCost || 0) + subEventsCost;

      return {
        ...mainEvent,
        subEvents,
        totalCost,
        subEventsCost,
      };
    });
  }, [filteredEvents]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCost = organizedEvents.reduce(
      (sum, e) => sum + e.totalCost,
      0
    );
    const totalEvents = organizedEvents.length;
    const totalSubEvents = organizedEvents.reduce(
      (sum, e) => sum + e.subEvents.length,
      0
    );

    // Calculate participant attendance (fake data for now)
    // In real scenario, this would come from API
    const totalParticipants = organizedEvents.reduce((sum, event) => {
      const mainEventParticipants = event.expectedAttendees || 0;
      const subEventParticipants = event.subEvents.reduce(
        (s, se) => s + (se.expectedAttendees || 0),
        0
      );
      return sum + mainEventParticipants + subEventParticipants;
    }, 0);

    return {
      totalCost,
      totalEvents,
      totalSubEvents,
      totalParticipants,
    };
  }, [organizedEvents]);

  // Chart data for cost by event
  const costChartData = useMemo(() => {
    return organizedEvents
      .slice(0, 10) // Top 10 events
      .map((event) => ({
        name: event.eventName.length > 20
          ? event.eventName.substring(0, 20) + "..."
          : event.eventName,
        cost: event.totalCost,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [organizedEvents]);

  // Chart data for events by status
  const statusChartData = useMemo(() => {
    const statusCount = {};
    filteredEvents.forEach((event) => {
      const status = event.status?.statusName || "UNKNOWN";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredEvents]);

  // Chart data for events by category
  const categoryChartData = useMemo(() => {
    const categoryCount = {};
    filteredEvents.forEach((event) => {
      const category = event.categoryName || "Unknown";
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredEvents]);

  // Chart data for participant attendance over time
  const attendanceChartData = useMemo(() => {
    const monthlyData = {};
    filteredEvents.forEach((event) => {
      const month = dayjs(event.startTime).format("MMM YYYY");
      const participants = event.expectedAttendees || 0;
      monthlyData[month] = (monthlyData[month] || 0) + participants;

      // Add sub-events participants
      if (event.parentEventId === null) {
        const subEvents = organizedEvents.find(
          (e) => e.eventId === event.eventId
        )?.subEvents || [];
        subEvents.forEach((subEvent) => {
          const subParticipants = subEvent.expectedAttendees || 0;
          monthlyData[month] += subParticipants;
        });
      }
    });

    return Object.entries(monthlyData)
      .map(([name, value]) => ({ name, participants: value }))
      .sort((a, b) => dayjs(a.name, "MMM YYYY").unix() - dayjs(b.name, "MMM YYYY").unix());
  }, [filteredEvents, organizedEvents]);

  // COLORS for charts
  const COLORS = [
    "#F2721E",
    "#1890ff",
    "#52c41a",
    "#faad14",
    "#f5222d",
    "#722ed1",
    "#13c2c2",
    "#eb2f96",
  ];

  // Handle row expand
  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRows([...expandedRows, record.eventId]);
    } else {
      setExpandedRows(expandedRows.filter((id) => id !== record.eventId));
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Cost Report
      const costReportData = [];
      
      // Header row
      costReportData.push([
        "Event Name",
        "Start Date",
        "End Date",
        "Main Event Cost",
        "Sub-Events Cost",
        "Total Cost",
        "Status",
        "Category",
      ]);

      // Data rows
      organizedEvents.forEach((event) => {
        costReportData.push([
          event.eventName,
          dayjs(event.startTime).format("YYYY-MM-DD HH:mm"),
          dayjs(event.endTime).format("YYYY-MM-DD HH:mm"),
          event.estimatedCost || 0,
          event.subEventsCost,
          event.totalCost,
          event.status?.statusName || "N/A",
          event.categoryName || "N/A",
        ]);

        // Add sub-events
        event.subEvents.forEach((subEvent) => {
          costReportData.push([
            `  └─ ${subEvent.eventName}`,
            dayjs(subEvent.startTime).format("YYYY-MM-DD HH:mm"),
            dayjs(subEvent.endTime).format("YYYY-MM-DD HH:mm"),
            "-",
            subEvent.estimatedCost || 0,
            subEvent.estimatedCost || 0,
            subEvent.status?.statusName || "N/A",
            subEvent.categoryName || "N/A",
          ]);
        });
      });

      const costSheet = XLSX.utils.aoa_to_sheet(costReportData);
      
      // Set column widths for better readability
      costSheet["!cols"] = [
        { wch: 30 }, // Event Name
        { wch: 18 }, // Start Date
        { wch: 18 }, // End Date
        { wch: 15 }, // Main Event Cost
        { wch: 15 }, // Sub-Events Cost
        { wch: 12 }, // Total Cost
        { wch: 12 }, // Status
        { wch: 15 }, // Category
      ];
      
      XLSX.utils.book_append_sheet(workbook, costSheet, "Cost Report");

      // Sheet 2: Summary Statistics
      const summaryData = [
        ["Event Report Summary"],
        [],
        ["Generated Date", dayjs().format("YYYY-MM-DD HH:mm:ss")],
        ["Date Range", dateRange ? `${dateRange[0].format("YYYY-MM-DD")} to ${dateRange[1].format("YYYY-MM-DD")}` : "All Time"],
        [],
        ["Metric", "Value"],
        ["Total Events", statistics.totalEvents],
        ["Total Sub-Events", statistics.totalSubEvents],
        ["Total Cost", `$${statistics.totalCost.toLocaleString()}`],
        ["Total Participants (Estimated)", statistics.totalParticipants],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [
        { wch: 30 }, // Metric
        { wch: 20 }, // Value
      ];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Sheet 3: Events by Status
      const statusData = [["Status", "Count"]];
      statusChartData.forEach((item) => {
        statusData.push([item.name, item.value]);
      });
      const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
      statusSheet["!cols"] = [
        { wch: 20 }, // Status
        { wch: 10 }, // Count
      ];
      XLSX.utils.book_append_sheet(workbook, statusSheet, "Events by Status");

      // Sheet 4: Events by Category
      const categoryData = [["Category", "Count"]];
      categoryChartData.forEach((item) => {
        categoryData.push([item.name, item.value]);
      });
      const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
      categorySheet["!cols"] = [
        { wch: 20 }, // Category
        { wch: 10 }, // Count
      ];
      XLSX.utils.book_append_sheet(workbook, categorySheet, "Events by Category");

      // Generate filename
      const filename = `Event_Report_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);
      message.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("Failed to export report");
    }
  };

  // Table columns for cost report
  const columns = [
    {
      title: "Event Name",
      dataIndex: "eventName",
      key: "eventName",
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Start Date",
      dataIndex: "startTime",
      key: "startTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "End Date",
      dataIndex: "endTime",
      key: "endTime",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Main Event Cost",
      dataIndex: "estimatedCost",
      key: "estimatedCost",
      align: "right",
      render: (cost) =>
        cost ? `$${cost.toLocaleString()}` : <span className="text-gray-400">$0</span>,
    },
    {
      title: "Sub-Events Cost",
      dataIndex: "subEventsCost",
      key: "subEventsCost",
      align: "right",
      render: (cost) =>
        cost ? `$${cost.toLocaleString()}` : <span className="text-gray-400">$0</span>,
    },
    {
      title: "Total Cost",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (cost) => (
        <span className="font-bold text-lg text-orange-600">
          ${cost.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: ["status", "statusName"],
      key: "status",
      render: (status) => {
        const colorMap = {
          PENDING: "orange",
          APPROVED: "green",
          REJECTED: "red",
          CANCELLED: "default",
        };
        return (
          <Tag color={colorMap[status] || "default"}>{status || "N/A"}</Tag>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "category",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            View event costs, participant statistics, and analytics
          </p>
        </div>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
            placeholder={["Start Date", "End Date"]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadEvents}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={exportToExcel}
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            Export to Excel
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Events"
              value={statistics.totalEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sub-Events"
              value={statistics.totalSubEvents}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Cost"
              value={statistics.totalCost}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#F2721E" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Participants"
              value={statistics.totalParticipants}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cost Report Table */}
      <Card
        title="Cost Report by Event"
        className="mb-6"
        extra={
          <span className="text-gray-500">
            Click on a row to expand and view sub-events
          </span>
        }
      >
        <Table
          columns={columns}
          dataSource={organizedEvents}
          loading={loading}
          rowKey="eventId"
          expandable={{
            expandedRowKeys: expandedRows,
            onExpand: handleExpand,
            expandedRowRender: (record) => {
              if (record.subEvents.length === 0) {
                return (
                  <div className="p-4 text-gray-500 text-center">
                    No sub-events for this event
                  </div>
                );
              }

              const subEventColumns = [
                {
                  title: "Sub-Event Name",
                  dataIndex: "eventName",
                  key: "eventName",
                },
                {
                  title: "Start Date",
                  dataIndex: "startTime",
                  key: "startTime",
                  render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
                },
                {
                  title: "End Date",
                  dataIndex: "endTime",
                  key: "endTime",
                  render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
                },
                {
                  title: "Cost",
                  dataIndex: "estimatedCost",
                  key: "estimatedCost",
                  align: "right",
                  render: (cost) =>
                    cost ? (
                      <span className="font-semibold text-orange-600">
                        ${cost.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">$0</span>
                    ),
                },
                {
                  title: "Status",
                  dataIndex: ["status", "statusName"],
                  key: "status",
                  render: (status) => {
                    const colorMap = {
                      PENDING: "orange",
                      APPROVED: "green",
                      REJECTED: "red",
                      CANCELLED: "default",
                    };
                    return (
                      <Tag color={colorMap[status] || "default"}>
                        {status || "N/A"}
                      </Tag>
                    );
                  },
                },
              ];

              return (
                <Table
                  columns={subEventColumns}
                  dataSource={record.subEvents}
                  rowKey="eventId"
                  pagination={false}
                  size="small"
                />
              );
            },
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} events`,
          }}
        />
      </Card>

      {/* Charts Row */}
      <Row gutter={16} className="mb-6">
        {/* Cost by Event Chart */}
        <Col xs={24} lg={12}>
          <Card title="Top 10 Events by Cost" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${value.toLocaleString()}`, "Cost"]}
                />
                <Bar dataKey="cost" fill="#F2721E" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Participant Attendance Over Time */}
        <Col xs={24} lg={12}>
          <Card title="Participant Attendance Over Time" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [
                    `${value} participants`,
                    "Attendance",
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="participants"
                  stroke="#1890ff"
                  strokeWidth={2}
                  name="Participants"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Events by Status */}
        <Col xs={24} lg={12}>
          <Card title="Events by Status" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Events by Category */}
        <Col xs={24} lg={12}>
          <Card title="Events by Category" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
