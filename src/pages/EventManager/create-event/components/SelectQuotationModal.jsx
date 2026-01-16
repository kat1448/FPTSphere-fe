// src/pages/EventManager/create-event/components/SelectQuotationModal.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Input,
  Button,
  Space,
  Card,
  Typography,
  message,
  Tabs,
  Tag,
  InputNumber,
  Select,
} from "antd";
const { Compact } = Space;
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import apiClient, { API_ENDPOINTS } from "../../../../services/api.js";
import { getPriceFromChatGPT } from "../../../../services/chatgpt.service.js";
import dayjs from "dayjs";
import "./SelectQuotationModal.css";

const { Text } = Typography;
const { Option } = Select;

// Sample data with real images and categories (fallback when API is not available)
const fallbackDeviceCategories = {
  "Audio/Video Equipment": [
    {
      id: 1,
      name: "Projector 4K",
      stock: 8,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 2,
      name: "Portable Speaker",
      stock: 5,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 3,
      name: "Microphone Set",
      stock: 12,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 4,
      name: "LED Display Screen",
      stock: 3,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 5,
      name: "Video Camera",
      stock: 6,
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244b32a?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 6,
      name: "Sound System",
      stock: 10,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 7,
      name: "Wireless Microphone",
      stock: 15,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 8,
      name: "Projector Screen",
      stock: 20,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 9,
      name: "HDMI Cable Set",
      stock: 50,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
    {
      id: 10,
      name: "Audio Mixer",
      stock: 7,
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
      category: "Audio/Video Equipment",
    },
  ],
  "Computer Equipment": [
    {
      id: 11,
      name: "MacBook Pro",
      stock: 20,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 12,
      name: "Dell Laptop",
      stock: 15,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 13,
      name: "HP Desktop",
      stock: 8,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 14,
      name: "iPad Pro",
      stock: 12,
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 15,
      name: "Surface Pro",
      stock: 10,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 16,
      name: "Gaming PC",
      stock: 5,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 17,
      name: "Monitor 27 inch",
      stock: 25,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 18,
      name: "Keyboard & Mouse Set",
      stock: 30,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 19,
      name: "USB Hub",
      stock: 40,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
    {
      id: 20,
      name: "External Hard Drive",
      stock: 18,
      image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop",
      category: "Computer Equipment",
    },
  ],
  "Furniture": [
    {
      id: 21,
      name: "Conference Table",
      stock: 10,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 22,
      name: "Office Chair",
      stock: 25,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 23,
      name: "Folding Table",
      stock: 15,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 24,
      name: "Whiteboard",
      stock: 20,
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 25,
      name: "Flip Chart Stand",
      stock: 12,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 26,
      name: "Podium",
      stock: 8,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 27,
      name: "Bar Stool",
      stock: 30,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 28,
      name: "Folding Chair",
      stock: 50,
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 29,
      name: "Display Stand",
      stock: 15,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
    {
      id: 30,
      name: "Storage Cabinet",
      stock: 6,
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
      category: "Furniture",
    },
  ],
  "Lighting": [
    {
      id: 31,
      name: "LED Panel Light",
      stock: 20,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 32,
      name: "Spotlight",
      stock: 15,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 33,
      name: "Stage Lighting Kit",
      stock: 5,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 34,
      name: "LED Strip Light",
      stock: 30,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 35,
      name: "Portable Light",
      stock: 18,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 36,
      name: "Ring Light",
      stock: 12,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 37,
      name: "Flood Light",
      stock: 8,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 38,
      name: "LED Bulb Set",
      stock: 40,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 39,
      name: "Light Stand",
      stock: 25,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
    {
      id: 40,
      name: "Color Changing Light",
      stock: 10,
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop",
      category: "Lighting",
    },
  ],
};

export default function SelectQuotationModal({
  open,
  onCancel,
  onAddItem,
  startTime,
  endTime,
}) {
  // Resources grouped by category/type
  const [resourceCategories, setResourceCategories] = useState(
    fallbackDeviceCategories
  );
  const [resourceTab, setResourceTab] = useState("Audio/Video Equipment");
  const [resourceSearch, setResourceSearch] = useState("");
  const [deviceQuantities, setDeviceQuantities] = useState({});
  const [deviceRentalUnits, setDeviceRentalUnits] = useState({});
  const [devicePrices, setDevicePrices] = useState({});
  const [loadingPrice, setLoadingPrice] = useState({});

  // Load resources from API when modal opens
  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.RESOURCES, {
          params: {
            page: 1,
            pageSize: 100,
          },
        });

        if (res.data?.success && res.data?.data?.data) {
          const apiResources = res.data.data.data;

          // Group resources by type/category to build tabs
          const grouped = apiResources.reduce((acc, r) => {
            const category = r.type || "Other";
            if (!acc[category]) acc[category] = [];
            acc[category].push({
              id: r.resourceId,
              name: r.name,
              stock: r.quantity,
              image:
                r.imageUrl ||
                "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=400&h=300&fit=crop",
              category,
            });
            return acc;
          }, {});

          // If API returns empty list, keep fallback data
          if (Object.keys(grouped).length > 0) {
            setResourceCategories(grouped);

            // Ensure current tab key exists, otherwise pick first category
            const categories = Object.keys(grouped);
            if (!categories.includes(resourceTab)) {
              setResourceTab(categories[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading resources:", error);
        message.error("Không tải được danh sách vật tư, dùng dữ liệu mẫu tạm thời");
        // Keep fallback data
      }
    };

    if (open) {
      loadResources();
    }
  }, [open, resourceTab]);

  // Reset quantities and rental units when modal opens or category changes
  useEffect(() => {
    if (!open) {
      // Reset when modal closes
      setDeviceQuantities({});
      setDeviceRentalUnits({});
      setDevicePrices({});
      setResourceSearch("");
      return;
    }

    const devices = resourceCategories[resourceTab] || [];
    const initialQuantities = {};
    const initialRentalUnits = {};
    const initialPrices = {};

    devices.forEach((device) => {
      initialQuantities[device.id] = deviceQuantities[device.id] ?? 1;
      initialRentalUnits[device.id] = deviceRentalUnits[device.id] ?? "day";
      initialPrices[device.id] = devicePrices[device.id] ?? null;
    });

    setDeviceQuantities(initialQuantities);
    setDeviceRentalUnits(initialRentalUnits);
    setDevicePrices(initialPrices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resourceTab, resourceCategories]);

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

  const handleAddDevice = async (device) => {
    try {
      const qty = deviceQuantities[device.id] || 1;
      const rentalUnit = deviceRentalUnits[device.id] || "day";
      let basePrice = devicePrices[device.id];

      // If price not fetched yet, fetch it
      if (!basePrice) {
        setLoadingPrice((prev) => ({ ...prev, [device.id]: true }));
        try {
          basePrice = await getPriceFromChatGPT(device.name, "Rental price per day in VND");
          setDevicePrices((prev) => ({
            ...prev,
            [device.id]: basePrice,
          }));
        } catch (error) {
          console.error("Error fetching price:", error);
          message.error("Failed to fetch price");
          return;
        } finally {
          setLoadingPrice((prev) => ({ ...prev, [device.id]: false }));
        }
      }

      // Calculate price based on rental unit
      const finalPrice = calculatePrice(basePrice, rentalUnit);

      const newItem = {
        id: Date.now(),
        itemDescription: device.name,
        quantity: qty,
        unitPrice: finalPrice,
        basePrice: basePrice, // Store base price (per day)
        rentalUnit: rentalUnit,
        resourceId: device.id,
        resourceType: "device",
        category: device.category,
      };

      onAddItem(newItem);
      message.success(`${device.name} added to quotation`);
    } catch (error) {
      console.error("Error adding device:", error);
      message.error("Failed to add device");
    }
  };

  const handleRentalUnitChange = (deviceId, newUnit) => {
    setDeviceRentalUnits((prev) => ({
      ...prev,
      [deviceId]: newUnit,
    }));
  };

  // Fetch base price (per day) when user focuses on price input
  const handlePriceFocus = async (deviceId) => {
    if (!devicePrices[deviceId] || devicePrices[deviceId] === 0) {
      const devices = resourceCategories[resourceTab] || [];
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        setLoadingPrice((prev) => ({ ...prev, [deviceId]: true }));
        try {
          const basePrice = await getPriceFromChatGPT(device.name, "Rental price per day in VND");
          setDevicePrices((prev) => ({
            ...prev,
            [deviceId]: basePrice, // Store base price
          }));
        } catch (error) {
          console.error("Error fetching price:", error);
          message.error("Failed to fetch price");
        } finally {
          setLoadingPrice((prev) => ({ ...prev, [deviceId]: false }));
        }
      }
    }
  };


  const getStockColor = (stock) => {
    if (stock >= 15) return "green";
    if (stock >= 8) return "orange";
    return "red";
  };

  // Create category tabs with children - memoized to prevent unnecessary re-renders
  const categoryTabs = useMemo(() => {
    return Object.keys(resourceCategories).map((category) => {
      // Get devices for this category
      const categoryDevices = resourceCategories[category] || [];
      const categoryFilteredDevices = !resourceSearch.trim()
        ? categoryDevices
        : categoryDevices.filter((d) =>
            d.name.toLowerCase().includes(resourceSearch.toLowerCase())
          );

      return {
        key: category,
        label: category,
        children: (
          <div className="quotation-tab-content">
            <div className="devices-grid-container">
              <div className="devices-grid">
                {categoryFilteredDevices.length === 0 ? (
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#999" }}>
                    <Text type="secondary">No devices found</Text>
                  </div>
                ) : (
                  categoryFilteredDevices.map((device) => {
                    const basePrice = devicePrices[device.id] || 0;
                    const rentalUnit = deviceRentalUnits[device.id] || "day";
                    const displayPrice = basePrice ? calculatePrice(basePrice, rentalUnit) : 0;

                    return (
                      <Card
                        key={device.id}
                        hoverable
                        className="device-card"
                        cover={
                          <div
                            className="device-image"
                            style={{
                              backgroundImage: `url(${device.image})`,
                            }}
                          />
                        }
                      >
                        <Card.Meta
                          title={<Text strong style={{ fontSize: "14px" }}>{device.name}</Text>}
                          description={
                            <Space orientation="vertical" style={{ width: "100%" }} size="small">
                              <Tag color={getStockColor(device.stock)} style={{ fontSize: "12px" }}>
                                Stock: {device.stock}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                Reserve by time to check live availability
                              </Text>
                              
                              {/* Rental Unit Selection */}
                              <div className="rental-unit-section">
                                <Text style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                                  Rental Unit:
                                </Text>
                                <Select
                                  value={rentalUnit}
                                  onChange={(val) => handleRentalUnitChange(device.id, val)}
                                  style={{ width: "100%", fontSize: "12px" }}
                                  size="small"
                                >
                                  <Option value="hour">Per Hour</Option>
                                  <Option value="day">Per Day</Option>
                                  <Option value="week">Per Week</Option>
                                </Select>
                              </div>

                              {/* Price Display/Edit */}
                              <div className="price-section">
                                <Text style={{ fontSize: "12px", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                                  Price ({rentalUnit}):
                                </Text>
                                <Compact style={{ width: "100%" }}>
                                <InputNumber
                                  min={0}
                                  value={displayPrice}
                                  onChange={(val) => {
                                    if (val === null || val === undefined) return;
                                    // When user manually changes price, we need to convert back to base price
                                    const currentRentalUnit = deviceRentalUnits[device.id] || "day";
                                    let newBasePrice = val;
                                    if (currentRentalUnit === "hour") {
                                      newBasePrice = val * 8;
                                    } else if (currentRentalUnit === "week") {
                                      newBasePrice = val / 5;
                                    }
                                    setDevicePrices((prev) => ({
                                      ...prev,
                                      [device.id]: newBasePrice,
                                    }));
                                  }}
                                  onFocus={() => handlePriceFocus(device.id)}
                                  formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : ""}
                                  parser={(value) => value ? value.replace(/\$\s?|(,*)/g, "") : ""}
                                  style={{ width: "100%", fontSize: "12px", flex: 1 }}
                                  size="small"
                                  placeholder="Click to get price"
                                />
                                  <Button size="small" disabled style={{ fontSize: "12px" }}>₫</Button>
                                </Compact>
                              </div>

                              {/* Quantity and Add Button */}
                              <Space style={{ width: "100%", marginTop: "8px" }}>
                                  <InputNumber
                                    min={1}
                                    max={device.stock}
                                    value={deviceQuantities[device.id] || 1}
                                    onChange={(val) =>
                                      setDeviceQuantities((prev) => ({ ...prev, [device.id]: val || 1 }))
                                    }
                                  style={{ width: "80px", fontSize: "12px" }}
                                  size="small"
                                  placeholder="Qty"
                                />
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => handleAddDevice(device)}
                                  loading={loadingPrice[device.id]}
                                  style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "12px", flex: 1 }}
                                >
                                  Add
                                </Button>
                              </Space>
                            </Space>
                          }
                        />
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceCategories, resourceSearch, devicePrices, deviceRentalUnits, deviceQuantities, loadingPrice]);

  return (
    <Modal
      title="Select Resource for Quotation"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      centered
      className="select-quotation-modal"
      styles={{
        body: {
          maxHeight: "75vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0",
        },
      }}
    >
      <div className="quotation-modal-content">
        <div style={{ marginBottom: "16px" }}>
          <Input
            placeholder="Search name/code"
            prefix={<SearchOutlined />}
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            style={{ fontSize: "14px" }}
            size="large"
          />
        </div>
        
        {/* Time Information */}
        {(startTime || endTime) && (
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            marginBottom: "12px",
            padding: "8px 0",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              Start Time: {startTime ? dayjs(startTime).format("MMM DD, YYYY hh:mm A") : "N/A"}
            </Text>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              End Time: {endTime ? dayjs(endTime).format("MMM DD, YYYY hh:mm A") : "N/A"}
            </Text>
          </div>
        )}
        
        <Tabs
          activeKey={resourceTab}
          onChange={setResourceTab}
          items={categoryTabs}
          destroyInactiveTabPane={true}
        />

        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "12px", flexShrink: 0 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={onCancel} style={{ fontSize: "14px" }}>
              Cancel
            </Button>
            <Text type="secondary" style={{ fontSize: "14px" }}>
              Select items to add to quotation
            </Text>
          </Space>
        </div>
      </div>
    </Modal>
  );
}
