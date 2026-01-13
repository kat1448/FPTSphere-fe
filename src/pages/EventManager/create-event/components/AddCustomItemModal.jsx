// src/pages/EventManager/create-event/components/AddCustomItemModal.jsx
import React, { useState } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  InputNumber,
  Select,
  Form,
} from "antd";
const { Compact } = Space;
import {
  PlusOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { getPriceFromChatGPT } from "../../../../services/chatgpt.service.js";
import "./AddCustomItemModal.css";

const { Text } = Typography;
const { Option } = Select;

export default function AddCustomItemModal({
  open,
  onCancel,
  onAddItem,
}) {
  const [form] = Form.useForm();
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Calculate price based on rental unit
  const calculatePrice = (basePrice, unit) => {
    if (!basePrice) return 0;
    // Base price is per day
    switch (unit) {
      case "hour":
        return Math.round(basePrice / 8); // 8 hours per day
      case "day":
        return basePrice;
      case "week":
        return Math.round(basePrice * 5); // 5 days per week
      default:
        return basePrice;
    }
  };

  // Handle add custom item
  const handleAddCustomItem = async () => {
    try {
      const values = await form.validateFields();
      let basePrice = values.price;

      // If AI price is requested
      if (values.useAI) {
        setLoadingPrice(true);
        try {
          const rentalUnit = values.rentalUnit || "day";
          basePrice = await getPriceFromChatGPT(values.name, `Rental price per ${rentalUnit} in VND`);
          form.setFieldsValue({ price: basePrice });
        } catch (error) {
          console.error("Error fetching AI price:", error);
          message.error("Failed to fetch AI price");
          return;
        } finally {
          setLoadingPrice(false);
        }
      }

      const rentalUnit = values.rentalUnit || "day";
      const finalPrice = calculatePrice(basePrice, rentalUnit);

      const newItem = {
        id: Date.now(),
        itemDescription: values.name,
        quantity: values.quantity || 1,
        unitPrice: finalPrice,
        basePrice: basePrice,
        rentalUnit: rentalUnit,
        resourceType: "custom",
        stock: values.stock,
      };

      onAddItem(newItem);
      message.success(`${values.name} added to quotation`);
      form.resetFields();
      onCancel(); // Close modal after adding
    } catch (error) {
      console.error("Error adding custom item:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Add Custom Item"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={700}
      centered
      className="add-custom-item-modal"
    >
      <Form form={form} layout="vertical" size="middle">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={<span style={{ fontSize: "14px", fontWeight: 700 }}>Item Name *</span>}
              rules={[{ required: true, message: "Please enter item name" }]}
            >
              <Input placeholder="Enter item name" style={{ fontSize: "14px" }} size="large" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="stock"
              label={<span style={{ fontSize: "14px", fontWeight: 700 }}>Stock *</span>}
              rules={[{ required: true, message: "Please enter stock" }]}
            >
              <InputNumber min={1} placeholder="Stock" style={{ width: "100%", fontSize: "14px" }} size="large" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="rentalUnit"
              label={<span style={{ fontSize: "14px", fontWeight: 700 }}>Rental Unit</span>}
              initialValue="day"
            >
              <Select style={{ fontSize: "14px" }} size="large" className="custom-select-orange">
                <Option value="hour">Per Hour</Option>
                <Option value="day">Per Day</Option>
                <Option value="week">Per Week</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={18}>
            <Form.Item
              name="price"
              label={
                <Space>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>Price *</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={async () => {
                      const name = form.getFieldValue("name");
                      if (!name) {
                        message.warning("Please enter item name first");
                        return;
                      }
                      setLoadingPrice(true);
                      try {
                        const rentalUnit = form.getFieldValue("rentalUnit") || "day";
                        const price = await getPriceFromChatGPT(name, `Rental price per ${rentalUnit} in VND`);
                        form.setFieldsValue({ price: price });
                        message.success("Price estimated by AI");
                      } catch (error) {
                        message.error("Failed to get AI price");
                      } finally {
                        setLoadingPrice(false);
                      }
                    }}
                    loading={loadingPrice}
                    style={{ padding: 0, fontSize: "12px", height: "auto", color: "#F2721E" }}
                  >
                    Get AI Price
                  </Button>
                </Space>
              }
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <Compact style={{ width: "100%" }}>
                <InputNumber
                  min={0}
                  placeholder="Enter price or use AI"
                  style={{ width: "100%", fontSize: "14px", flex: 1 }}
                  size="large"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                />
                <Button size="large" disabled style={{ fontSize: "14px" }}>₫</Button>
              </Compact>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label={<span style={{ fontSize: "14px" }}> </span>}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddCustomItem}
                loading={loadingPrice}
                style={{ width: "100%", background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
                size="large"
              >
                Add to Quotation
              </Button>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
              <Button onClick={handleCancel} style={{ fontSize: "14px" }}>
                Cancel
              </Button>
            </div>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
