import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Progress,
  InputNumber,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { WizardSS } from "../wizardStorage";

const { Text, Title } = Typography;
const { Option } = Select;

const FALLBACK_BANNERS = [
  "https://images.unsplash.com/photo-1512427691650-1e0c2f9a81b3?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1522204502588-56c0947629a7?w=800&h=450&fit=crop",
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=450&fit=crop",
];

export default function Step3Resources({ onPrev, onNext }) {
  const [mainEvent, setMainEvent] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    const subs = WizardSS.get("subEvents", []);
    setMainEvent(me);

    const mapped = subs.map((sub, index) => ({
      key: index,
      ...sub,
      bannerUrl: sub.bannerUrl || FALLBACK_BANNERS[index % FALLBACK_BANNERS.length],
      expectedAttendees: sub.expectedAttendees ?? 0,
      feasibility: sub.feasibility || "High",
    }));
    setRows(mapped);
  }, []);

  const totalCost = useMemo(
    () => rows.reduce((sum, r) => sum + (r.totalCost || 0), 0),
    [rows]
  );

  const totalAttendees = useMemo(
    () => rows.reduce((sum, r) => sum + (r.expectedAttendees || 0), 0),
    [rows]
  );

  const averageFeasibilityScore = useMemo(() => {
    if (!rows.length) return 0;
    const scoreMap = { High: 100, Medium: 65, Low: 35 };
    const total = rows.reduce(
      (sum, r) => sum + (scoreMap[r.feasibility] || 65),
      0
    );
    return Math.round(total / rows.length);
  }, [rows]);

  const updateRow = (key, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const handleNext = () => {
    // Persist attendees & feasibility back to subEvents
    const existing = WizardSS.get("subEvents", []);
    const updated = existing.map((sub, idx) => {
      const found = rows.find((r) => r.key === idx);
      if (!found) return sub;
      return {
        ...sub,
        expectedAttendees: found.expectedAttendees,
        feasibility: found.feasibility,
        bannerUrl: found.bannerUrl,
      };
    });

    WizardSS.set("subEvents", updated);
    onNext();
  };

  const columns = [
    {
      title: "Session",
      dataIndex: "eventName",
      key: "session",
      width: 260,
      render: (_, record) => (
        <div className="flex gap-3 items-start">
          <div
            className="w-24 h-16 rounded-md bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(${record.bannerUrl})` }}
          />
          <Space direction="vertical" size={2} style={{ width: "100%" }}>
            <Text strong style={{ fontSize: 14 }}>
              {record.eventName}
            </Text>
            <Space size={4} wrap>
              {record.sessionType && (
                <Tag color="volcano" style={{ fontSize: 12 }}>
                  {record.sessionType}
                </Tag>
              )}
              {record.trackCategory && (
                <Tag color="geekblue" style={{ fontSize: 12 }}>
                  {record.trackCategory}
                </Tag>
              )}
            </Space>
          </Space>
        </div>
      ),
    },
    {
      title: "Timeline",
      key: "timeline",
      width: 230,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <ClockCircleOutlined style={{ color: "#F2721E" }} />
            <Text style={{ fontSize: 14 }}>
              {dayjs(record.startTime).format("MMM DD, YYYY HH:mm")} -{" "}
              {dayjs(record.endTime).format("HH:mm")}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Duration:{" "}
            {dayjs(record.endTime).diff(dayjs(record.startTime), "minute")}{" "}
            minutes
          </Text>
        </Space>
      ),
    },
    {
      title: "Location",
      key: "location",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space>
            <EnvironmentOutlined style={{ color: "#3b82f6" }} />
            <Text style={{ fontSize: 14 }}>
              {record.selectedLocation?.name ||
                record.selectedLocation?.code ||
                "TBA"}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.locationMode === "online"
              ? "Online"
              : record.selectedLocation?.building
              ? `${record.selectedLocation.building} • ${
                  record.selectedLocation.roomNumber || "Room"
                }`
              : record.locationMode || "Internal"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Expected Attendees",
      dataIndex: "expectedAttendees",
      key: "expectedAttendees",
      width: 150,
      render: (value, record) => (
        <InputNumber
          min={0}
          value={value}
          onChange={(val) => updateRow(record.key, "expectedAttendees", val || 0)}
          style={{ width: "100%", fontSize: 14 }}
        />
      ),
    },
    {
      title: "Feasibility",
      dataIndex: "feasibility",
      key: "feasibility",
      width: 160,
      render: (value, record) => {
        const color =
          value === "High" ? "green" : value === "Medium" ? "orange" : "red";
        return (
          <Space>
            <Tag color={color} style={{ fontSize: 12 }}>
              {value}
            </Tag>
            <Select
              size="small"
              value={value}
              style={{ width: 90, fontSize: 12 }}
              onChange={(val) => updateRow(record.key, "feasibility", val)}
            >
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Space>
        );
      },
    },
    {
      title: "Resource Cost",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      width: 160,
      render: (value) => (
        <Text strong style={{ fontSize: 14 }}>
          {(value || 0).toLocaleString("vi-VN")} ₫
        </Text>
      ),
    },
  ];

  if (!mainEvent) {
    return (
      <div className="p-6">
        <Text type="secondary" style={{ fontSize: 14 }}>
          Loading resources overview...
        </Text>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Title level={3} style={{ margin: 0, color: "#F2721E", fontWeight: 700 }}>
          Step 3: Resources & Budget Overview
        </Title>
        <Text style={{ fontSize: 14 }}>
          {mainEvent.name} •{" "}
          {dayjs(mainEvent.start).format("MMM DD")} -{" "}
          {dayjs(mainEvent.end).format("MMM DD, YYYY")}
        </Text>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Total Resource Cost
              </Text>
              <Text strong style={{ fontSize: 22, color: "#F2721E" }}>
                {totalCost.toLocaleString("vi-VN")} ₫
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Across {rows.length} sub-events
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Expected Attendees
              </Text>
              <Text strong style={{ fontSize: 22 }}>
                {totalAttendees.toLocaleString("vi-VN")}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sum of all sessions
              </Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Overall Feasibility
              </Text>
              <Progress
                percent={averageFeasibilityScore}
                showInfo={false}
                strokeColor={
                  averageFeasibilityScore >= 80
                    ? "#22c55e"
                    : averageFeasibilityScore >= 60
                    ? "#f97316"
                    : "#ef4444"
                }
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Combined feasibility across sessions
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center justify-between">
            <Text strong style={{ fontSize: 14 }}>
              Resource Payment & Timeline
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Review and adjust attendees & feasibility before finalizing tasks.
            </Text>
          </div>
        }
        bodyStyle={{ paddingTop: 12 }}
      >
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          size="small"
          rowKey="key"
          summary={(pageData) => {
            const totalCost = pageData.reduce((sum, record) => sum + (record.totalCost || 0), 0);
            const totalAttendees = pageData.reduce((sum, record) => sum + (record.expectedAttendees || 0), 0);
            
            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: "#fafafa" }}>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <Text strong style={{ fontSize: 14 }}>
                      Total
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    <Text strong style={{ fontSize: 14 }}>
                      {totalAttendees.toLocaleString("vi-VN")}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      -
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong style={{ fontSize: 16, color: "#F2721E" }}>
                      {totalCost.toLocaleString("vi-VN")} ₫
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </Card>

      <div className="flex justify-end items-center gap-3 mt-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onPrev}
          style={{ fontSize: 14 }}
        >
          Back to Sub-Events
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleNext}
          style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: 14 }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
