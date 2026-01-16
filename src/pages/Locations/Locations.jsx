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
      message.error("Không thể tải danh sách địa điểm");
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
      message.error("Không thể tải danh sách địa điểm bên ngoài");
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
      message.warning("Cloudinary chưa được cấu hình");
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
      message.success("Tạo địa điểm thành công");
      setShowCreateModal(false);
      form.resetFields();
      loadLocations();
    } catch (error) {
      console.error("Error creating location:", error);
      message.error(error.message || "Không thể tạo địa điểm");
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
      message.success("Tạo địa điểm bên ngoài thành công");
      setShowExternalModal(false);
      externalForm.resetFields();
      loadExternalLocations();
    } catch (error) {
      console.error("Error creating external location:", error);
      message.error(error.message || "Không thể tạo địa điểm bên ngoài");
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
      message.error(e.message || "Không thể tải thông tin địa điểm");
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
      message.success("Cập nhật địa điểm thành công");
      setShowEditModal(false);
      setEditingLocation(null);
      editForm.resetFields();
      loadLocations(pagination.current, pagination.pageSize);
    } catch (e) {
      message.error(e.message || "Không thể cập nhật địa điểm");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteLocation = (record) => {
    Modal.confirm({
      title: "Xóa địa điểm",
      content: `Bạn chắc chắn muốn xóa "${record?.name}"? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await deleteLocation(record.locationId);
          message.success("Đã xóa địa điểm");
          loadLocations(1, pagination.pageSize);
        } catch (e) {
          message.error(e.message || "Không thể xóa địa điểm");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const confirmToggleLocation = (record) => {
    Modal.confirm({
      title: record?.isActive ? "Tắt địa điểm" : "Bật địa điểm",
      content: `Bạn chắc chắn muốn ${
        record?.isActive ? "tắt" : "bật"
      } "${record?.name}"?`,
      okText: record?.isActive ? "Tắt" : "Bật",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await toggleLocation(record.locationId);
          message.success("Đã cập nhật trạng thái");
          loadLocations(pagination.current, pagination.pageSize);
        } catch (e) {
          message.error(e.message || "Không thể cập nhật trạng thái");
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
      message.success("Cập nhật địa điểm bên ngoài thành công");
      setShowExternalEditModal(false);
      setEditingExternalLocation(null);
      externalEditForm.resetFields();
      loadExternalLocations(externalPagination.current, externalPagination.pageSize);
    } catch (e) {
      message.error(e.message || "Không thể cập nhật địa điểm bên ngoài");
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteExternalLocation = (record) => {
    Modal.confirm({
      title: "Xóa địa điểm bên ngoài",
      content: `Bạn chắc chắn muốn xóa "${record?.name}"? Hành động này không thể hoàn tác.`,
      okText: "Xóa",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await deleteExternalLocation(record.externalLocationId);
          message.success("Đã xóa địa điểm bên ngoài");
          loadExternalLocations(1, externalPagination.pageSize);
        } catch (e) {
          message.error(e.message || "Không thể xóa địa điểm bên ngoài");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Internal locations columns
  const internalColumns = [
    {
      title: "Tên địa điểm",
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
      title: "Tòa nhà",
      dataIndex: "building",
      key: "building",
      render: (text) => <Tag icon={<HomeOutlined />}>{text}</Tag>,
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity) => `${capacity?.toLocaleString() || 0} người`,
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      render: (_, record) => {
        if (isEventManager) {
          return <span className="text-gray-400 text-sm">Chỉ xem</span>;
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
              Sửa
            </Button>
            <Button
              type="link"
              icon={<SwapOutlined />}
              onClick={() => confirmToggleLocation(record)}
            >
              {record.isActive ? "Tắt" : "Bật"}
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDeleteLocation(record)}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  // External locations columns
  const externalColumns = [
    {
      title: "Tên địa điểm",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Người liên hệ",
      dataIndex: "contactPerson",
      key: "contactPerson",
    },
    {
      title: "Số điện thoại",
      dataIndex: "contactPhone",
      key: "contactPhone",
    },
    {
      title: "Chi phí",
      dataIndex: "cost",
      key: "cost",
      render: (cost) => cost ? `${cost.toLocaleString()} VNĐ` : "-",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_, record) => {
        if (isEventManager) {
          return <span className="text-gray-400 text-sm">Chỉ xem</span>;
        }
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditExternalLocation(record)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmDeleteExternalLocation(record)}
            >
              Xóa
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-gray-600 mt-1">Quản lý địa điểm nội bộ và bên ngoài</p>
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
            {activeTab === "internal" ? "Thêm địa điểm" : "Thêm địa điểm bên ngoài"}
          </Button>
        )}
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Địa điểm nội bộ" key="internal">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Input
                placeholder="Tìm kiếm địa điểm..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Select
                placeholder="Lọc theo tòa nhà"
                value={buildingFilter}
                onChange={setBuildingFilter}
                style={{ width: 200 }}
              >
                <Option value="all">Tất cả tòa nhà</Option>
                {uniqueBuildings.map((building) => (
                  <Option key={building} value={building}>
                    {building}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Lọc trạng thái"
                value={isActiveFilter}
                onChange={setIsActiveFilter}
                style={{ width: 180 }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Không hoạt động</Option>
              </Select>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 180 }}
              >
                <Option value="Name">Sắp xếp: Tên</Option>
                <Option value="Capacity">Sắp xếp: Sức chứa</Option>
                <Option value="Building">Sắp xếp: Tòa nhà</Option>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Giảm dần</span>
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
                showTotal: (total) => `Tổng ${total} địa điểm`,
                onChange: (page, pageSize) => {
                  loadLocations(page, pageSize);
                },
              }}
            />
          </TabPane>

          <TabPane tab="Địa điểm bên ngoài" key="external">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Input
                placeholder="Tìm kiếm địa điểm..."
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
                <Option value="Name">Sắp xếp: Tên</Option>
                <Option value="Cost">Sắp xếp: Chi phí</Option>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Giảm dần</span>
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
                showTotal: (total) => `Tổng ${total} địa điểm`,
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
        title="Thêm địa điểm mới"
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
            label="Tên địa điểm"
            rules={[{ required: true, message: "Vui lòng nhập tên địa điểm" }]}
          >
            <Input placeholder="VD: Phòng AL-404" />
          </Form.Item>

          <Form.Item
            name="building"
            label="Tòa nhà"
            rules={[{ required: true, message: "Vui lòng nhập tòa nhà" }]}
          >
            <Input placeholder="VD: ALPHA" />
          </Form.Item>

          <Form.Item
            name="roomNumber"
            label="Số phòng"
            rules={[{ required: true, message: "Vui lòng nhập số phòng" }]}
          >
            <Input placeholder="VD: AL-404" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Sức chứa"
            rules={[
              { required: true, message: "Vui lòng nhập sức chứa" },
              { type: "number", min: 1, message: "Sức chứa phải lớn hơn 0" },
            ]}
          >
            <InputNumber
              placeholder="VD: 50"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>

          <Form.Item name="image" label="Hình ảnh">
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
                Tạo địa điểm
              </Button>
              <Button onClick={() => {
                setShowCreateModal(false);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create External Location Modal */}
      <Modal
        title="Thêm địa điểm bên ngoài"
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
            label="Tên địa điểm"
            rules={[{ required: true, message: "Vui lòng nhập tên địa điểm" }]}
          >
            <Input placeholder="VD: Trung tâm Hội nghị Quốc gia" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input.TextArea rows={2} placeholder="Địa chỉ chi tiết" />
          </Form.Item>

          <Form.Item name="contactPerson" label="Người liên hệ">
            <Input placeholder="Tên người liên hệ" />
          </Form.Item>

          <Form.Item name="contactPhone" label="Số điện thoại">
            <Input placeholder="Số điện thoại liên hệ" />
          </Form.Item>

          <Form.Item name="cost" label="Chi phí (VNĐ)">
            <InputNumber
              placeholder="Chi phí thuê"
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú thêm" />
          </Form.Item>

          <Form.Item name="image" label="Hình ảnh">
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
                Tạo địa điểm
              </Button>
              <Button onClick={() => {
                setShowExternalModal(false);
                externalForm.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Internal Location Modal */}
      <Modal
        title="Chỉnh sửa địa điểm"
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
            label="Tên địa điểm"
            rules={[{ required: true, message: "Vui lòng nhập tên địa điểm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="building" label="Tòa nhà">
            <Input />
          </Form.Item>

          <Form.Item name="roomNumber" label="Số phòng">
            <Input />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Sức chứa"
            rules={[{ type: "number", min: 1, message: "Sức chứa phải lớn hơn 0" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>

          <Form.Item name="image" label="Hình ảnh">
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
                Lưu
              </Button>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingLocation(null);
                  editForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit External Location Modal */}
      <Modal
        title="Chỉnh sửa địa điểm bên ngoài"
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
            label="Tên địa điểm"
            rules={[{ required: true, message: "Vui lòng nhập tên địa điểm" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="contactPerson" label="Người liên hệ">
            <Input />
          </Form.Item>

          <Form.Item name="contactPhone" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item name="cost" label="Chi phí (VNĐ)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            />
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="image" label="Hình ảnh">
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
                Lưu
              </Button>
              <Button
                onClick={() => {
                  setShowExternalEditModal(false);
                  setEditingExternalLocation(null);
                  externalEditForm.resetFields();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Locations;
