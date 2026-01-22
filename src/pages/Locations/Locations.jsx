import React, { useState, useEffect } from "react";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  Upload,
  message,
  Tabs,
  Pagination,
  Spin,
  Switch,
} from "antd";
import {
  getLocations,
  getLocationById,
  createLocation,
  getLocationsByBuilding,
  getAvailableLocations,
  updateLocation,
  deleteLocation,
  toggleLocation,
} from "../../services/locations.api";
import {
  getExternalLocations,
  createExternalLocation,
  updateExternalLocation,
  deleteExternalLocation,
} from "../../services/externalLocations.api";
import authService from "../../services/authService";

const { Option } = Select;
const { TabPane } = Tabs;

const Locations = () => {
  const user = authService.getCurrentUser();
  const roleId = user?.roleId ? Number(user.roleId) : null;
  const roleName = user?.roleName || "";
  // Event Manager chỉ được xem, không được sửa
  const isEventManager = roleId === 3 || roleName === "Event Manager";
  
  // Debug: Log user info
  useEffect(() => {
    console.log("🔍 Locations - User info:", {
      userId: user?.userId,
      roleId: roleId,
      roleIdType: typeof roleId,
      roleName: roleName,
      isEventManager: isEventManager,
      fullUser: user
    });
  }, [user, roleId, roleName, isEventManager]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [externalLocations, setExternalLocations] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [externalPagination, setExternalPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all"); // all | active | inactive
  const [sortBy, setSortBy] = useState("Name");
  const [sortDescending, setSortDescending] = useState(false);

  const [externalSearchText, setExternalSearchText] = useState("");
  const [minCost, setMinCost] = useState(null);
  const [maxCost, setMaxCost] = useState(null);
  const [externalSortBy, setExternalSortBy] = useState("Name");
  const [externalSortDescending, setExternalSortDescending] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExternalEditModal, setShowExternalEditModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingExternalLocation, setEditingExternalLocation] = useState(null);
  const [form] = Form.useForm();
  const [externalForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [externalEditForm] = Form.useForm();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState("internal");

  // Load locations
  const loadLocations = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getLocations({
        page,
        pageSize,
        search: searchText || undefined,
        building: buildingFilter !== "all" ? buildingFilter : undefined,
        isActive:
          isActiveFilter === "all"
            ? undefined
            : isActiveFilter === "active",
        sortBy,
        sortDescending,
      });

      if (response && response.data) {
        setLocations(response.data);
        setPagination({
          current: response.page || page,
          pageSize: response.pageSize || pageSize,
          total: response.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      message.error("Unable to load locations list");
    } finally {
      setLoading(false);
    }
  };

  // Load external locations
  const loadExternalLocations = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getExternalLocations({
        page,
        pageSize,
        search: externalSearchText || undefined,
        minCost: minCost ?? undefined,
        maxCost: maxCost ?? undefined,
        sortBy: externalSortBy,
        sortDescending: externalSortDescending,
      });

      if (response && response.data) {
        setExternalLocations(response.data);
        setExternalPagination({
          current: response.page || page,
          pageSize: response.pageSize || pageSize,
          total: response.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error("Error loading external locations:", error);
      message.error("Unable to load external locations list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "internal") {
      loadLocations();
    } else {
      loadExternalLocations();
    }
  }, [activeTab]);

  // Reload when filters/sort change
  useEffect(() => {
    if (activeTab === "internal") {
      loadLocations(1, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, buildingFilter, isActiveFilter, sortBy, sortDescending]);

  useEffect(() => {
    if (activeTab === "external") {
      loadExternalLocations(1, externalPagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSearchText, minCost, maxCost, externalSortBy, externalSortDescending]);

  // Upload image to Cloudinary
  const uploadImage = async (file) => {
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      message.warning("Cloudinary is not configured");
      return "null";
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "fptsphere/locations");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", () => {
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error("Upload failed"));
          }
        } catch {
          reject(new Error("Upload failed"));
        } finally {
          setUploadingImage(false);
        }
      });
      xhr.addEventListener("error", () => {
        setUploadingImage(false);
        reject(new Error("Network error"));
      });
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  // Handle create location
  const handleCreateLocation = async (values) => {
    try {
      setLoading(true);
      let imageUrl = "null";

      // Upload image if provided
      if (values.image && values.image.fileList && values.image.fileList.length > 0) {
        const file = values.image.fileList[0].originFileObj;
        if (file) {
          imageUrl = await uploadImage(file);
        }
      }

      const locationData = {
        name: values.name,
        capacity: values.capacity,
        building: values.building,
        roomNumber: values.roomNumber,
        imageUrl: imageUrl,
      };

      await createLocation(locationData);
      message.success("Location created successfully");
      setShowCreateModal(false);
      form.resetFields();
      loadLocations();
    } catch (error) {
      console.error("Error creating location:", error);
      message.error(error.message || "Unable to create location");
    } finally {
      setLoading(false);
    }
  };

  // Handle create external location
  const handleCreateExternalLocation = async (values) => {
    try {
      setLoading(true);
      let imageUrl = "null";

      // Upload image if provided
      if (values.image && values.image.fileList && values.image.fileList.length > 0) {
        const file = values.image.fileList[0].originFileObj;
        if (file) {
          imageUrl = await uploadImage(file);
        }
      }

      const locationData = {
        name: values.name,
        address: values.address,
        contactPerson: values.contactPerson || "",
        contactPhone: values.contactPhone || "",
        cost: values.cost || 0,
        note: values.note || "",
        imageUrl: imageUrl,
      };

      await createExternalLocation(locationData);
      message.success("External location created successfully");
      setShowExternalModal(false);
      externalForm.resetFields();
      loadExternalLocations();
    } catch (error) {
      console.error("Error creating external location:", error);
      message.error(error.message || "Unable to create external location");
    } finally {
      setLoading(false);
    }
  };

  // Get unique buildings
  const uniqueBuildings = React.useMemo(() => {
    return [...new Set(locations.map((loc) => loc.building).filter(Boolean))];
  }, [locations]);

  const openEditLocation = async (record) => {
    try {
      if (!record?.locationId) return;
      setLoading(true);
      const loc = await getLocationById(record.locationId);
      setEditingLocation(loc);
      editForm.setFieldsValue({
        name: loc.name,
        building: loc.building,
        roomNumber: loc.roomNumber,
        capacity: loc.capacity,
        image: undefined,
      });
      setShowEditModal(true);
    } catch (e) {
      message.error(e.message || "Unable to load location information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (values) => {
    try {
      if (!editingLocation?.locationId) return;
      setLoading(true);

      let imageUrl = editingLocation.imageUrl || "null";
      if (values.image && values.image.fileList && values.image.fileList.length > 0) {
        const file = values.image.fileList[0].originFileObj;
        if (file) imageUrl = await uploadImage(file);
      }

      const payload = {
        name: values.name,
        capacity: values.capacity,
        building: values.building || null,
        roomNumber: values.roomNumber || null,
        imageUrl,
      };

      await updateLocation(editingLocation.locationId, payload);
      message.success("Location updated successfully");
      setShowEditModal(false);
      setEditingLocation(null);
      editForm.resetFields();
      loadLocations(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e.message || "Unable to update location");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteLocation = (record) => {
    Modal.confirm({
      title: "Delete Location",
      content: `Are you sure you want to delete "${record?.name}"? This action cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          await deleteLocation(record.locationId);
          message.success("Location deleted successfully");
          loadLocations(1, pagination.pageSize);
        } catch (e) {
          message.error(e.message || "Unable to delete location");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const confirmToggleLocation = (record) => {
    Modal.confirm({
      title: record?.isActive ? "Deactivate Location" : "Activate Location",
      content: `Are you sure you want to ${
        record?.isActive ? "deactivate" : "activate"
      } "${record?.name}"?`,
      okText: record?.isActive ? "Deactivate" : "Activate",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          await toggleLocation(record.locationId);
          message.success("Status updated successfully");
          loadLocations(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error(e.message || "Unable to update status");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const openEditExternalLocation = (record) => {
    setEditingExternalLocation(record);
    externalEditForm.setFieldsValue({
      name: record.name,
      address: record.address,
      contactPerson: record.contactPerson,
      contactPhone: record.contactPhone,
      cost: record.cost,
      note: record.note,
      image: undefined,
    });
    setShowExternalEditModal(true);
  };

  const handleUpdateExternalLocation = async (values) => {
    try {
      if (!editingExternalLocation?.externalLocationId) return;
      setLoading(true);

      let imageUrl = editingExternalLocation.imageUrl || "null";
      if (values.image && values.image.fileList && values.image.fileList.length > 0) {
        const file = values.image.fileList[0].originFileObj;
        if (file) imageUrl = await uploadImage(file);
      }

      const payload = {
        name: values.name,
        address: values.address,
        contactPerson: values.contactPerson || "",
        contactPhone: values.contactPhone || "",
        cost: values.cost ?? 0,
        note: values.note || "",
        imageUrl,
      };

      await updateExternalLocation(editingExternalLocation.externalLocationId, payload);
      message.success("External location updated successfully");
      setShowExternalEditModal(false);
      setEditingExternalLocation(null);
      externalEditForm.resetFields();
      loadExternalLocations(externalPagination.current, externalPagination.pageSize);
    } catch (e) {
      message.error(e.message || "Unable to update external location");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteExternalLocation = (record) => {
    Modal.confirm({
      title: "Delete External Location",
      content: `Are you sure you want to delete "${record?.name}"? This action cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setLoading(true);
          await deleteExternalLocation(record.externalLocationId);
          message.success("External location deleted successfully");
          loadExternalLocations(1, externalPagination.pageSize);
        } catch (e) {
          message.error(e.message || "Unable to delete external location");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Internal locations columns
  const internalColumns = [
    {
      title: "Location Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-gray-500 text-sm">{record.roomNumber}</div>
        </div>
      ),
    },
    {
      title: "Building",
      dataIndex: "building",
      key: "building",
      render: (text) => <Tag icon={<HomeOutlined />}>{text}</Tag>,
    },
    {
      title: "Capacity",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) => `${capacity?.toLocaleString() || 0} people`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => {
        if (isEventManager) {
          return <span className="text-gray-400 text-sm">View only</span>;
        }
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                openEditLocation(record);
              }}
            >
              Edit
            </Button>
            <Button
              type="link"
              icon={<SwapOutlined />}
              onClick={() => confirmToggleLocation(record)}
            >
              {record.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDeleteLocation(record)}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  // External locations columns
  const externalColumns = [
    {
      title: "Location Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Contact Person",
      dataIndex: "contactPerson",
      key: "contactPerson",
    },
    {
      title: "Phone Number",
      dataIndex: "contactPhone",
      key: "contactPhone",
    },
    {
      title: "Cost",
      dataIndex: "cost",
      key: "cost",
      render: (cost) => cost ? `${cost.toLocaleString()} VNĐ` : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => {
        if (isEventManager) {
          return <span className="text-gray-400 text-sm">View only</span>;
        }
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditExternalLocation(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDeleteExternalLocation(record)}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600 mt-1">Manage internal and external locations</p>
        </div>
        {/* Admin/Director có thể tạo cả internal & external; Event Manager chỉ được tạo external */}
        {((!isEventManager && roleId !== 4) || (isEventManager && activeTab === "external")) && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (activeTab === "internal") {
                setShowCreateModal(true);
              } else {
                setShowExternalModal(true);
              }
            }}
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            {activeTab === "internal" ? "Add Location" : "Add External Location"}
          </Button>
        )}
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Internal Locations" key="internal">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Input
                placeholder="Search locations..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                placeholder="Filter by building"
                value={buildingFilter}
                onChange={setBuildingFilter}
                style={{ width: 200 }}
              >
                <Option value="all">All Buildings</Option>
                {uniqueBuildings.map((building) => (
                  <Option key={building} value={building}>
                    {building}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Filter by status"
                value={isActiveFilter}
                onChange={setIsActiveFilter}
                style={{ width: 180 }}
              >
                <Option value="all">All</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 180 }}
              >
                <Option value="Name">Sort by: Name</Option>
                <Option value="Capacity">Sort by: Capacity</Option>
                <Option value="Building">Sort by: Building</Option>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Descending</span>
                <Switch checked={sortDescending} onChange={setSortDescending} />
              </div>
            </div>

            <Table
              columns={internalColumns}
              dataSource={locations}
              loading={loading}
              rowKey="locationId"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} locations`,
                onChange: (page, pageSize) => {
                  loadLocations(page, pageSize);
                },
              }}
            />
          </TabPane>

          <TabPane tab="External Locations" key="external">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Input
                placeholder="Search locations..."
                prefix={<SearchOutlined />}
                value={externalSearchText}
                onChange={(e) => setExternalSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <InputNumber
                placeholder="Min cost"
                value={minCost}
                onChange={setMinCost}
                style={{ width: 160 }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
              <InputNumber
                placeholder="Max cost"
                value={maxCost}
                onChange={setMaxCost}
                style={{ width: 160 }}
                min={0}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              />
              <Select
                value={externalSortBy}
                onChange={setExternalSortBy}
                style={{ width: 180 }}
              >
                <Option value="Name">Sort by: Name</Option>
                <Option value="Cost">Sort by: Cost</Option>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Descending</span>
                <Switch
                  checked={externalSortDescending}
                  onChange={setExternalSortDescending}
                />
              </div>
            </div>
            <Table
              columns={externalColumns}
              dataSource={externalLocations}
              loading={loading}
              rowKey="externalLocationId"
              pagination={{
                current: externalPagination.current,
                pageSize: externalPagination.pageSize,
                total: externalPagination.total,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} locations`,
                onChange: (page, pageSize) => {
                  loadExternalLocations(page, pageSize);
                },
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create Internal Location Modal */}
      <Modal
        title="Add New Location"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLocation}
        >
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input placeholder="E.g: Room AL-404" />
          </Form.Item>

          <Form.Item
            name="building"
            label="Building"
            rules={[{ required: true, message: "Please enter building" }]}
          >
            <Input placeholder="E.g: ALPHA" />
          </Form.Item>

          <Form.Item
            name="roomNumber"
            label="Room Number"
            rules={[{ required: true, message: "Please enter room number" }]}
          >
            <Input placeholder="E.g: AL-404" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[
              { required: true, message: "Please enter capacity" },
              { type: "number", min: 1, message: "Capacity must be greater than 0" },
            ]}
          >
            <InputNumber
              placeholder="E.g: 50"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>

          <Form.Item name="image" label="Image">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || uploadingImage}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Create Location
              </Button>
              <Button onClick={() => {
                setShowCreateModal(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create External Location Modal */}
      <Modal
        title="Add External Location"
        open={showExternalModal}
        onCancel={() => {
          setShowExternalModal(false);
          externalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={externalForm}
          layout="vertical"
          onFinish={handleCreateExternalLocation}
        >
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input placeholder="E.g: National Convention Center" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea rows={2} placeholder="Detailed address" />
          </Form.Item>

          <Form.Item name="contactPerson" label="Contact Person">
            <Input placeholder="Contact person name" />
          </Form.Item>

          <Form.Item name="contactPhone" label="Phone Number">
            <Input placeholder="Contact phone number" />
          </Form.Item>

          <Form.Item name="cost" label="Cost (VND)">
            <InputNumber
              placeholder="Rental cost"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>

          <Form.Item name="image" label="Image">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || uploadingImage}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Create Location
              </Button>
              <Button onClick={() => {
                setShowExternalModal(false);
                externalForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Internal Location Modal */}
      <Modal
        title="Edit Location"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingLocation(null);
          editForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateLocation}>
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="building" label="Building">
            <Input />
          </Form.Item>

          <Form.Item name="roomNumber" label="Room Number">
            <Input />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ type: "number", min: 1, message: "Capacity must be greater than 0" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>

          <Form.Item name="image" label="Image">
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || uploadingImage}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLocation(null);
                  editForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit External Location Modal */}
      <Modal
        title="Edit External Location"
        open={showExternalEditModal}
        onCancel={() => {
          setShowExternalEditModal(false);
          setEditingExternalLocation(null);
          externalEditForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={externalEditForm}
          layout="vertical"
          onFinish={handleUpdateExternalLocation}
        >
          <Form.Item
            name="name"
            label="Location Name"
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter address" }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="contactPerson" label="Contact Person">
            <Input />
          </Form.Item>

          <Form.Item name="contactPhone" label="Phone Number">
            <Input />
          </Form.Item>

          <Form.Item name="cost" label="Cost (VND)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="image" label="Image">
            <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading || uploadingImage}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setShowExternalEditModal(false);
                  setEditingExternalLocation(null);
                  externalEditForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Locations;
