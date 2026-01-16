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
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  PictureOutlined,
  SendOutlined,
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
  Checkbox,
} from "antd";
import { getEventById, generateQRCode } from "../../services/events.api";
import { syncParticipants, refreshParticipants, getParticipants } from "../../services/participants.api";
import apiClient from "../../services/api.js";
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

const StaffInviteStudent = () => {
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
  const [importedData, setImportedData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const [sendEmailModalVisible, setSendEmailModalVisible] = useState(false);
  const [emailForm] = Form.useForm();
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const editorRef = React.useRef(null);

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

  // Filter participants
  const filteredParticipants = useMemo(() => {
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
    
    const headers = ["Email", "Tên"];
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

  // Download Excel sample - Format: MSSV / Họ và tên / Email
  const downloadExcelFormat = () => {
    const workbook = XLSX.utils.book_new();
    
    const headers = ["MSSV", "Họ và tên", "Email"];
    const sampleData = [
      ["SE12345", "Nguyễn Văn An", "student1@fpt.edu.vn"],
      ["SE12346", "Trần Thị Bình", "student2@fpt.edu.vn"],
      ["SE12347", "Lê Minh Cường", "student3@fpt.edu.vn"],
    ];

    const data = [headers, ...sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = [
      { wch: 15 },  // MSSV
      { wch: 25 },  // Họ và tên
      { wch: 30 },  // Email
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "invite-students-template.xlsx");
    message.success("Excel template downloaded successfully");
  };

  // Upload file to API
  const uploadFile = async (file) => {
    try {
      setUploadingFile(true);
      
      const formData = new FormData();
      formData.append("File", file);

      const response = await apiClient.post("/Files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "*/*",
        },
      });

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data?.data || response.data;
        message.success("File uploaded successfully");
        
        // Parse Excel file to extract data
        await parseExcelFile(file);
        
        return responseData;
      }

      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload file";
      message.error(errorMessage);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  };

  // Parse Excel file
  const parseExcelFile = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Skip header row and parse data
          const parsedData = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 3) {
              parsedData.push({
                key: i,
                mssv: row[0]?.toString().trim() || "",
                fullName: row[1]?.toString().trim() || "",
                email: row[2]?.toString().trim() || "",
              });
            }
          }

          setImportedData(parsedData);
          setSelectedRowKeys([]);
          message.success(`Imported ${parsedData.length} students`);
        } catch (parseError) {
          console.error("Error parsing Excel:", parseError);
          message.error("Failed to parse Excel file. Please check the format.");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      message.error("Failed to read file");
    }
  };

  // Handle Excel import
  const handleExcelImport = async (file) => {
    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      message.error("Only Excel files (.xlsx, .xls) are accepted");
      return false;
    }

    try {
      // Upload file first
      await uploadFile(file);
      setImportedFileName(file.name);
    } catch (error) {
      // Error already handled in uploadFile
    }

    return false; // Prevent auto upload
  };

  // Rich text editor functions
  const handleContentChange = (e) => {
    const newContent = e.target.innerHTML;
    setEmailBody(newContent);
  };

  const handleFormatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setEmailBody(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      
      if (editorRef.current) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
        } else {
          editorRef.current.appendChild(img);
        }
        editorRef.current.focus();
        setEmailBody(editorRef.current.innerHTML);
      }
    }
  };

  // Table columns for imported data
  const importedColumns = [
    {
      title: "STT",
      key: "stt",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "MSSV",
      dataIndex: "mssv",
      key: "mssv",
      sorter: (a, b) => {
        if (!a.mssv || !b.mssv) return 0;
        return a.mssv.localeCompare(b.mssv);
      },
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Họ và tên",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => {
        if (!a.fullName || !b.fullName) return 0;
        return a.fullName.localeCompare(b.fullName);
      },
      render: (text) => <span className="font-semibold">{text}</span>,
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
  ];

  // Table columns with sorting (for participants)
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
      render: (status) => {
        if (!status) {
          return <Tag color="default">Unknown</Tag>;
        }
        
        const normalizeStatus = (s) => {
          return (s?.toLowerCase() || "")
            .replace(/\s+/g, "")
            .replace(/_/g, "")
            .replace(/-/g, "");
        };
        
        const normalizedStatus = normalizeStatus(status);
        
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

  // Row selection for imported data
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

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
            <Title level={2} style={{ margin: 0 }}>Invite Students</Title>
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
          {importedFileName ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Text type="secondary">Imported file:</Text>
                <Text strong>{importedFileName}</Text>
              </div>
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleExcelImport}
                showUploadList={false}
                disabled={uploadingFile}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="default"
                  loading={uploadingFile}
                >
                  {uploadingFile ? "Uploading..." : "Change File"}
                </Button>
              </Upload>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Upload
                accept=".xlsx,.xls"
                beforeUpload={handleExcelImport}
                showUploadList={false}
                disabled={uploadingFile}
              >
                <Button
                  icon={<UploadOutlined />}
                  type="primary"
                  loading={uploadingFile}
                  style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
                >
                  {uploadingFile ? "Uploading..." : "Import Excel"}
                </Button>
              </Upload>
              <Button
                icon={<DownloadOutlined />}
                onClick={downloadExcelFormat}
                type="default"
              >
                Download Format Excel
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <Input
            placeholder="Search by MSSV, name, email..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            onClick={() => {
              // Get selected emails
              const selectedEmails = importedData
                .filter((item) => selectedRowKeys.includes(item.key))
                .map((item) => item.email)
                .filter((email) => email && email.trim() !== "");
              
              emailForm.setFieldsValue({
                emails: selectedEmails.join("\n"),
              });
              setEmailBody("");
              if (editorRef.current) {
                editorRef.current.innerHTML = "";
              }
              setSendEmailModalVisible(true);
            }}
            disabled={importedData.length === 0 || selectedRowKeys.length === 0}
            style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
          >
            SEND EMAIL
          </Button>
        </div>

        {importedData.length > 0 ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Text strong>
                Imported Data ({importedData.length} students, {selectedRowKeys.length} selected)
              </Text>
              <Button
                onClick={() => {
                  setImportedData([]);
                  setSelectedRowKeys([]);
                }}
                type="default"
              >
                Clear
              </Button>
            </div>
            <Table
              columns={importedColumns}
              dataSource={importedData.filter((item) => {
                if (!searchText) return true;
                const searchLower = searchText.toLowerCase();
                return (
                  item.mssv?.toLowerCase().includes(searchLower) ||
                  item.fullName?.toLowerCase().includes(searchLower) ||
                  item.email?.toLowerCase().includes(searchLower)
                );
              })}
              rowSelection={rowSelection}
              rowKey="key"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} students`,
              }}
            />
          </div>
        ) : (
          <Empty description="No imported data. Please import Excel file first." />
        )}
      </Card>

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
              Columns: STT, Timestamp, Email, Họ và tên
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
              Columns: Email, Tên
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

      {/* Send Email Modal */}
      <Modal
        title="Send Email"
        open={sendEmailModalVisible}
        onCancel={() => {
          setSendEmailModalVisible(false);
          emailForm.resetFields();
          setEmailBody("");
          if (editorRef.current) {
            editorRef.current.innerHTML = "";
          }
        }}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              if (!emailBody || emailBody.trim() === "") {
                message.error("Please enter email content");
                return;
              }

              // Parse email list from textarea (one per line)
              const emailList = values.emails
                .split("\n")
                .map((e) => e.trim())
                .filter((e) => e);

              if (emailList.length === 0) {
                message.error("Please enter at least one email address");
                return;
              }

              setSendingEmail(true);

              // Call API to send email
              const response = await apiClient.post("/Events/staff/send-email", {
                emailList: emailList,
                subject: values.subject,
                body: emailBody, // HTML content from rich text editor
              });

              if (response.data?.success !== false) {
                message.success("Email sent successfully");
                setSendEmailModalVisible(false);
                emailForm.resetFields();
                setEmailBody("");
                if (editorRef.current) {
                  editorRef.current.innerHTML = "";
                }
                // Clear selected rows after sending
                setSelectedRowKeys([]);
              } else {
                message.error(response.data?.message || "Failed to send email");
              }
            } catch (error) {
              console.error("Error sending email:", error);
              message.error(
                error.response?.data?.message ||
                error.message ||
                "Failed to send email. Please try again."
              );
            } finally {
              setSendingEmail(false);
            }
          }}
        >
          <Form.Item
            name="emails"
            label="To"
            rules={[
              { required: true, message: "Please enter email addresses" },
              {
                validator: (_, value) => {
                  if (!value || value.trim() === "") {
                    return Promise.reject(new Error("Please enter at least one email"));
                  }
                  const emails = value.split("\n").map((e) => e.trim()).filter((e) => e);
                  if (emails.length === 0) {
                    return Promise.reject(new Error("Please enter at least one email"));
                  }
                  // Basic email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  const invalidEmails = emails.filter((email) => !emailRegex.test(email));
                  if (invalidEmails.length > 0) {
                    return Promise.reject(new Error(`Invalid email format: ${invalidEmails.join(", ")}`));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter email addresses (one per line)"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[
              { required: true, message: "Please enter email subject" },
            ]}
          >
            <Input
              placeholder="Enter email subject"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          {/* Rich Text Editor Toolbar */}
          <div className="mb-2 flex items-center gap-1 border-b pb-2">
            <Button
              type="text"
              icon={<BoldOutlined />}
              size="small"
              onClick={() => handleFormatText("bold")}
              title="Bold"
              onMouseDown={(e) => e.preventDefault()}
            />
            <Button
              type="text"
              icon={<ItalicOutlined />}
              size="small"
              onClick={() => handleFormatText("italic")}
              title="Italic"
              onMouseDown={(e) => e.preventDefault()}
            />
            <Button
              type="text"
              icon={<UnderlineOutlined />}
              size="small"
              onClick={() => handleFormatText("underline")}
              title="Underline"
              onMouseDown={(e) => e.preventDefault()}
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type="text"
              icon={<AlignLeftOutlined />}
              size="small"
              onClick={() => handleFormatText("justifyLeft")}
              title="Align Left"
              onMouseDown={(e) => e.preventDefault()}
            />
            <Button
              type="text"
              icon={<AlignCenterOutlined />}
              size="small"
              onClick={() => handleFormatText("justifyCenter")}
              title="Align Center"
              onMouseDown={(e) => e.preventDefault()}
            />
            <Button
              type="text"
              icon={<AlignRightOutlined />}
              size="small"
              onClick={() => handleFormatText("justifyRight")}
              title="Align Right"
              onMouseDown={(e) => e.preventDefault()}
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              type="text"
              icon={<PictureOutlined />}
              size="small"
              onClick={handleInsertImage}
              title="Insert Image"
              onMouseDown={(e) => e.preventDefault()}
            />
          </div>

          {/* Rich Text Editor */}
          <Form.Item
            label="Email Content"
            rules={[
              { required: true, message: "Please enter email content" },
            ]}
          >
            <div
              id="send-email-editor"
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              suppressContentEditableWarning
              className="min-h-[400px] p-4 border border-gray-300 rounded bg-white focus:border-[#F2721E] focus:outline-none focus:ring-2 focus:ring-[#F2721E]/20"
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                overflowY: "auto",
              }}
              placeholder="Enter email content..."
            />
            <style>{`
              #send-email-editor:empty:before {
                content: attr(placeholder);
                color: #bfbfbf;
                pointer-events: none;
              }
              #send-email-editor:focus {
                border-color: #F2721E !important;
                outline: none;
                box-shadow: 0 0 0 2px rgba(242, 114, 30, 0.2);
              }
              #send-email-editor img {
                max-width: 100%;
                height: auto;
                margin: 8px 0;
              }
            `}</style>
          </Form.Item>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              onClick={() => {
                setSendEmailModalVisible(false);
                emailForm.resetFields();
                setEmailBody("");
                if (editorRef.current) {
                  editorRef.current.innerHTML = "";
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              htmlType="submit"
              loading={sendingEmail}
              disabled={sendingEmail}
              style={{
                backgroundColor: "#F2721E",
                borderColor: "#F2721E",
              }}
            >
              Send
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffInviteStudent;
