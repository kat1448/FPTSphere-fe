import React from "react";
import { Card, Row, Col, Typography, Space, Statistic } from "antd";
import {
  TeamOutlined,
  TrophyOutlined,
  RocketOutlined,
  HeartOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const About = () => {
  const values = [
    {
      icon: <TeamOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Collaboration",
      description: "We believe in the power of working together to create amazing events.",
    },
    {
      icon: <TrophyOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Excellence",
      description: "We strive for excellence in everything we do, ensuring the best experience for our users.",
    },
    {
      icon: <RocketOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Innovation",
      description: "We continuously innovate to provide cutting-edge solutions for event management.",
    },
    {
      icon: <HeartOutlined style={{ fontSize: "48px", color: "#F2721E" }} />,
      title: "Passion",
      description: "We are passionate about helping you create memorable and successful events.",
    },
  ];

  const milestones = [
    { number: "500+", label: "Events Managed" },
    { number: "10K+", label: "Active Users" },
    { number: "50+", label: "Organizations" },
    { number: "99%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#F2721E] to-[#D4621A] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Title level={1} className="text-white mb-4" style={{ fontSize: "3rem", fontWeight: 700 }}>
            About FPTSphere
          </Title>
          <Paragraph className="text-xl text-orange-100 max-w-3xl mx-auto">
            Empowering students and organizations to create, manage, and execute successful events
            with ease and efficiency.
          </Paragraph>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={12}>
            <Title level={2} style={{ color: "#F2721E", marginBottom: "1.5rem" }}>
              Our Mission
            </Title>
            <Paragraph className="text-lg text-gray-700 mb-4">
              At FPTSphere, we are dedicated to revolutionizing event management for educational
              institutions and organizations. Our mission is to provide a comprehensive, user-friendly
              platform that simplifies the entire event lifecycle—from planning and organization to
              execution and analysis.
            </Paragraph>
            <Paragraph className="text-lg text-gray-700">
              We believe that great events have the power to inspire, connect, and transform
              communities. That's why we've built FPTSphere to be more than just a tool—it's a
              complete ecosystem designed to help you create memorable experiences.
            </Paragraph>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              className="shadow-lg border-0"
              style={{ borderRadius: "16px", background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)" }}
              bodyStyle={{ padding: "2.5rem" }}
            >
              <Title level={3} style={{ color: "#F2721E", marginBottom: "1rem" }}>
                What We Do
              </Title>
              <Space direction="vertical" size="middle" className="w-full">
                {[
                  "Streamline event planning and management",
                  "Facilitate team collaboration and communication",
                  "Track attendance and engagement metrics",
                  "Provide comprehensive analytics and insights",
                  "Ensure secure and reliable data management",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleOutlined style={{ color: "#F2721E", fontSize: "20px" }} />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Statistics Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Title level={2} style={{ color: "#F2721E", marginBottom: "1rem" }}>
              Our Impact
            </Title>
            <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
              Numbers that speak for themselves. See how FPTSphere is making a difference.
            </Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {milestones.map((milestone, index) => (
              <Col xs={12} sm={12} md={6} key={index}>
                <Card
                  className="text-center shadow-md hover:shadow-lg transition-all duration-300 border-0"
                  style={{ borderRadius: "16px" }}
                  bodyStyle={{ padding: "2rem" }}
                >
                  <Statistic
                    value={milestone.number}
                    suffix={milestone.label}
                    valueStyle={{ color: "#F2721E", fontSize: "2rem", fontWeight: 700 }}
                    suffixStyle={{ color: "#6B7280", fontSize: "1rem" }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Values Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Title level={2} style={{ color: "#F2721E", marginBottom: "1rem" }}>
            Our Core Values
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            The principles that guide everything we do at FPTSphere.
          </Paragraph>
        </div>
        <Row gutter={[24, 24]}>
          {values.map((value, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="h-full text-center shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                style={{
                  borderRadius: "16px",
                  border: "1px solid #FED7AA",
                }}
                bodyStyle={{ padding: "2rem" }}
              >
                <Space direction="vertical" size="large" className="w-full">
                  <div className="flex justify-center">{value.icon}</div>
                  <Title level={4} style={{ color: "#F2721E", marginBottom: "0.5rem" }}>
                    {value.title}
                  </Title>
                  <Paragraph className="text-gray-600 mb-0">
                    {value.description}
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#F2721E] to-[#D4621A] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Title level={2} className="text-white mb-4">
            Join Us on This Journey
          </Title>
          <Paragraph className="text-xl text-orange-100 mb-8">
            Be part of a community that's transforming the way events are managed. Start your journey with FPTSphere today.
          </Paragraph>
          <a
            href="/login"
            className="inline-block bg-white text-[#F2721E] px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-50 transition-colors duration-300"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;
