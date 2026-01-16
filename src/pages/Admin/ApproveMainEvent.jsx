// src/pages/Admin/ApproveMainEvent.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Divider,
  Row,
  Col,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getEventById, approveEvent } from "../../services/events.api";
import { getDashboardPath } from "../../utils/roleUtils";
import authService from "../../services/authService";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ApproveMainEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [comment, setComment] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await getEventById(Number(eventId));
      
      // Handle API response format: {success, message, data}
      let eventData = null;
      if (response?.success !== undefined) {
        if (response.success) {
          eventData = response.data;
        } else {
          throw new Error(response.message || "Event not found");
        }
      } else {
        eventData = response;
      }
      
      if (!eventData) {
        throw new Error("Event not found");
      }
      
      setEvent(eventData);
    } catch (error) {
      console.error("Error loading event:", error);
      message.error(error.message || "Failed to load event");
      navigate(getDashboardPath(user?.roleId, user?.roleName));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!comment.trim()) {
      message.warning("Please enter a comment");
      return;
    }

    try {
      setProcessing(true);
      await approveEvent(Number(eventId), comment);
      message.success("Event approved successfully");
      setApproveModalVisible(false);
      setComment("");
      loadEvent(); // Reload event to see updated status
    } catch (error) {
      console.error("Error approving event:", error);
      message.error(error.message || "Failed to approve event");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      message.warning("Please enter a rejection reason");
      return;
    }

    try {
      setProcessing(true);
      // TODO: Implement reject API if available
      // For now, just show message
      message.info("Reject functionality will be implemented");
      setRejectModalVisible(false);
      setComment("");
    } catch (error) {
      console.error("Error rejecting event:", error);
      message.error(error.message || "Failed to reject event");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Text type="secondary">Event not found</Text>
      </div>
    );
  }

  const statusMap = {
    1: { name: "Pending", color: "orange" },
    2: { name: "Approved", color: "green" },
    3: { name: "Scheduled", color: "blue" },
    4: { name: "Published", color: "cyan" },
    5: { name: "Ended", color: "default" },
    6: { name: "Cancelled", color: "red" },
  };

  const status = statusMap[event.statusId] || { name: "Unknown", color: "default" };
  const canApprove = event.statusId === 1; // Only pending events can be approved

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(getDashboardPath(user?.roleId, user?.roleName))}
          style={{ marginBottom: "16px" }}
        >
          Back to Dashboard
        </Button>
        <Title level={2} style={{ margin: 0, color: "#F2721E" }}>
          Approve Main Event
        </Title>
      </div>

      <Card>
        <Descriptions title="Event Details" bordered column={2}>
          <Descriptions.Item label="Event Name" span={2}>
            <Text strong style={{ fontSize: "16px" }}>
              {event.eventName}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={status.color}>{status.name}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Event ID">
            {event.eventId}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {event.description || "No description"}
          </Descriptions.Item>
          <Descriptions.Item label="Start Time">
            {event.startTime ? dayjs(event.startTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="End Time">
            {event.endTime ? dayjs(event.endTime).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Attendees">
            {event.expectedAttendees || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Estimated Cost">
            {event.estimatedCost ? `$${event.estimatedCost.toLocaleString()}` : "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Location" span={2}>
            {event.location?.name || event.externalLocation?.name || "TBA"}
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            {event.categoryName || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            {event.typeName || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {event.creator?.fullName || event.creator?.email || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {event.createdAt ? dayjs(event.createdAt).format("YYYY-MM-DD HH:mm") : "N/A"}
          </Descriptions.Item>
        </Descriptions>

        {event.bannerUrl && (
          <div style={{ marginTop: "24px" }}>
            <Text strong style={{ display: "block", marginBottom: "8px" }}>
              Banner Image:
            </Text>
            <img
              src={event.bannerUrl}
              alt="Event banner"
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          </div>
        )}

        {canApprove && (
          <>
            <Divider />
            <Alert
              message="This event is pending approval"
              description="Please review the event details and approve or reject it."
              type="warning"
              showIcon
              style={{ marginBottom: "16px" }}
            />
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setApproveModalVisible(true)}
                size="large"
                style={{ background: "#52c41a", borderColor: "#52c41a" }}
              >
                Approve Event
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalVisible(true)}
                size="large"
              >
                Reject Event
              </Button>
            </Space>
          </>
        )}

        {!canApprove && (
          <div style={{ marginTop: "24px" }}>
            <Alert
              message={`Event is ${status.name}`}
              description="This event has already been processed."
              type="info"
              showIcon
            />
          </div>
        )}
      </Card>

      {/* Approve Modal */}
      <Modal
        title="Approve Event"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setComment("");
        }}
        confirmLoading={processing}
        okText="Approve"
        okButtonProps={{ style: { background: "#52c41a", borderColor: "#52c41a" } }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text>Are you sure you want to approve this event?</Text>
        </div>
        <TextArea
          rows={4}
          placeholder="Enter approval comment (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Event"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setComment("");
        }}
        confirmLoading={processing}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Text>Are you sure you want to reject this event?</Text>
        </div>
        <TextArea
          rows={4}
          placeholder="Enter rejection reason (required)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Modal>
    </div>
  );
}
