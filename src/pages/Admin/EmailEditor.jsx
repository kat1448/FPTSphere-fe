import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  SendOutlined,
  QrcodeOutlined,
  PictureOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Select,
  Radio,
  Input,
  Tag,
  Space,
  message,
  Modal,
  Upload,
  Divider,
  ConfigProvider,
  Table,
  Tabs,
} from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { getEventById } from "../../services/events.api";
import dayjs from "dayjs";
import { Spin } from "antd";

const { Option } = Select;
const { TextArea } = Input;

const EmailEditor = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSubEventId, setSelectedSubEventId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("ticket-qr");
  const [sendTo, setSendTo] = useState("all");
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCustomListModal, setShowCustomListModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [formLink, setFormLink] = useState("");
  const [customRecipients, setCustomRecipients] = useState([]);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const editorRef = useRef(null);
  const isUpdatingContent = useRef(false);

  // Load sub-event data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!subEventId) return;

        // Fetch sub-event by ID
        const subEventData = await getEventById(subEventId);
        console.log("✅ Sub-event data loaded:", subEventData);
        
        // Transform sub-event data
        const locationName = subEventData.location?.name || 
                            subEventData.externalLocation?.name || 
                            subEventData.location?.roomNumber || 
                            "TBA";
        
        const transformedSubEvent = {
          ...subEventData,
          name: subEventData.eventName || "Sub-event",
          eventName: subEventData.eventName,
          startTime: subEventData.startTime,
          endTime: subEventData.endTime,
          location: locationName,
          expectedAttendees: subEventData.expectedAttendees || 0,
        };
        
        setSubEvent(transformedSubEvent);
        setSelectedSubEventId(subEventId);
        
        // If eventId is provided, also fetch main event
        if (eventId) {
          const mainEventData = await getEventById(eventId);
          console.log("✅ Main event data loaded:", mainEventData);
          setEvent(mainEventData);
          setSelectedEventId(eventId);
        }
        
        // Initialize email content with template and sub-event info
        const eventDate = dayjs(subEventData.startTime).format("MMMM DD, YYYY");
        const eventTime = dayjs(subEventData.startTime).format("hh:mm A");
        const eventEndTime = dayjs(subEventData.endTime).format("hh:mm A");
        
        // Template with actual sub-event data filled in
        const initialContent = `Hi {FirstName},<br><br>We are excited to see you at ${subEventData.eventName || "{EventName}"}! Please find your entry ticket below. Simply show this QR code at the registration desk for a quick check-in.<br><br>{QRCode}<br><br>Event Details:<br>Date: ${eventDate}<br>Time: ${eventTime} - ${eventEndTime}<br>Location: ${locationName}<br><br>See you there,<br>The Event Team`;
        
        setSubject(`Your Ticket for ${subEventData.eventName || "Event"}`);
        setEmailBody(initialContent);
        
        // Update editor content
        if (editorRef.current) {
          isUpdatingContent.current = true;
          editorRef.current.innerHTML = initialContent;
          setTimeout(() => {
            isUpdatingContent.current = false;
          }, 0);
        }
      } catch (error) {
        console.error("❌ Error loading sub-event:", error);
        message.error("Không thể tải dữ liệu sự kiện");
      }
    };

    fetchData();
  }, [eventId, subEventId]);

  // Sync emailBody to editor when changed externally (template, etc.)
  // Only update if editor is not focused (user is not typing)
  useEffect(() => {
    if (editorRef.current && !isUpdatingContent.current) {
      const editor = editorRef.current;
      const isFocused = document.activeElement === editor;
      // Only update if editor is not focused (user is not typing)
      if (!isFocused && editor.innerHTML !== emailBody) {
        isUpdatingContent.current = true;
        editor.innerHTML = emailBody;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
    }
  }, [emailBody]);

  // Handle event selection change
  const handleEventChange = (eventId) => {
    const selectedEvent = allEvents.find((e) => e.id === eventId);
    if (selectedEvent) {
      setEvent(selectedEvent);
      setSelectedEventId(eventId);
      // Reset sub-event to first one
      if (selectedEvent.subEvents && selectedEvent.subEvents.length > 0) {
        setSubEvent(selectedEvent.subEvents[0]);
        setSelectedSubEventId(0);
      } else {
        setSubEvent(null);
        setSelectedSubEventId(null);
      }
    }
  };

  // Handle sub-event selection change (if needed for future use)
  const handleSubEventChange = async (subEventId) => {
    try {
      const subEventData = await getEventById(subEventId);
      const locationName = subEventData.location?.name || 
                          subEventData.externalLocation?.name || 
                          subEventData.location?.roomNumber || 
                          "TBA";
      
      const transformedSubEvent = {
        ...subEventData,
        name: subEventData.eventName || "Sub-event",
        eventName: subEventData.eventName,
        startTime: subEventData.startTime,
        endTime: subEventData.endTime,
        location: locationName,
      };
      
      setSubEvent(transformedSubEvent);
      setSelectedSubEventId(subEventId);
      
      // Update email content with new sub-event data
      const eventDate = dayjs(subEventData.startTime).format("MMMM DD, YYYY");
      const eventTime = dayjs(subEventData.startTime).format("hh:mm A");
      const eventEndTime = dayjs(subEventData.endTime).format("hh:mm A");
      
      const content = `Hi {FirstName},<br><br>We are excited to see you at ${subEventData.eventName || "{EventName}"}! Please find your entry ticket below. Simply show this QR code at the registration desk for a quick check-in.<br><br>{QRCode}<br><br>Event Details:<br>Date: ${eventDate}<br>Time: ${eventTime} - ${eventEndTime}<br>Location: ${locationName}<br><br>See you there,<br>The Event Team`;
      
      setSubject(`Your Ticket for ${subEventData.eventName || "Event"}`);
      setEmailBody(content);
      
      const editor = getEditorElement();
      if (editor) {
        isUpdatingContent.current = true;
        editor.innerHTML = content;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
    } catch (error) {
      console.error("❌ Error loading sub-event:", error);
      message.error("Không thể tải dữ liệu sự kiện");
    }
  };

  // Variables available for use
  const variables = [
    { key: "{FirstName}", label: "First Name" },
    { key: "{LastName}", label: "Last Name" },
    { key: "{EventName}", label: "Event Name" },
    { key: "{TicketID}", label: "Ticket ID" },
    { key: "{QRCode}", label: "QR Code" },
    { key: "{Date}", label: "Event Date" },
    { key: "{Time}", label: "Event Time" },
    { key: "{Location}", label: "Location" },
  ];

  // Get contentEditable element
  const getEditorElement = () => {
    return document.getElementById("email-body-editor");
  };

  // Insert variable into email body
  const insertVariable = (variable) => {
    const editor = getEditorElement();
    if (editor) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(variable);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      editor.focus();
      // Update state
      setEmailBody(editor.innerHTML);
    } else {
      setEmailBody(emailBody + variable);
    }
  };

  // Format text functions
  const formatText = (command, value = null) => {
    const editor = getEditorElement();
    if (editor) {
      editor.focus();
      document.execCommand(command, false, value);
      // Update state
      setEmailBody(editor.innerHTML);
    }
  };

  // Handle Bold
  const handleBold = () => {
    formatText("bold");
  };

  // Handle Italic
  const handleItalic = () => {
    formatText("italic");
  };

  // Handle Underline
  const handleUnderline = () => {
    formatText("underline");
  };

  // Handle Align
  const handleAlign = (align) => {
    formatText("justifyLeft");
    if (align === "center") {
      formatText("justifyCenter");
    } else if (align === "right") {
      formatText("justifyRight");
    }
  };

  // Handle Insert Image
  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const editor = getEditorElement();
      if (editor) {
        editor.focus();
        document.execCommand("insertImage", false, url);
        setEmailBody(editor.innerHTML);
      }
    }
  };

  // Handle content change - preserve cursor position
  const handleContentChange = (e) => {
    if (isUpdatingContent.current) return;
    
    const editor = e.target;
    // Save cursor position before update
    const selection = window.getSelection();
    let savedRange = null;
    if (selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    
    // Update state
    const newContent = editor.innerHTML;
    setEmailBody(newContent);
    
    // Restore cursor position after React re-render
    if (savedRange) {
      requestAnimationFrame(() => {
        try {
          const editorElement = getEditorElement();
          if (editorElement) {
            const newSelection = window.getSelection();
            // Try to restore range
            try {
              newSelection.removeAllRanges();
              newSelection.addRange(savedRange);
            } catch (err) {
              // If range is invalid, place cursor at end
              const range = document.createRange();
              range.selectNodeContents(editorElement);
              range.collapse(false);
              newSelection.removeAllRanges();
              newSelection.addRange(range);
            }
          }
        } catch (error) {
          // Ignore errors
        }
      });
    }
  };

  // Generate QR Code
  const generateQRCode = () => {
    // Generate QR code URL (using a QR code API or library)
    const qrData = JSON.stringify({
      eventId: eventId,
      subEventId: subEventId,
      ticketId: `TICKET-${Date.now()}`,
    });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  // Create Google Form
  const createGoogleForm = () => {
    setShowFormModal(true);
  };

  // Handle template selection - fill in actual sub-event data
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    const editor = getEditorElement();
    
    if (!subEvent) return;
    
    const eventDate = dayjs(subEvent.startTime).format("MMMM DD, YYYY");
    const eventTime = dayjs(subEvent.startTime).format("hh:mm A");
    const eventEndTime = dayjs(subEvent.endTime).format("hh:mm A");
    const locationName = subEvent.location || "TBA";
    const eventName = subEvent.eventName || subEvent.name || "{EventName}";
    
    if (template === "ticket-qr") {
      const content = `Hi {FirstName},<br><br>We are excited to see you at ${eventName}! Please find your entry ticket below. Simply show this QR code at the registration desk for a quick check-in.<br><br>{QRCode}<br><br>Event Details:<br>Date: ${eventDate}<br>Time: ${eventTime} - ${eventEndTime}<br>Location: ${locationName}<br><br>See you there,<br>The Event Team`;
      setEmailBody(content);
      if (editor) {
        isUpdatingContent.current = true;
        editor.innerHTML = content;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
    } else if (template === "announcement") {
      const content = `Hi {FirstName},<br><br>We have an important announcement regarding ${eventName}.<br><br>{Content}<br><br>Best regards,<br>The Event Team`;
      setEmailBody(content);
      if (editor) {
        isUpdatingContent.current = true;
        editor.innerHTML = content;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
    }
  };

  // Handle custom list selection
  const handleCustomListSelect = () => {
    setShowCustomListModal(true);
  };

  // Add manual recipient
  const handleAddManualRecipient = () => {
    if (!manualEmail.trim()) {
      message.error("Please enter an email address");
      return;
    }
    const newRecipient = {
      id: Date.now(),
      email: manualEmail,
      name: manualName || manualEmail.split("@")[0],
    };
    setCustomRecipients([...customRecipients, newRecipient]);
    setManualEmail("");
    setManualName("");
    message.success("Recipient added");
  };

  // Remove recipient
  const handleRemoveRecipient = (id) => {
    setCustomRecipients(customRecipients.filter((r) => r.id !== id));
  };

  // Handle CSV upload
  const handleCSVUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const newRecipients = [];
      
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const [email, name] = line.split(",").map((s) => s.trim());
        if (email && email.includes("@")) {
          newRecipients.push({
            id: Date.now() + index,
            email,
            name: name || email.split("@")[0],
          });
        }
      });
      
      setCustomRecipients([...customRecipients, ...newRecipients]);
      message.success(`Added ${newRecipients.length} recipients from CSV`);
    };
    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  // Save custom list
  const handleSaveCustomList = () => {
    if (customRecipients.length === 0) {
      message.error("Please add at least one recipient");
      return;
    }
    setSendTo("custom");
    setShowCustomListModal(false);
    message.success(`Custom list saved with ${customRecipients.length} recipients`);
  };

  // Calculate recipients count
  const getRecipientsCount = () => {
    const attendees = subEvent?.expectedAttendees || 0;
    switch (sendTo) {
      case "all":
        return attendees;
      case "checked-in":
        return Math.floor(attendees * 0.3); // Estimate 30% checked in
      case "not-checked-in":
        return Math.floor(attendees * 0.7); // Estimate 70% not checked in
      case "custom":
        return customRecipients.length;
      default:
        return 0;
    }
  };

  // Handle send
  const handleSend = () => {
    if (!subject.trim()) {
      message.error("Please enter a subject");
      return;
    }
    if (!emailBody.trim()) {
      message.error("Please enter email content");
      return;
    }

    Modal.confirm({
      title: "Send Email",
      content: `Are you sure you want to send this email to ${getRecipientsCount()} recipients?`,
      okText: "Send",
      cancelText: "Cancel",
      onOk: () => {
        // TODO: Implement actual email sending
        message.success(`Email sent to ${getRecipientsCount()} recipients successfully!`);
        navigate(`/admin/events/${eventId}/sub-events/${subEventId}/detail`);
      },
    });
  };

  // Handle save draft
  const handleSaveDraft = () => {
    // TODO: Save draft to localStorage or backend
    message.success("Draft saved successfully");
  };

  // Handle preview
  const handlePreview = () => {
    Modal.info({
      title: "Email Preview",
      width: 800,
      content: (
        <div className="p-4">
          <div className="mb-4">
            <strong>Subject:</strong> {subject}
          </div>
          <Divider />
          <div
            dangerouslySetInnerHTML={{ __html: emailBody }}
            style={{
              border: "1px solid #e5e7eb",
              padding: "16px",
              borderRadius: "4px",
              backgroundColor: "#fff",
            }}
          />
        </div>
      ),
    });
  };

  if (!subEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Ant Design theme config
  const themeConfig = {
    token: {
      colorPrimary: "#F2721E",
      colorPrimaryHover: "#E8651A",
      colorPrimaryActive: "#D85A15",
      borderRadius: 6,
    },
    components: {
      Radio: {
        colorPrimary: "#F2721E",
        dotColorDisabled: "#F2721E",
      },
      Select: {
        colorPrimary: "#F2721E",
        optionSelectedBg: "#FFF5ED",
        controlItemBgHover: "#FFF5ED",
      },
      Button: {
        colorPrimary: "#F2721E",
        colorPrimaryHover: "#E8651A",
        colorPrimaryActive: "#D85A15",
      },
      Tag: {
        colorPrimary: "#F2721E",
      },
      Modal: {
        colorPrimary: "#F2721E",
      },
    },
  };

  return (
    <ConfigProvider theme={themeConfig}>
      <style>{`
        .ant-radio-checked .ant-radio-inner {
          border-color: #F2721E !important;
          background-color: #FFF5ED !important;
        }
        .ant-radio-checked .ant-radio-inner::after {
          background-color: #F2721E !important;
        }
        .ant-radio-wrapper:hover .ant-radio-inner {
          border-color: #F2721E !important;
        }
        .ant-radio-wrapper:hover .ant-radio-checked .ant-radio-inner {
          background-color: #FFF5ED !important;
        }
        .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          background-color: #FFF5ED !important;
          color: #F2721E !important;
        }
        .ant-select-item-option:hover {
          background-color: #FFF5ED !important;
        }
        .ant-select-focused .ant-select-selector {
          border-color: #F2721E !important;
          box-shadow: 0 0 0 2px rgba(242, 114, 30, 0.2) !important;
        }
        .ant-select-selector:hover {
          border-color: #F2721E !important;
        }
        .ant-btn-primary {
          background-color: #F2721E !important;
          border-color: #F2721E !important;
        }
        .ant-btn-primary:hover {
          background-color: #E8651A !important;
          border-color: #E8651A !important;
        }
        .ant-modal-confirm-btns .ant-btn-primary {
          background-color: #F2721E !important;
          border-color: #F2721E !important;
        }
        .ant-tag {
          border-color: #F2721E !important;
          color: #F2721E !important;
        }
        .ant-tag:hover {
          background-color: #FFF5ED !important;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/detail`)}
            className="p-0 mb-2 text-[14px] text-gray-600 hover:text-[#F2721E]"
          >
            Back to Sub-event Detail
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Email Editor</h1>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Recipients Section */}
            <Card
              title={<span className="text-[14px] font-semibold">Recipients</span>}
              className="shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Target Event</label>
                  <Select
                    value={selectedEventId}
                    onChange={handleEventChange}
                    style={{ width: "100%" }}
                    placeholder="Select Event"
                  >
                    {allEvents.map((ev) => (
                      <Option key={ev.id} value={ev.id}>
                        {ev.mainEvent?.name || `Event ${ev.id}`}
                      </Option>
                    ))}
                  </Select>
                </div>
                {event && event.subEvents && event.subEvents.length > 0 && (
                  <div>
                    <label className="text-[12px] text-gray-600 mb-2 block">Sub-Event</label>
                    <Select
                      value={selectedSubEventId}
                      onChange={handleSubEventChange}
                      style={{ width: "100%" }}
                      placeholder="Select Sub-Event"
                    >
                      {event.subEvents.map((sub, index) => (
                        <Option key={index} value={index}>
                          {sub.name || `Sub-Event ${index + 1}`}
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Send To</label>
                  <Radio.Group
                    value={sendTo}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        handleCustomListSelect();
                      } else {
                        setSendTo(e.target.value);
                      }
                    }}
                  >
                    <Space direction="vertical" className="w-full">
                      <Radio value="all">
                        All Attendees ({subEvent.expectedAttendees || 0})
                      </Radio>
                      <Radio value="checked-in">
                        Checked-in Only ({Math.floor((subEvent.expectedAttendees || 0) * 0.3)})
                      </Radio>
                      <Radio value="not-checked-in">
                        Not Checked-in ({Math.floor((subEvent.expectedAttendees || 0) * 0.7)})
                      </Radio>
                      <Radio value="custom">
                        Custom List ({customRecipients.length > 0 ? customRecipients.length : "Upload CSV"})
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
              </div>
            </Card>

            {/* Template Section */}
            <Card
              title={<span className="text-[14px] font-semibold">Template</span>}
              className="shadow-sm"
            >
              <div className="space-y-3">
                <div
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplate === "ticket-qr"
                      ? "border-[#F2721E] bg-[#FFF5ED]"
                      : "border-gray-200 hover:border-[#F2721E]"
                  }`}
                  onClick={() => handleTemplateSelect("ticket-qr")}
                >
                  <div className="text-[12px] font-medium mb-2">Ticket with QR</div>
                  <div className="bg-gray-100 rounded p-2 h-16 flex items-center justify-center">
                    <QrcodeOutlined className="text-2xl text-gray-400" />
                  </div>
                </div>
                <div
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplate === "announcement"
                      ? "border-[#F2721E] bg-[#FFF5ED]"
                      : "border-gray-200 hover:border-[#F2721E]"
                  }`}
                  onClick={() => handleTemplateSelect("announcement")}
                >
                  <div className="text-[12px] font-medium mb-2">Announcement</div>
                  <div className="bg-gray-100 rounded p-2 h-16 flex items-center justify-center">
                    <FileTextOutlined className="text-2xl text-gray-400" />
                  </div>
                </div>
                <Button
                  type="dashed"
                  block
                  className="mt-2"
                  style={{ fontSize: "12px" }}
                >
                  + Create New Template
                </Button>
              </div>
            </Card>

            {/* Actions */}
            <Card className="shadow-sm">
              <div className="space-y-3">
                <Button
                  type="primary"
                  block
                  icon={<QrcodeOutlined />}
                  onClick={generateQRCode}
                  style={{
                    backgroundColor: "#F2721E",
                    borderColor: "#F2721E",
                    fontSize: "13px",
                  }}
                >
                  Generate QR Code
                </Button>
                <Button
                  type="default"
                  block
                  icon={<FileTextOutlined />}
                  onClick={createGoogleForm}
                  style={{
                    fontSize: "13px",
                    borderColor: "#F2721E",
                    color: "#F2721E",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#FFF5ED";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                >
                  Create Google Form
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Column - Email Editor */}
          <div className="col-span-2">
            <Card
              title={<span className="text-[14px] font-semibold">Email Editor</span>}
              extra={
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    style={{ fontSize: "13px" }}
                  >
                    Preview
                  </Button>
                  <Button
                    icon={<SendOutlined />}
                    style={{ fontSize: "13px" }}
                  >
                    Test Send
                  </Button>
                </Space>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    style={{ fontSize: "14px" }}
                  />
                </div>

                {/* Variables */}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Variables:</label>
                  <Space wrap>
                    {variables.map((variable) => (
                      <Tag
                        key={variable.key}
                        className="cursor-pointer hover:bg-[#FFF5ED]"
                        onClick={() => insertVariable(variable.key)}
                        style={{
                          fontSize: "12px",
                          borderColor: "#F2721E",
                          color: "#F2721E",
                        }}
                      >
                        {variable.key}
                      </Tag>
                    ))}
                  </Space>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <Button
                    type="text"
                    icon={<BoldOutlined />}
                    size="small"
                    title="Bold"
                    onClick={handleBold}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<ItalicOutlined />}
                    size="small"
                    title="Italic"
                    onClick={handleItalic}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<UnderlineOutlined />}
                    size="small"
                    title="Underline"
                    onClick={handleUnderline}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Divider type="vertical" />
                  <Button
                    type="text"
                    icon={<AlignLeftOutlined />}
                    size="small"
                    title="Align Left"
                    onClick={() => handleAlign("left")}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<AlignCenterOutlined />}
                    size="small"
                    title="Align Center"
                    onClick={() => handleAlign("center")}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<AlignRightOutlined />}
                    size="small"
                    title="Align Right"
                    onClick={() => handleAlign("right")}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Divider type="vertical" />
                  <Button
                    type="text"
                    icon={<QrcodeOutlined />}
                    size="small"
                    onClick={() => insertVariable("{QRCode}")}
                    title="Insert QR Code"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<PictureOutlined />}
                    size="small"
                    onClick={handleInsertImage}
                    title="Insert Image"
                    onMouseDown={(e) => e.preventDefault()}
                  />
                </div>

                {/* Email Body - Rich Text Editor */}
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Email Body</label>
                  <div
                    id="email-body-editor"
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    suppressContentEditableWarning
                    className="min-h-[300px] p-3 border border-gray-300 rounded bg-white focus:border-[#F2721E] focus:outline-none focus:ring-2 focus:ring-[#F2721E]/20"
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.5",
                      overflowY: "auto",
                    }}
                    placeholder="Enter email content..."
                  />
                  <style>{`
                    #email-body-editor:empty:before {
                      content: attr(placeholder);
                      color: #bfbfbf;
                      pointer-events: none;
                    }
                    #email-body-editor:focus {
                      border-color: #F2721E !important;
                      outline: none;
                      box-shadow: 0 0 0 2px rgba(242, 114, 30, 0.2);
                    }
                    #email-body-editor img {
                      max-width: 100%;
                      height: auto;
                    }
                  `}</style>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button onClick={handleSaveDraft} style={{ fontSize: "13px" }}>
                    Save Draft
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    style={{
                      backgroundColor: "#F2721E",
                      borderColor: "#F2721E",
                      fontSize: "13px",
                    }}
                  >
                    Send to {getRecipientsCount()} Recipients
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* QR Code Modal */}
        <Modal
          title="QR Code Generated"
          open={showQRModal}
          onCancel={() => setShowQRModal(false)}
          footer={[
            <Button key="insert" type="primary" onClick={() => {
              insertVariable("{QRCode}");
              setShowQRModal(false);
            }}>
              Insert into Email
            </Button>,
            <Button key="close" onClick={() => setShowQRModal(false)}>
              Close
            </Button>,
          ]}
        >
          <div className="text-center">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
            )}
            <p className="text-[12px] text-gray-600">
              QR code has been generated. Click "Insert into Email" to add it to your email template.
            </p>
          </div>
        </Modal>

        {/* Google Form Modal */}
        <Modal
          title="Create Google Form"
          open={showFormModal}
          onCancel={() => setShowFormModal(false)}
          footer={null}
          width={800}
        >
          <div className="text-center py-4">
            <p className="text-[14px] text-gray-600 mb-4">
              Redirecting to Google Form Builder...
            </p>
            <Button
              type="primary"
              onClick={() => {
                // Navigate to form builder with event data
                navigate(`/admin/events/${eventId}/sub-events/${subEventId}/form-builder`, {
                  state: {
                    eventName: subEvent.name,
                    description: subEvent.description || "",
                    startTime: subEvent.startTime,
                    endTime: subEvent.endTime,
                    location: subEvent.location,
                  },
                });
              }}
              style={{
                backgroundColor: "#F2721E",
                borderColor: "#F2721E",
              }}
            >
              Go to Form Builder
            </Button>
          </div>
        </Modal>

        {/* Custom List Modal */}
        <Modal
          title="Custom Recipients List"
          open={showCustomListModal}
          onCancel={() => setShowCustomListModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowCustomListModal(false)}>
              Cancel
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleSaveCustomList}
              style={{
                backgroundColor: "#F2721E",
                borderColor: "#F2721E",
              }}
            >
              Save List ({customRecipients.length} recipients)
            </Button>,
          ]}
          width={700}
        >
          <Tabs
            defaultActiveKey="manual"
            items={[
              {
                key: "manual",
                label: "Add Manually",
                children: (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[12px] text-gray-600 mb-1 block">Email</label>
                        <Input
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="email@example.com"
                          type="email"
                          onPressEnter={handleAddManualRecipient}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[12px] text-gray-600 mb-1 block">Name (optional)</label>
                        <Input
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="Full Name"
                          onPressEnter={handleAddManualRecipient}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="primary"
                          onClick={handleAddManualRecipient}
                          style={{
                            backgroundColor: "#F2721E",
                            borderColor: "#F2721E",
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    {customRecipients.length > 0 && (
                      <div>
                        <div className="text-[12px] text-gray-600 mb-2">
                          Recipients ({customRecipients.length})
                        </div>
                        <div className="max-h-64 overflow-y-auto border rounded p-2">
                          <Table
                            dataSource={customRecipients}
                            columns={[
                              {
                                title: "Name",
                                dataIndex: "name",
                                key: "name",
                              },
                              {
                                title: "Email",
                                dataIndex: "email",
                                key: "email",
                              },
                              {
                                title: "Action",
                                key: "action",
                                render: (_, record) => (
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => handleRemoveRecipient(record.id)}
                                  >
                                    Remove
                                  </Button>
                                ),
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="id"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "upload",
                label: "Upload CSV/Excel",
                children: (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] text-gray-600 mb-2 block">
                        Upload CSV File (Format: email,name)
                      </label>
                      <Upload
                        accept=".csv,.xlsx,.xls"
                        beforeUpload={handleCSVUpload}
                        showUploadList={false}
                      >
                        <Button
                          type="primary"
                          block
                          style={{
                            backgroundColor: "#F2721E",
                            borderColor: "#F2721E",
                          }}
                        >
                          Upload CSV/Excel File
                        </Button>
                      </Upload>
                      <p className="text-[11px] text-gray-500 mt-2">
                        CSV format: email,name (one per line)
                      </p>
                    </div>
                    {customRecipients.length > 0 && (
                      <div>
                        <div className="text-[12px] text-gray-600 mb-2">
                          Recipients ({customRecipients.length})
                        </div>
                        <div className="max-h-64 overflow-y-auto border rounded p-2">
                          <Table
                            dataSource={customRecipients}
                            columns={[
                              {
                                title: "Name",
                                dataIndex: "name",
                                key: "name",
                              },
                              {
                                title: "Email",
                                dataIndex: "email",
                                key: "email",
                              },
                              {
                                title: "Action",
                                key: "action",
                                render: (_, record) => (
                                  <Button
                                    type="link"
                                    danger
                                    size="small"
                                    onClick={() => handleRemoveRecipient(record.id)}
                                  >
                                    Remove
                                  </Button>
                                ),
                              },
                            ]}
                            pagination={false}
                            size="small"
                            rowKey="id"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Modal>
      </div>
    </div>
    </ConfigProvider>
  );
};

export default EmailEditor;
