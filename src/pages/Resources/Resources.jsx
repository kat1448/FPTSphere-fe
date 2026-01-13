import React, { useState, useEffect } from "react";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
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
  Popconfirm,
  Spin,
} from "antd";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getAvailableQuantity,
  searchResources,
} from "../../services/resources.api";
import authService from "../../services/authService";

const { Option } = Select;

const Resources = () => {
  const user = authService.getCurrentUser();
  const roleId = user?.roleId ? Number(user.roleId) : null;
  const roleName = user?.roleName || "";
  // Event Manager chỉ được xem, không được sửa
  const isEventManager = roleId === 3 || roleName === "Event Manager";
  
  // Debug: Log user info
  useEffect(() => {
    console.log("🔍 Resources - User info:", {
      userId: user?.userId,
      roleId: roleId,
      roleIdType: typeof roleId,
      roleName: roleName,
      isEventManager: isEventManager,
      fullUser: user
    });
  }, [user, roleId, roleName, isEventManager]);
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [form] = Form.useForm();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Load resources
  const loadResources = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await getResources({
        page,
        pageSize,
        sortBy: "Name",
        sortDescending: false,
      });

      if (response && response.data) {
        setResources(response.data);
        setPagination({
          current: response.page || page,
          pageSize: response.pageSize || pageSize,
          total: response.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      message.error("Không thể tải danh sách tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

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
    formData.append("folder", "fptsphere/resources");

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

  // Handle create/update resource
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      let imageUrl = "null";

      // Upload image if provided
      if (values.image && values.image.fileList && values.image.fileList.length > 0) {
        const file = values.image.fileList[0].originFileObj;
        if (file) {
          imageUrl = await uploadImage(file);
        }
      } else if (editingResource && editingResource.imageUrl && editingResource.imageUrl !== "null") {
        // Keep existing image if not changed
        imageUrl = editingResource.imageUrl;
      }

      const resourceData = {
        name: values.name,
        type: values.type,
        quantity: values.quantity,
        imageUrl: imageUrl,
      };

      if (editingResource) {
        await updateResource(editingResource.resourceId, resourceData);
        message.success("Cập nhật tài nguyên thành công");
      } else {
        await createResource(resourceData);
        message.success("Tạo tài nguyên thành công");
      }

      setShowModal(false);
      form.resetFields();
      setEditingResource(null);
      loadResources(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Error saving resource:", error);
      message.error(error.message || "Không thể lưu tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = async (resourceId) => {
    try {
      setLoading(true);
      const resource = await getResourceById(resourceId);
      setEditingResource(resource);
      form.setFieldsValue({
        name: resource.name,
        type: resource.type,
        quantity: resource.quantity,
        image: resource.imageUrl && resource.imageUrl !== "null" ? [
          {
            uid: "-1",
            name: "image.png",
            status: "done",
            url: resource.imageUrl,
          }
        ] : undefined,
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error loading resource:", error);
      message.error("Không thể tải thông tin tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (resourceId) => {
    try {
      setLoading(true);
      await deleteResource(resourceId);
      message.success("Xóa tài nguyên thành công");
      loadResources(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Error deleting resource:", error);
      message.error(error.message || "Không thể xóa tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (term) => {
    if (!term || term.trim() === "") {
      loadResources();
      return;
    }

    try {
      setLoading(true);
      const results = await searchResources(term);
      setResources(results);
      setPagination({
        current: 1,
        pageSize: 10,
        total: results.length,
      });
    } catch (error) {
      console.error("Error searching resources:", error);
      message.error("Không thể tìm kiếm tài nguyên");
    } finally {
      setLoading(false);
    }
  };

  // Filter resources
  const filteredResources = React.useMemo(() => {
    let filtered = resources;

    if (typeFilter !== "all") {
      filtered = filtered.filter((res) => res.type === typeFilter);
    }

    return filtered;
  }, [resources, typeFilter]);

  // Get unique types
  const uniqueTypes = React.useMemo(() => {
    return [...new Set(resources.map((res) => res.type).filter(Boolean))];
  }, [resources]);

  // Table columns
  const columns = [
    {
      title: "Tên tài nguyên",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          {record.imageUrl && record.imageUrl !== "null" && (
            <img
              src={record.imageUrl}
              alt={text}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div>
            <div className="font-semibold">{text}</div>
            <div className="text-gray-500 text-sm">{record.type}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => quantity?.toLocaleString() || 0,
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
      render: (_, record) => {
        if (isEventManager) {
          return <span className="text-gray-400 text-sm">Chỉ xem</span>;
        }
        return (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.resourceId)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa"
              description="Bạn có chắc chắn muốn xóa tài nguyên này?"
              onConfirm={() => handleDelete(record.resourceId)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài nguyên</h1>
          <p className="text-gray-600 mt-1">Quản lý các tài nguyên sự kiện</p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadResources(pagination.current, pagination.pageSize)}
          >
            Làm mới
          </Button>
          {!isEventManager && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingResource(null);
                form.resetFields();
                setShowModal(true);
              }}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              Thêm tài nguyên
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <Input
            placeholder="Tìm kiếm tài nguyên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (e.target.value.trim() === "") {
                loadResources();
              }
            }}
            onPressEnter={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Lọc theo loại"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
          >
            <Option value="all">Tất cả loại</Option>
            {uniqueTypes.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredResources}
          loading={loading}
          rowKey="resourceId"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} tài nguyên`,
            onChange: (page, pageSize) => {
              loadResources(page, pageSize);
            },
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingResource ? "Chỉnh sửa tài nguyên" : "Thêm tài nguyên mới"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingResource(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên tài nguyên"
            rules={[{ required: true, message: "Vui lòng nhập tên tài nguyên" }]}
          >
            <Input placeholder="VD: Máy chiếu" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại"
            rules={[{ required: true, message: "Vui lòng nhập loại tài nguyên" }]}
          >
            <Input placeholder="VD: Thiết bị" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng" },
              { type: "number", min: 0, message: "Số lượng phải lớn hơn hoặc bằng 0" },
            ]}
          >
            <InputNumber
              placeholder="VD: 10"
              style={{ width: "100%" }}
              min={0}
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
                {editingResource ? "Cập nhật" : "Tạo tài nguyên"}
              </Button>
              <Button
                onClick={() => {
                  setShowModal(false);
                  form.resetFields();
                  setEditingResource(null);
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

export default Resources;
