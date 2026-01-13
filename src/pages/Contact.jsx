import React, { useState } from "react";
import { Card, Form, Input, Button, Row, Col, Typography, Space, message } from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SendOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

const Contact = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      message.success("Thank you for your message! We'll get back to you soon.");
      form.resetFields();
    } catch (error) {
      message.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <MailOutlined style={{ fontSize: "32px", color: "#F2721E" }} />,
      title: "Email",
      content: "events@fpt.edu.vn",
      link: "mailto:events@fpt.edu.vn",
    },
    {
      icon: <PhoneOutlined style={{ fontSize: "32px", color: "#F2721E" }} />,
      title: "Phone",
      content: "+84 987 654 321",
      link: "tel:+84987654321",
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: "32px", color: "#F2721E" }} />,
      title: "Address",
      content: "FPT University, Da Nang",
      link: "#",
    },
  ];

  const socialLinks = [
    { icon: <FacebookOutlined />, link: "#", name: "Facebook" },
    { icon: <InstagramOutlined />, link: "#", name: "Instagram" },
    { icon: <LinkedinOutlined />, link: "#", name: "LinkedIn" },
    { icon: <YoutubeOutlined />, link: "#", name: "YouTube" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#F2721E] to-[#D4621A] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Title level={1} className="text-white mb-4" style={{ fontSize: "3rem", fontWeight: 700 }}>
            Get In Touch
          </Title>
          <Paragraph className="text-xl text-orange-100 max-w-3xl mx-auto">
            Have questions or need help? We're here to assist you. Reach out to us and we'll respond as soon as possible.
          </Paragraph>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <Row gutter={[32, 32]}>
          {/* Contact Form */}
          <Col xs={24} lg={14}>
            <Card
              className="shadow-lg border-0"
              style={{ borderRadius: "16px" }}
              bodyStyle={{ padding: "2.5rem" }}
            >
              <Title level={3} style={{ color: "#F2721E", marginBottom: "1.5rem" }}>
                Send us a Message
              </Title>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="firstName"
                      label="First Name"
                      rules={[{ required: true, message: "Please enter your first name" }]}
                    >
                      <Input placeholder="John" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="lastName"
                      label="Last Name"
                      rules={[{ required: true, message: "Please enter your last name" }]}
                    >
                      <Input placeholder="Doe" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input placeholder="john.doe@example.com" />
                </Form.Item>

                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[{ required: true, message: "Please enter a subject" }]}
                >
                  <Input placeholder="How can we help you?" />
                </Form.Item>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: "Please enter your message" }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                    size="large"
                    className="w-full"
                    style={{
                      backgroundColor: "#F2721E",
                      borderColor: "#F2721E",
                      height: "48px",
                      fontSize: "16px",
                      fontWeight: 600,
                    }}
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Contact Information */}
          <Col xs={24} lg={10}>
            <Space direction="vertical" size="large" className="w-full">
              <Card
                className="shadow-lg border-0"
                style={{ borderRadius: "16px" }}
                bodyStyle={{ padding: "2.5rem" }}
              >
                <Title level={3} style={{ color: "#F2721E", marginBottom: "1.5rem" }}>
                  Contact Information
                </Title>
                <Space direction="vertical" size="large" className="w-full">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="mt-1">{info.icon}</div>
                      <div>
                        <Text strong className="block text-gray-900 mb-1">
                          {info.title}
                        </Text>
                        <a
                          href={info.link}
                          className="text-gray-600 hover:text-[#F2721E] transition-colors"
                        >
                          {info.content}
                        </a>
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>

              <Card
                className="shadow-lg border-0"
                style={{ borderRadius: "16px" }}
                bodyStyle={{ padding: "2.5rem" }}
              >
                <Title level={3} style={{ color: "#F2721E", marginBottom: "1.5rem" }}>
                  Follow Us
                </Title>
                <div className="flex gap-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-[#F2721E] hover:bg-[#F2721E] hover:text-white transition-all duration-300"
                      style={{ fontSize: "20px" }}
                      aria-label={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </Card>

              <Card
                className="shadow-lg border-0 bg-gradient-to-br from-[#F2721E] to-[#D4621A]"
                style={{ borderRadius: "16px" }}
                bodyStyle={{ padding: "2.5rem" }}
              >
                <Title level={4} className="text-white mb-2">
                  Office Hours
                </Title>
                <Paragraph className="text-orange-100 mb-0">
                  <Text className="text-white">Monday - Friday:</Text> 8:00 AM - 5:00 PM
                  <br />
                  <Text className="text-white">Saturday:</Text> 9:00 AM - 1:00 PM
                  <br />
                  <Text className="text-white">Sunday:</Text> Closed
                </Paragraph>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Contact;
