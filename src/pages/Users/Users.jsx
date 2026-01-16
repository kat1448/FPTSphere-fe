import React, { useState, useEffect } from "react";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
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
  message,
  Popconfirm,
  Spin,
  Switch,
} from "antd";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  getRoles,
  searchUsers,
} from "../../services/users.api";
import { useAuth } from "../../contexts/AuthContext";

const { Option } = Select;

const Users = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // Check if user has permission (Director or Admin)
  const hasPermission = user?.roleName === "Director" || user?.roleName === "Admin";

  // Load roles
  const loadRoles = async () => {
    try {
      const rolesData = await getRoles();
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error("Error loading roles:", error);
      message.error("Failed to load roles");
    }
  };

  // Load users
  const loadUsers = async () => {
    if (!hasPermission) {
      message.error("You do not have permission to view users");
      return;
    }

    try {
      setLoading(true);
      const response = await getAllUsers();

      // Handle nested response structure: { data: { data: [...], totalRecords, page, ... } }
      if (response && response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        setPagination({
          current: response.page || 1,
          pageSize: response.pageSize || 10,
          total: response.totalRecords || response.data.length,
        });
      } else if (Array.isArray(response)) {
        setUsers(response);
        setPagination({
          current: 1,
          pageSize: 10,
          total: response.length,
        });
      } else {
        setUsers([]);
        setPagination({
          current: 1,
          pageSize: 10,
          total: 0,
        });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      message.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      loadRoles();
      loadUsers();
    }
  }, [hasPermission]);

  // Filter and search users
  const filteredUsers = React.useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          u.classCode?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => {
        if (roleFilter === "null") {
          return !u.roleName || u.roleName === null;
        }
        return u.roleName === roleFilter;
      });
    }

    return filtered;
  }, [users, searchText, roleFilter]);

  // Handle search with API
  const handleSearch = async (value) => {
    if (!value || value.trim() === "") {
      loadUsers();
      return;
    }

    try {
      setLoading(true);
      const results = await searchUsers(value);
      setUsers(Array.isArray(results) ? results : []);
      setPagination({
        current: 1,
        pageSize: 10,
        total: Array.isArray(results) ? results.length : 0,
      });
    } catch (error) {
      console.error("Error searching users:", error);
      message.error(error.message || "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  // Handle create/edit modal
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        roleId: user.roleId,
        classCode: user.classCode || "",
        isAuthorized: user.isAuthorized !== undefined ? user.isAuthorized : true,
      });
    } else {
      form.resetFields();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    form.resetFields();
  };

  // Handle submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingUser) {
        // Update user
        await updateUser(editingUser.userId, values);
        message.success("User updated successfully");
      } else {
        // Create user
        await createUser(values);
        message.success("User created successfully");
      }

      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      message.error(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete user
  const handleDelete = async (userId) => {
    try {
      setLoading(true);
      await deleteUser(userId);
      message.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error(error.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "ID",
      dataIndex: "userId",
      key: "userId",
      width: 80,
      sorter: (a, b) => a.userId - b.userId,
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => (a.fullName || "").localeCompare(b.fullName || ""),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      render: (roleName) => {
        if (!roleName) {
          return <Tag color="default">No Role</Tag>;
        }
        const colorMap = {
          Admin: "red",
          Director: "purple",
          "Event Manager": "blue",
          Staff: "green",
          Student: "orange",
        };
        return <Tag color={colorMap[roleName] || "default"}>{roleName}</Tag>;
      },
    },
    {
      title: "Class Code",
      dataIndex: "classCode",
      key: "classCode",
      render: (text) => text || "-",
    },
    {
      title: "Authorized",
      dataIndex: "isAuthorized",
      key: "isAuthorized",
      render: (isAuthorized) => (
        <Tag color={isAuthorized ? "green" : "red"}>
          {isAuthorized ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => {
        if (!text) return "-";
        const date = new Date(text);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.userId)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!hasPermission) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8 text-gray-500">
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>You do not have permission to access this page</p>
            <p className="text-sm mt-2">
              Only Directors and Admins can manage users
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage system users and permissions</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <Input
            placeholder="Search by name, email, or class code..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by role"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 200 }}
          >
            <Option value="all">All Roles</Option>
            <Option value="null">No Role</Option>
            {roles.map((role) => (
              <Option key={role.roleId} value={role.roleName}>
                {role.roleName}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearchText("");
              setRoleFilter("all");
              loadUsers();
            }}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            Create User
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="userId"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
            },
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create User"}
        open={showModal}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        okText={editingUser ? "Update" : "Create"}
        cancelText="Cancel"
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isAuthorized: true,
          }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[
              { required: true, message: "Please enter full name" },
              { min: 2, message: "Full name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter email" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select role">
              {roles.map((role) => (
                <Option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="classCode"
            label="Class Code"
            rules={[
              { max: 50, message: "Class code must be less than 50 characters" },
            ]}
          >
            <Input placeholder="Enter class code (optional)" />
          </Form.Item>

          <Form.Item
            name="isAuthorized"
            label="Authorized"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
