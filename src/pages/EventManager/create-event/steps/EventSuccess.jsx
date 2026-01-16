// src/pages/EventManager/create-event/steps/EventSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Typography, Button, Space, Result } from "antd";
import { CheckCircleOutlined, HomeOutlined, EyeOutlined } from "@ant-design/icons";
import { WizardSS } from "../wizardStorage";
import { getDashboardPath } from "../../../../utils/roleUtils";
import authService from "../../../../services/authService";

const { Title, Text } = Typography;

export default function EventSuccess() {
  const navigate = useNavigate();
  const [mainEvent, setMainEvent] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    setMainEvent(me);

    // Clear wizard storage after showing success
    setTimeout(() => {
      WizardSS.remove("mainEvent");
      WizardSS.remove("subEvents");
      WizardSS.remove("directorTasks");
      WizardSS.remove("mainEventDraft");
    }, 5000);
  }, []);

  const handleViewEvent = () => {
    if (mainEvent?.eventId) {
      // Navigate to event view based on user role
      const roleId = user?.roleId ? Number(user.roleId) : null;
      const roleName = user?.roleName || "";
      
      if (roleId === 2 || roleName === "Director") {
        navigate(`/director/events/${mainEvent.eventId}/view`);
      } else if (roleId === 3 || roleName === "Event Manager") {
        navigate(`/event-manager/${mainEvent.eventId}/view`);
      } else {
        // Fallback to admin route
        navigate(`/admin/events/${mainEvent.eventId}`);
      }
    } else {
      navigate(getDashboardPath(user?.roleId, user?.roleName));
    }
  };

  const handleGoHome = () => {
    navigate(getDashboardPath(user?.roleId, user?.roleName));
  };

  return (
    <div style={{ padding: "40px", minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
          status="success"
          title={
            <Title level={2} style={{ color: "#52c41a", marginTop: "16px" }}>
              Event Created Successfully!
            </Title>
          }
          subTitle={
            <div style={{ marginTop: "16px" }}>
              <Text style={{ fontSize: "16px" }}>
                {mainEvent?.name ? (
                  <>
                    Your event <Text strong>"{mainEvent.name}"</Text> has been created successfully.
                  </>
                ) : (
                  "Your event has been created successfully."
                )}
              </Text>
              {mainEvent?.eventId && (
                <div style={{ marginTop: "12px" }}>
                  <Text type="secondary">Event ID: {mainEvent.eventId}</Text>
                </div>
              )}
            </div>
          }
          extra={[
            <Button
              key="view"
              type="primary"
              icon={<EyeOutlined />}
              onClick={handleViewEvent}
              size="large"
              style={{ background: "#F2721E", borderColor: "#F2721E" }}
            >
              View Event
            </Button>,
            <Button
              key="home"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
              size="large"
            >
              Go to Dashboard
            </Button>,
          ]}
        />
      </div>
    </div>
  );
}
