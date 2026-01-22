import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  UploadOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  BarChartOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
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
  Typography,
  Empty,
} from "antd";
import { getEventById, generateQRCode } from "../../services/events.api";
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
const { Title, Text } = Typography;

const StaffAttendance = () => {
  const { subEventId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [subEvent, setSubEvent] = useState(null);
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
  const [storedGoogleSheetId] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  const [participantsData, setParticipantsData] = useState([]); // Local state for editing

  // Load sub-event info
  useEffect(() => {
    const loadSubEvent = async () => {
      if (!subEventId) return;
      
      try {
        setLoading(true);
        const response = await getEventById(Number(subEventId));
        // Handle API response structure: response.data.data or response.data
        const eventData = response?.data || response;
        if (eventData && typeof eventData === 'object' && 'eventId' in eventData) {
          setSubEvent(eventData);
        } else {
          throw new Error("Invalid event data structure");
        }
      } catch (error) {
        console.error("Error loading sub-event:", error);
        message.error(error.message || "Failed to load sub-event");
        setSubEvent(null);
      } finally {
        setLoading(false);
      }
    };

    loadSubEvent();
  }, [subEventId]);

  // Load participants when sub-event is loaded
  useEffect(() => {
    const loadParticipants = async () => {
      if (!subEvent || !subEvent.parentEventId) {
        setParticipants([]);
        return;
      }

      try {
        setLoading(true);
        const response = await getParticipants(subEvent.parentEventId, Number(subEventId));
        
        // Extract participants array from response
        const participantsList = response?.participants || [];
        setParticipants(participantsList);
        // Initialize local editable data
        setParticipantsData(participantsList.map((p, index) => ({
          ...p,
          key: `participant-${index}-${p.email || ''}-${p.roleName || ''}`,
          originalStatus: p.status,
          originalEmail: p.email,
          originalRoleName: p.roleName,
        })));
        
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

    if (subEvent) {
      loadParticipants();
    }
  }, [subEvent, subEventId]);

  // Handle status change
  const handleStatusChange = (index, newStatus) => {
    setParticipantsData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        status: newStatus,
      };
      return updated;
    });
  };

  // Handle field change (roleName, email, fullName)
  const handleFieldChange = (index, field, value) => {
    setParticipantsData((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Handle add new row
  const handleAddRow = () => {
    const newRow = {
      roleName: "",
      email: "",
      fullName: "",
      status: "invited",
      key: `new-participant-${Date.now()}-${Math.random()}`,
      originalStatus: "invited",
      originalEmail: "",
      originalRoleName: "",
    };
    setParticipantsData((prev) => [...prev, newRow]);
  };

  // Handle remove row
  const handleRemoveRow = (index) => {
    setParticipantsData((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    let filtered = participantsData.length > 0 ? participantsData : participants;

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
        
        return normalizedStatus === normalizedFilter;
      });
    }

    return filtered;
  }, [participants, participantsData, searchText, statusFilter]);

  // Download Excel sample - Format 1: Google Form Format
  const downloadExcelSampleFormat1 = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["STT", "Timestamp", "Email", "Full Name"];
    const sampleData = [
      [1, "2026-01-15 08:30:00", "student1@fpt.edu.vn", "Nguyễn Văn An"],
      [2, "2026-01-15 08:35:00", "student2@fpt.edu.vn", "Trần Thị Bình"],
      [3, "2026-01-15 09:00:00", "student3@fpt.edu.vn", "Lê Minh Cường"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 30 },
      { wch: 25 },
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
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 12 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "participants-sample-format2-checktype.xlsx");
    message.success("Format 2 (CheckType) template downloaded");
  };

  // Download Excel sample - Format 3: Simple Format
  const downloadExcelSampleFormat3 = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["Email", "Name"];
    const sampleData = [
      ["student1@fpt.edu.vn", "Nguyễn Văn An"],
      ["student2@fpt.edu.vn", "Trần Thị Bình"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 30 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "participants-sample-format3-simple.xlsx");
    message.success("Format 3 (Simple) template downloaded");
  };

  // Handle Excel import and sync
  const handleExcelImport = async (file) => {
    if (!subEvent || !subEvent.parentEventId) {
      message.error("Sub-event information is missing");
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
      await syncParticipants(subEvent.parentEventId, Number(subEventId), file);
      
      message.success("Participants synced successfully");
      
      // Reload participants from API
      try {
        const participantsResponse = await getParticipants(subEvent.parentEventId, Number(subEventId));
        const participantsList = participantsResponse?.participants || [];
        setParticipants(participantsList);
        // Update local editable data
        setParticipantsData(participantsList.map((p, index) => ({
          ...p,
          key: `participant-${index}-${p.email || ''}-${p.roleName || ''}`,
          originalStatus: p.status,
          originalEmail: p.email,
          originalRoleName: p.roleName,
        })));
        
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
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record, index) => {
        // Find index by original email and roleName, or by current values or key
        const actualIndex = participantsData.findIndex(
          (p) => 
            (p.originalEmail === record.email && p.originalRoleName === record.roleName) ||
            (p.email === record.email && p.roleName === record.roleName) ||
            (p.key === record.key)
        );
        const dataIndex = actualIndex >= 0 ? actualIndex : index;
        
        return (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleRemoveRow(dataIndex)}
          >
            Remove
          </Button>
        );
      },
    },
    {
      title: "Role Name",
      dataIndex: "roleName",
      key: "roleName",
      sorter: (a, b) => {
        if (!a.roleName || !b.roleName) return 0;
        return a.roleName.localeCompare(b.roleName);
      },
      render: (text, record, index) => {
        // Find index by original email and roleName, or by current values or key
        const actualIndex = participantsData.findIndex(
          (p) => 
            (p.originalEmail === record.email && p.originalRoleName === record.roleName) ||
            (p.email === record.email && p.roleName === record.roleName) ||
            (p.key === record.key)
        );
        const dataIndex = actualIndex >= 0 ? actualIndex : index;
        
        return (
          <Input
            value={participantsData[dataIndex]?.roleName || text || ""}
            onChange={(e) => handleFieldChange(dataIndex, "roleName", e.target.value)}
            placeholder="Role Name"
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => {
        if (!a.email || !b.email) return 0;
        return a.email.localeCompare(b.email);
      },
      render: (text, record, index) => {
        // Find index by original email and roleName, or by current values
        const actualIndex = participantsData.findIndex(
          (p) => 
            (p.originalEmail === record.email && p.originalRoleName === record.roleName) ||
            (p.email === record.email && p.roleName === record.roleName) ||
            (p.key === record.key)
        );
        const dataIndex = actualIndex >= 0 ? actualIndex : index;
        
        return (
          <Input
            value={participantsData[dataIndex]?.email || text || ""}
            onChange={(e) => handleFieldChange(dataIndex, "email", e.target.value)}
            placeholder="Email"
            style={{ width: "100%" }}
            size="small"
          />
        );
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
      render: (text, record, index) => {
        // Find index by original email and roleName, or by current values
        const actualIndex = participantsData.findIndex(
          (p) => 
            (p.originalEmail === record.email && p.originalRoleName === record.roleName) ||
            (p.email === record.email && p.roleName === record.roleName) ||
            (p.key === record.key)
        );
        const dataIndex = actualIndex >= 0 ? actualIndex : index;
        
        return (
          <Input
            value={participantsData[dataIndex]?.fullName || text || ""}
            onChange={(e) => handleFieldChange(dataIndex, "fullName", e.target.value)}
            placeholder="Full Name"
            style={{ width: "100%" }}
            size="small"
          />
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => {
        const normalizeStatus = (status) => {
          if (!status) return 999;
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
      render: (status, record, index) => {
        const normalizeStatus = (s) => {
          return (s?.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
        };
        
        const normalizedStatus = normalizeStatus(status);
        
        // Determine current status value for select
        let currentStatusValue = "invited";
        if (normalizedStatus === "checkedin" || normalizedStatus === "checkin") {
          currentStatusValue = "checked-in";
        } else if (normalizedStatus === "checkedout" || normalizedStatus === "checkout") {
          currentStatusValue = "checked-out";
        } else if (normalizedStatus === "invited") {
          currentStatusValue = "invited";
        }

        // Find index by original email and roleName, or by current values
        const actualIndex = participantsData.findIndex(
          (p) => 
            (p.originalEmail === record.email && p.originalRoleName === record.roleName) ||
            (p.email === record.email && p.roleName === record.roleName) ||
            (p.key === record.key)
        );
        const dataIndex = actualIndex >= 0 ? actualIndex : index;

        return (
          <Select
            value={currentStatusValue}
            onChange={(value) => handleStatusChange(dataIndex, value)}
            style={{ width: 150 }}
            size="small"
          >
            <Option value="invited">Invited</Option>
            <Option value="checked-in">Check In</Option>
            <Option value="checked-out">Check Out</Option>
          </Select>
        );
      },
    },
  ];

  // Handle QR code generation
  const handleGenerateQR = async () => {
    if (!subEventId) {
      message.warning("Sub-event ID is missing");
      return;
    }

    try {
      const values = await qrForm.validateFields();
      setGeneratingQR(true);

      const qrData = await generateQRCode(Number(subEventId), values.googleFormUrl);
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
    if (!subEvent || !subEvent.parentEventId) {
      message.warning("Sub-event information is missing");
      return;
    }

    try {
      setRefreshingParticipants(true);

      await refreshParticipants(
        subEvent.parentEventId,
        Number(subEventId),
        storedGoogleSheetId || null,
        storedGoogleFormUrl || null
      );

      // Reload participants from API
      try {
        const participantsResponse = await getParticipants(subEvent.parentEventId, Number(subEventId));
        const participantsList = participantsResponse?.participants || [];
        setParticipants(participantsList);
        // Update local editable data
        setParticipantsData(participantsList.map((p, index) => ({
          ...p,
          key: `participant-${index}-${p.email || ''}-${p.roleName || ''}`,
          originalStatus: p.status,
          originalEmail: p.email,
          originalRoleName: p.roleName,
        })));
        
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

      // Clear search and filters
      setSearchText("");
      setStatusFilter("all");
      
      message.success("Participants refreshed successfully");
    } catch (error) {
      console.error("Error refreshing participants:", error);
      message.error(error.message || "Failed to refresh participants");
      
      // Even on error, try to reload participants from API
      try {
        const participantsResponse = await getParticipants(subEvent.parentEventId, Number(subEventId));
        const participantsList = participantsResponse?.participants || [];
        setParticipants(participantsList);
        // Update local editable data
        setParticipantsData(participantsList.map((p, index) => ({
          ...p,
          key: `participant-${index}-${p.email || ''}-${p.roleName || ''}`,
          originalStatus: p.status,
          originalEmail: p.email,
          originalRoleName: p.roleName,
        })));
        
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
      
      setSearchText("");
      setStatusFilter("all");
    } finally {
      setRefreshingParticipants(false);
    }
  };

  // Export Excel with current data
  const handleExportExcel = () => {
    if (!participantsData || participantsData.length === 0) {
      message.warning("No data to export");
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      
      // Generate timestamp
      const timestamp = dayjs().format("YYYY-MM-DD_HH-mm-ss");
      const subEventName = subEvent?.eventName?.replace(/[^a-zA-Z0-9]/g, "_") || "attendance";
      
      // Prepare headers
      const headers = ["STT", "Role Name", "Email", "Full Name", "Status", "Export Time"];
      
      // Prepare data with current status
      const data = participantsData.map((p, index) => {
        const normalizeStatus = (s) => {
          if (!s) return "Unknown";
          const normalized = (s.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
          
          if (normalized === "checkedin" || normalized === "checkin") {
            return "Check In";
          } else if (normalized === "checkedout" || normalized === "checkout") {
            return "Check Out";
          } else if (normalized === "invited") {
            return "Invited";
          }
          return s;
        };

        return [
          index + 1,
          p.roleName || "",
          p.email || "",
          p.fullName || "",
          normalizeStatus(p.status),
          dayjs().format("YYYY-MM-DD HH:mm:ss"),
        ];
      });

      // Combine headers and data
      const worksheetData = [headers, ...data];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet["!cols"] = [
        { wch: 5 },   // STT
        { wch: 15 }, // Role Name
        { wch: 30 }, // Email
        { wch: 25 }, // Full Name
        { wch: 15 }, // Status
        { wch: 20 }, // Export Time
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      XLSX.writeFile(workbook, `attendance_${subEventName}_${timestamp}.xlsx`);
      
      message.success("Excel file exported successfully");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("Failed to export Excel file");
    }
  };

  // Handle QR code download
  const handleDownloadQR = () => {
    if (!qrCodeData?.qrCodeBase64 || !subEvent) {
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
      const subEventName = subEvent.eventName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${timestamp}_${subEventName}_${subEventId}_QRCode.png`;

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

  if (loading && !subEvent) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!subEvent) {
    return (
      <div className="p-6">
        <Empty description="Sub-event not found" />
        <div className="text-center mt-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/staff/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} style={{ margin: 0 }}>Attendance Management</Title>
            <Text type="secondary">Sub-Event: {subEvent.eventName}</Text>
          </div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/staff/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="p-3 bg-gray-50 rounded-lg mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Sub-event:</span> {subEvent.eventName}
          </div>
          {subEvent.parentEventId && (
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Parent Event ID:</span> {subEvent.parentEventId}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => {
              setQrModalVisible(true);
              setQrCodeData(null);
              qrForm.resetFields();
            }}
            type="primary"
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            Generate QR By Link
          </Button>
        </div>
      </Card>

      {subEvent && subEvent.parentEventId && (
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
              disabled={!subEvent || !subEvent.parentEventId}
            >
              Refresh
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setStatisticsModalVisible(true)}
              disabled={!subEvent || !subEvent.parentEventId || !statistics}
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
                  disabled={!subEvent || !subEvent.parentEventId}
                  style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
                >
                  {syncingParticipants ? "Syncing..." : "Import Excel"}
                </Button>
              </Upload>
              <Button
                icon={<PlusOutlined />}
                onClick={handleAddRow}
                type="default"
              >
                Add Row
              </Button>
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

          {/* Export Excel Button */}
          {participantsData.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
                style={{ 
                  backgroundColor: "#F2721E", 
                  borderColor: "#F2721E",
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Export Excel
              </Button>
            </div>
          )}
        </Card>
      )}

      {(!subEvent || !subEvent.parentEventId) && (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>Sub-event information is incomplete</p>
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
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://forms.google.com/..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={generatingQR}
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Generate QR Code
              </Button>
              <Button onClick={() => {
                setQrModalVisible(false);
                setQrCodeData(null);
                qrForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {qrCodeData && (
          <div className="mt-4">
            <div className="text-center mb-4">
              <img
                src={qrCodeData.qrCodeBase64}
                alt="QR Code"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
            <div className="text-center">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadQR}
                type="primary"
                style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
              >
                Download QR Code
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sample Format Modal */}
      <Modal
        title="Download Sample Excel Format"
        open={sampleFormatModalVisible}
        onCancel={() => setSampleFormatModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <Text strong>Format 1: Google Form Format</Text>
            <p className="text-sm text-gray-600 mt-1">
              Columns: STT, Timestamp, Email, Full Name
            </p>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadExcelSampleFormat1}
              className="mt-2"
            >
              Download Format 1
            </Button>
          </div>
          <div>
            <Text strong>Format 2: CheckType Format</Text>
            <p className="text-sm text-gray-600 mt-1">
              Columns: Email, FullName, CheckType, SubmittedAt
            </p>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadExcelSampleFormat2}
              className="mt-2"
            >
              Download Format 2
            </Button>
          </div>
          <div>
            <Text strong>Format 3: Simple Format</Text>
            <p className="text-sm text-gray-600 mt-1">
              Columns: Email, Name
            </p>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadExcelSampleFormat3}
              className="mt-2"
            >
              Download Format 3
            </Button>
          </div>
        </div>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        title="Participant Statistics"
        open={statisticsModalVisible}
        onCancel={() => setStatisticsModalVisible(false)}
        footer={null}
        width={800}
      >
        {statistics && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{statistics.totalCount}</div>
                  <div className="text-gray-600 mt-2">Total Participants</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{statistics.checkedInCount}</div>
                  <div className="text-gray-600 mt-2">Checked In</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">{statistics.checkedOutCount}</div>
                  <div className="text-gray-600 mt-2">Checked Out</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{statistics.invitedCount}</div>
                  <div className="text-gray-600 mt-2">Invited</div>
                </div>
              </Card>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "Checked In", value: statistics.checkedInCount },
                { name: "Checked Out", value: statistics.checkedOutCount },
                { name: "Invited", value: statistics.invitedCount },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#F2721E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffAttendance;
