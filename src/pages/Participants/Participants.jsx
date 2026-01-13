import React, { useState, useEffect } from "react";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  UploadOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Tag,
  Space,
  Spin,
  message,
  Upload,
  Modal,
  Form,
} from "antd";
import { getEvents, getSubEvents, generateQRCode } from "../../services/events.api";
import { syncParticipants, refreshParticipants, getParticipants } from "../../services/participants.api";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { Option } = Select;

const Participants = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [subEvents, setSubEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSubEventId, setSelectedSubEventId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrForm] = Form.useForm();
  const [sampleFormatModalVisible, setSampleFormatModalVisible] = useState(false);
  const [syncingParticipants, setSyncingParticipants] = useState(false);
  const [refreshingParticipants, setRefreshingParticipants] = useState(false);
  const [storedGoogleFormUrl, setStoredGoogleFormUrl] = useState(null);
  const [storedGoogleSheetId] = useState(null); // Reserved for future use
  const [statistics, setStatistics] = useState(null);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);

  // Load events (only main events with parentEventId = null)
  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents({
        page: 1,
        pageSize: 100,
        includeDeleted: false,
        sortBy: "CreatedAt",
        sortDescending: true,
      });

      if (response && response.data) {
        // Filter only main events (parentEventId === null)
        const mainEvents = response.data.filter(
          (event) => event.parentEventId === null || event.parentEventId === undefined
        );
        setEvents(mainEvents);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      message.error("Failed to load events list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Load sub-events when event is selected
  useEffect(() => {
    const loadSubEvents = async () => {
      if (!selectedEventId) {
        setSubEvents([]);
        setSelectedSubEventId(null);
        setParticipants([]);
        return;
      }

      try {
        setLoading(true);
        const subEventsData = await getSubEvents(selectedEventId);
        setSubEvents(subEventsData || []);
        setSelectedSubEventId(null);
        setParticipants([]);
      } catch (error) {
        console.error("Error loading sub-events:", error);
        message.error("Failed to load sub-events list");
        setSubEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubEvents();
  }, [selectedEventId]);

  // Load participants when sub-event is selected
  useEffect(() => {
    const loadParticipants = async () => {
      if (!selectedSubEventId || !selectedEventId) {
        setParticipants([]);
        return;
      }

      try {
        setLoading(true);
        const response = await getParticipants(selectedEventId, selectedSubEventId);
        
        // Extract participants array from response
        const participantsList = response?.participants || [];
        setParticipants(participantsList);
        
        // Store statistics
        setStatistics({
          totalCount: response?.totalCount || 0,
          checkedInCount: response?.checkedInCount || 0,
          checkedOutCount: response?.checkedOutCount || 0,
          invitedCount: response?.invitedCount || 0,
          guestCount: response?.guestCount || 0,
          userCount: response?.userCount || 0,
        });
      } catch (error) {
        console.error("Error loading participants:", error);
        message.error(error.message || "Failed to load participants");
        setParticipants([]);
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [selectedSubEventId, selectedEventId]);

  // Filter participants
  const filteredParticipants = React.useMemo(() => {
    let filtered = participants;

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (p) =>
          p.roleName?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          p.fullName?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (!p.status) return false;
        
        // Normalize status: convert to lowercase, remove all spaces, underscores, and hyphens
        const normalizeStatus = (status) => {
          return (status?.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
        };
        
        const normalizedStatus = normalizeStatus(p.status);
        const normalizedFilter = normalizeStatus(statusFilter);
        
        // After normalization, all variations should match:
        // "CHECK_IN", "Checked In", "checked-in", "check_in" -> "checkedin"
        // "CHECK_OUT", "Checked Out", "checked-out", "check_out" -> "checkedout"
        // "INVITED", "Invited", "invited" -> "invited"
        
        return normalizedStatus === normalizedFilter;
      });
    }

    return filtered;
  }, [participants, searchText, statusFilter]);

  // Download Excel sample - Format 1: Google Form Format
  const downloadExcelSampleFormat1 = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["STT", "Timestamp", "Email", "Họ và tên"];
    const sampleData = [
      [1, "2026-01-15 08:30:00", "student1@fpt.edu.vn", "Nguyễn Văn An"],
      [2, "2026-01-15 08:35:00", "student2@fpt.edu.vn", "Trần Thị Bình"],
      [3, "2026-01-15 09:00:00", "student3@fpt.edu.vn", "Lê Minh Cường"],
      [4, "2026-01-15 09:15:00", "student4@fpt.edu.vn", "Phạm Thị Dung"],
      [5, "2026-01-15 09:20:00", "student5@fpt.edu.vn", "Hoàng Văn Em"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 5 },  // STT
      { wch: 20 }, // Timestamp
      { wch: 30 }, // Email
      { wch: 25 }, // Họ và tên
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "participants-sample-format1-google-form.xlsx");
    message.success("Format 1 (Google Form) template downloaded");
  };

  // Download Excel sample - Format 2: CheckType Format
  const downloadExcelSampleFormat2 = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["Email", "FullName", "CheckType", "SubmittedAt"];
    const sampleData = [
      ["student1@fpt.edu.vn", "Nguyễn Văn An", "CHECK_IN", "2026-01-15 08:30:00"],
      ["student2@fpt.edu.vn", "Trần Thị Bình", "CHECK_IN", "2026-01-15 08:35:00"],
      ["student1@fpt.edu.vn", "Nguyễn Văn An", "CHECK_OUT", "2026-01-15 17:00:00"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 30 }, // Email
      { wch: 25 }, // FullName
      { wch: 12 }, // CheckType
      { wch: 20 }, // SubmittedAt
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "participants-sample-format2-checktype.xlsx");
    message.success("Format 2 (CheckType) template downloaded");
  };

  // Download Excel sample - Format 3: Simple Format
  const downloadExcelSampleFormat3 = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["Email", "Tên"];
    const sampleData = [
      ["student1@fpt.edu.vn", "Nguyễn Văn An"],
      ["student2@fpt.edu.vn", "Trần Thị Bình"],
      ["student3@fpt.edu.vn", "Lê Minh Cường"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 30 }, // Email
      { wch: 25 }, // Tên
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "participants-sample-format3-simple.xlsx");
    message.success("Format 3 (Simple) template downloaded");
  };

  // Handle Excel import and sync
  const handleExcelImport = async (file) => {
    if (!selectedEventId || !selectedSubEventId) {
      message.error("Please select an event and sub-event first");
      return false;
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      message.error("Only Excel files (.xlsx, .xls) are accepted");
      return false;
    }

    try {
      setSyncingParticipants(true);

      // Call sync API
      await syncParticipants(selectedEventId, selectedSubEventId, file);
      
      message.success("Participants synced successfully");
      
      // Reload participants from API
      if (selectedEventId && selectedSubEventId) {
        try {
          const participantsResponse = await getParticipants(selectedEventId, selectedSubEventId);
          const participantsList = participantsResponse?.participants || [];
          setParticipants(participantsList);
          
          // Update statistics
          setStatistics({
            totalCount: participantsResponse?.totalCount || 0,
            checkedInCount: participantsResponse?.checkedInCount || 0,
            checkedOutCount: participantsResponse?.checkedOutCount || 0,
            invitedCount: participantsResponse?.invitedCount || 0,
            guestCount: participantsResponse?.guestCount || 0,
            userCount: participantsResponse?.userCount || 0,
          });
        } catch (fetchError) {
          console.error("Error reloading participants after sync:", fetchError);
          message.warning("Participants synced but failed to reload. Please refresh manually.");
        }
      }
    } catch (error) {
      console.error("Error syncing participants:", error);
      message.error(error.message || "Failed to sync participants");
    } finally {
      setSyncingParticipants(false);
    }

    return false; // Prevent auto upload
  };

  // Table columns with sorting
  const columns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Role Name",
      dataIndex: "roleName",
      key: "roleName",
      sorter: (a, b) => {
        if (!a.roleName || !b.roleName) return 0;
        return a.roleName.localeCompare(b.roleName);
      },
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => {
        if (!a.email || !b.email) return 0;
        return a.email.localeCompare(b.email);
      },
    },
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => {
        if (!a.fullName || !b.fullName) return 0;
        return a.fullName.localeCompare(b.fullName);
      },
      render: (text) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => {
        // Normalize status for sorting
        const normalizeStatus = (status) => {
          if (!status) return 999;
          // Normalize: convert to lowercase, remove all spaces, underscores, and hyphens
          const normalized = (status.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
          
          const statusOrder = {
            "checkedin": 1,
            "checkin": 1,
            "checkedout": 2,
            "checkout": 2,
            "invited": 3,
          };
          return statusOrder[normalized] || 999;
        };
        
        return normalizeStatus(a.status) - normalizeStatus(b.status);
      },
      render: (status) => {
        if (!status) {
          return <Tag color="default">Unknown</Tag>;
        }
        
        // Normalize status: convert to lowercase, remove all spaces, underscores, and hyphens
        const normalizeStatus = (s) => {
          return (s?.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
        };
        
        const normalizedStatus = normalizeStatus(status);
        
        // Determine status config based on normalized value
        let config;
        if (normalizedStatus === "checkedin" || normalizedStatus === "checkin") {
          config = {
            label: "Checked In",
            color: "green",
          };
        } else if (normalizedStatus === "checkedout" || normalizedStatus === "checkout") {
          config = {
            label: "Checked Out",
            color: "blue",
          };
        } else if (normalizedStatus === "invited") {
          config = {
            label: "Invited",
            color: "orange",
          };
        } else {
          config = {
            label: status || "Unknown",
            color: "default",
          };
        }

        return (
          <Tag color={config.color} style={{ fontSize: "12px", padding: "4px 12px" }}>
            {config.label}
          </Tag>
        );
      },
    },
  ];

  // Handle QR code generation
  const handleGenerateQR = async () => {
    if (!selectedSubEventId) {
      message.warning("Please select a sub-event first");
      return;
    }

    try {
      const values = await qrForm.validateFields();
      setGeneratingQR(true);

      const qrData = await generateQRCode(selectedSubEventId, values.googleFormUrl);
      setQrCodeData(qrData);
      
      // Store Google Form URL for refresh functionality
      if (qrData.googleFormUrl) {
        setStoredGoogleFormUrl(qrData.googleFormUrl);
      }
      
      message.success("QR code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      message.error(error.message || "Failed to generate QR code");
    } finally {
      setGeneratingQR(false);
    }
  };

  // Handle refresh participants
  const handleRefreshParticipants = async () => {
    if (!selectedEventId || !selectedSubEventId) {
      message.warning("Please select an event and sub-event first");
      return;
    }

    try {
      setRefreshingParticipants(true);

      await refreshParticipants(
        selectedEventId,
        selectedSubEventId,
        storedGoogleSheetId || null,
        storedGoogleFormUrl || null
      );

      // Reload participants from API
      if (selectedEventId && selectedSubEventId) {
        try {
          const participantsResponse = await getParticipants(selectedEventId, selectedSubEventId);
          const participantsList = participantsResponse?.participants || [];
          setParticipants(participantsList);
          
          // Update statistics
          setStatistics({
            totalCount: participantsResponse?.totalCount || 0,
            checkedInCount: participantsResponse?.checkedInCount || 0,
            checkedOutCount: participantsResponse?.checkedOutCount || 0,
            invitedCount: participantsResponse?.invitedCount || 0,
            guestCount: participantsResponse?.guestCount || 0,
            userCount: participantsResponse?.userCount || 0,
          });
        } catch (fetchError) {
          console.error("Error reloading participants:", fetchError);
        }
      }

      // Clear search and filters
      setSearchText("");
      setStatusFilter("all");
      
      message.success("Participants refreshed successfully");
    } catch (error) {
      console.error("Error refreshing participants:", error);
      message.error(error.message || "Failed to refresh participants");
      
      // Even on error, try to reload participants from API
      if (selectedEventId && selectedSubEventId) {
        try {
          const participantsResponse = await getParticipants(selectedEventId, selectedSubEventId);
          const participantsList = participantsResponse?.participants || [];
          setParticipants(participantsList);
          
          // Update statistics
          setStatistics({
            totalCount: participantsResponse?.totalCount || 0,
            checkedInCount: participantsResponse?.checkedInCount || 0,
            checkedOutCount: participantsResponse?.checkedOutCount || 0,
            invitedCount: participantsResponse?.invitedCount || 0,
            guestCount: participantsResponse?.guestCount || 0,
            userCount: participantsResponse?.userCount || 0,
          });
        } catch (fetchError) {
          console.error("Error reloading participants:", fetchError);
        }
      }
      
      setSearchText("");
      setStatusFilter("all");
    } finally {
      setRefreshingParticipants(false);
    }
  };

  // Handle QR code download
  const handleDownloadQR = () => {
    if (!qrCodeData?.qrCodeBase64 || !selectedSubEvent) {
      message.error("QR code not available");
      return;
    }

    try {
      // Extract base64 data
      const base64Data = qrCodeData.qrCodeBase64.replace(/^data:image\/png;base64,/, "");
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Generate filename: Time_SubeventName_SubeventID_QRCode
      const timestamp = dayjs().format("YYYYMMDD_HHmmss");
      const subEventName = selectedSubEvent.eventName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${timestamp}_${subEventName}_${selectedSubEventId}_QRCode.png`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("QR code downloaded successfully");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      message.error("Failed to download QR code");
    }
  };

  // Get selected event and sub-event names
  const selectedEvent = events.find((e) => e.eventId === selectedEventId);
  const selectedSubEvent = subEvents.find((e) => e.eventId === selectedSubEventId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Participant Management</h1>
        <p className="text-gray-600 mt-1">View participant list by event</p>
      </div>

      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <Select
              placeholder="Select Event"
              value={selectedEventId}
              onChange={(value) => {
                setSelectedEventId(value);
                setSelectedSubEventId(null);
                setParticipants([]);
              }}
              style={{ width: "100%" }}
              loading={loading}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {events.map((event) => (
                <Option key={event.eventId} value={event.eventId} label={event.eventName}>
                  {event.eventName}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sub-Event
            </label>
            <Select
              placeholder="Select Sub-Event"
              value={selectedSubEventId}
              onChange={(value) => setSelectedSubEventId(value)}
              style={{ width: "100%" }}
              disabled={!selectedEventId || subEvents.length === 0}
              loading={loading}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {subEvents.map((subEvent) => (
                <Option
                  key={subEvent.eventId}
                  value={subEvent.eventId}
                  label={subEvent.eventName}
                >
                  {subEvent.eventName}
                </Option>
              ))}
            </Select>
          </div>
        </div>

        {selectedEvent && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Event:</span> {selectedEvent.eventName}
            </div>
            {selectedSubEvent && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Sub-event:</span> {selectedSubEvent.eventName}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => {
              setQrModalVisible(true);
              setQrCodeData(null);
              qrForm.resetFields();
            }}
            disabled={!selectedSubEventId}
            type="primary"
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            Generate QR By Link
          </Button>
        </div>
      </Card>

      {selectedSubEventId && (
        <Card>
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <Input
              placeholder="Search by role name, email, name..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 200 }}
            >
              <Option value="all">All Status</Option>
              <Option value="checked-in">Checked In</Option>
              <Option value="checked-out">Checked Out</Option>
              <Option value="invited">Invited</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefreshParticipants}
              loading={refreshingParticipants}
              disabled={!selectedEventId || !selectedSubEventId}
            >
              Refresh
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setStatisticsModalVisible(true)}
              disabled={!selectedEventId || !selectedSubEventId || !statistics}
              type="default"
            >
              Statistics
            </Button>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setSampleFormatModalVisible(true)}
                type="default"
              >
                Download Sample
              </Button>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleExcelImport}
                showUploadList={false}
                disabled={syncingParticipants}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="primary"
                  loading={syncingParticipants}
                  disabled={!selectedEventId || !selectedSubEventId}
                  style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
                >
                  {syncingParticipants ? "Syncing..." : "Import Excel"}
                </Button>
              </Upload>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredParticipants}
            loading={loading}
            rowKey={(record, index) => `${record.roleName || record.email || 'participant'}-${index}`}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} participants`,
            }}
          />
        </Card>
      )}

      {!selectedSubEventId && selectedEventId && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Please select a sub-event to view participant list</p>
          </div>
        </Card>
      )}

      {!selectedEventId && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Please select an event to view participant list</p>
          </div>
        </Card>
      )}

      {/* QR Code Generation Modal */}
      <Modal
        title="Generate QR Code"
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false);
          setQrCodeData(null);
          qrForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={qrForm}
          layout="vertical"
          onFinish={handleGenerateQR}
        >
          <Form.Item
            name="googleFormUrl"
            label="Google Form URL"
            rules={[
              { required: true, message: "Please enter Google Form URL" },
              {
                type: "url",
                message: "Please enter a valid URL",
              },
              {
                pattern: /^https:\/\/docs\.google\.com\/forms/,
                message: "Please enter a valid Google Forms URL",
              },
            ]}
          >
            <Input
              placeholder="https://docs.google.com/forms/d/e/..."
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={generatingQR}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              block
            >
              Generate QR Code
            </Button>
          </Form.Item>
        </Form>

        {qrCodeData && qrCodeData.qrCodeBase64 && (
          <div className="mt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">QR Code Generated</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeData.qrCodeBase64}
                  alt="QR Code"
                  style={{
                    maxWidth: "300px",
                    maxHeight: "300px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    padding: "10px",
                    backgroundColor: "#fff",
                  }}
                />
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <p className="mb-1">
                  <strong>Sub-Event:</strong> {selectedSubEvent?.eventName}
                </p>
                <p className="mb-1">
                  <strong>Google Form URL:</strong>
                </p>
                <a
                  href={qrCodeData.googleFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {qrCodeData.googleFormUrl}
                </a>
              </div>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadQR}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Download QR Code
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sample Format Selection Modal */}
      <Modal
        title="Select Sample Format"
        open={sampleFormatModalVisible}
        onCancel={() => setSampleFormatModalVisible(false)}
        footer={null}
        width={700}
      >
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Format 1: Google Form Format (Phổ biến nhất)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Columns: STT | Timestamp | Email | Họ và tên
            </p>
            <Button
              type="primary"
              onClick={() => {
                downloadExcelSampleFormat1();
                setSampleFormatModalVisible(false);
              }}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              Download Format 1
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Format 2: CheckType Format</h3>
            <p className="text-sm text-gray-600 mb-3">
              Columns: Email | FullName | CheckType | SubmittedAt
            </p>
            <p className="text-xs text-gray-500 mb-3">
              CheckType values: CHECK_IN, CHECK_OUT
            </p>
            <Button
              type="primary"
              onClick={() => {
                downloadExcelSampleFormat2();
                setSampleFormatModalVisible(false);
              }}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              Download Format 2
            </Button>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Format 3: Simple Format (Check-in)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Columns: Email | Tên
            </p>
            <p className="text-xs text-gray-500 mb-3">
              This format will be treated as CHECK_IN
            </p>
            <Button
              type="primary"
              onClick={() => {
                downloadExcelSampleFormat3();
                setSampleFormatModalVisible(false);
              }}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              Download Format 3
            </Button>
          </div>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        title={selectedSubEvent ? `Participant Statistics - ${selectedSubEvent.eventName}` : "Participant Statistics"}
        open={statisticsModalVisible}
        onCancel={() => setStatisticsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setStatisticsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {statistics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center border-l-4 border-l-blue-500">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {statistics.totalCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">Total Participants</div>
              </Card>
              <Card className="text-center border-l-4 border-l-purple-500">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {statistics.userCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">Users</div>
              </Card>
              <Card className="text-center border-l-4 border-l-gray-500">
                <div className="text-3xl font-bold text-gray-600 mb-2">
                  {statistics.guestCount}
                </div>
                <div className="text-sm text-gray-600 font-medium">Guests</div>
              </Card>
            </div>

            {/* Status Distribution Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* Bar Chart - Status Distribution */}
              <Card title="Status Distribution" className="shadow-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Checked In",
                        value: statistics.checkedInCount,
                      },
                      {
                        name: "Checked Out",
                        value: statistics.checkedOutCount,
                      },
                      {
                        name: "Invited",
                        value: statistics.invitedCount,
                      },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[
                        { color: "#52c41a" },
                        { color: "#1890ff" },
                        { color: "#fa8c16" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Pie Chart - Status Breakdown */}
              <Card title="Status Breakdown" className="shadow-sm">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Checked In",
                          value: statistics.checkedInCount,
                          color: "#52c41a",
                        },
                        {
                          name: "Checked Out",
                          value: statistics.checkedOutCount,
                          color: "#1890ff",
                        },
                        {
                          name: "Invited",
                          value: statistics.invitedCount,
                          color: "#fa8c16",
                        },
                      ].filter((item) => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { color: "#52c41a" },
                        { color: "#1890ff" },
                        { color: "#fa8c16" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Detailed Statistics Table */}
            <Card title="Detailed Statistics" className="shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {statistics.checkedInCount}
                  </div>
                  <div className="text-sm text-gray-600">Checked In</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {statistics.checkedOutCount}
                  </div>
                  <div className="text-sm text-gray-600">Checked Out</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {statistics.invitedCount}
                  </div>
                  <div className="text-sm text-gray-600">Invited</div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>No statistics available</p>
            <p className="text-sm mt-2">Please select an event and sub-event to view statistics</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Participants;
