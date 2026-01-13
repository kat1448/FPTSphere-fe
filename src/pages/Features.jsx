import React from "react";
import { Card, Row, Col, Typography, Space } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SafetyOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const Features = () => {
  const features = [
    {
      icon: <CalendarOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Event Management",
      description: "Create, manage, and organize events with ease. Schedule dates, set locations, and track attendance all in one place.",
    },
    {
      icon: <TeamOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Team Collaboration",
      description: "Work seamlessly with your team. Assign tasks, share updates, and collaborate in real-time.",
    },
    {
      icon: <FileTextOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Task Assignment",
      description: "Efficiently assign tasks to team members, track progress, and ensure everything is completed on time.",
    },
    {
      icon: <BarChartOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Analytics & Reports",
      description: "Get detailed insights into your events. Track attendance, engagement, and performance metrics.",
    },
    {
      icon: <SafetyOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security. We ensure your information stays safe.",
    },
    {
      icon: <RocketOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Fast & Efficient",
      description: "Experience lightning-fast performance. Our platform is optimized for speed and efficiency.",
    },
  ];

  const benefits = [
    "Streamlined event planning process",
    "Real-time collaboration tools",
    "Comprehensive analytics dashboard",
    "Mobile-friendly interface",
    "24/7 customer support",
    "Customizable event templates",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#F2721E] to-[#D4621A] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Title level={1} className="text-white mb-4" style={{ fontSize: "3rem", fontWeight: 700 }}>
            Powerful Features for Event Management
          </Title>
          <Paragraph className="text-xl text-orange-100 max-w-3xl mx-auto">
            Discover all the tools you need to create, manage, and execute successful events.
            Everything you need in one comprehensive platform.
          </Paragraph>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card
                className="h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{
                  borderRadius: "16px",
                  border: "1px solid #FED7AA",
                }}
                bodyStyle={{ padding: "2rem" }}
              >
                <Space direction="vertical" size="large" className="w-full">
                  <div className="flex justify-center">{feature.icon}</div>
                  <Title level={4} className="text-center" style={{ color: "#F2721E", marginBottom: 0 }}>
                    {feature.title}
                  </Title>
                  <Paragraph className="text-center text-gray-600 mb-0">
                    {feature.description}
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} style={{ color: "#F2721E", marginBottom: "1rem" }}>
              Why Choose FPTSphere?
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of event organizers who trust FPTSphere to make their events successful.
            </Paragraph>
          </div>

          <Row gutter={[24, 16]}>
            {benefits.map((benefit, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <CheckCircleOutlined style={{ fontSize: "24px", color: "#F2721E" }} />
                  <span className="text-gray-700 font-medium">{benefit}</span>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#F2721E] to-[#D4621A] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Title level={2} className="text-white mb-4">
            Ready to Get Started?
          </Title>
          <Paragraph className="text-xl text-orange-100 mb-8">
            Start managing your events more efficiently today. Sign up for free and experience the difference.
          </Paragraph>
          <a
            href="/login"
            className="inline-block bg-white text-[#F2721E] px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-50 transition-colors duration-300"
          >
            Get Started Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default Features;
