import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
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
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  MailOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Tag,
  Space,
  message,
  Modal,
  Upload,
  Divider,
  Table,
  Tabs,
  Select,
  Radio,
} from "antd";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import { getEventById } from "../../services/events.api";
import { getTasksByEventId } from "../../services/eventTasks.api";
import { Spin } from "antd";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { TabPane } = Tabs;

// Mock users/staff list - replace with API call later
const MOCK_USERS = [
  { id: 1, name: "Nguyen Van A", email: "a.nguyen@fpt.edu.vn", role: "Staff" },
  { id: 2, name: "Tran Thi B", email: "b.tran@fpt.edu.vn", role: "Staff" },
  { id: 3, name: "Le Van C", email: "c.le@fpt.edu.vn", role: "Manager" },
  { id: 4, name: "Pham Thi D", email: "d.pham@fpt.edu.vn", role: "Staff" },
  { id: 5, name: "Hoang Van E", email: "e.hoang@fpt.edu.vn", role: "Staff" },
];

const StakeholderFeedbackEmail = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [stakeholders, setStakeholders] = useState([]);
  const [showCustomListModal, setShowCustomListModal] = useState(false);
  const [customRecipients, setCustomRecipients] = useState([]);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [feedbackRecipient, setFeedbackRecipient] = useState("director"); // "director" or "creator"
  const [includeFeedbackForm, setIncludeFeedbackForm] = useState(true);
  const [feedbackFormLink, setFeedbackFormLink] = useState("");
  const editorRef = useRef(null);
  const isUpdatingContent = useRef(false);

  // Load event and sub-event data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch main event (parent event) if needed
        if (eventId) {
          const mainEventData = await getEventById(eventId);
          console.log("✅ Main event data loaded:", mainEventData);
          setEvent(mainEventData);
        }

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
        };
        
        setSubEvent(transformedSubEvent);
        
        // Fetch tasks for this sub-event to get assigned users
        try {
          const tasks = await getTasksByEventId(subEventId);
          console.log("✅ Tasks loaded:", tasks);
          
          // Extract unique assignees from tasks
          const assigneesMap = new Map();
          tasks.forEach((task) => {
            if (task.assignedTo && task.assignedToName) {
              if (!assigneesMap.has(task.assignedTo)) {
                assigneesMap.set(task.assignedTo, {
                  id: task.assignedTo,
                  name: task.assignedToName,
                  email: task.assignedToEmail || `${task.assignedToName.toLowerCase().replace(/\s+/g, '.')}@fpt.edu.vn`,
                });
              }
            }
          });
          
          // Convert map to array and set as stakeholders
          const stakeholdersList = Array.from(assigneesMap.values());
          if (stakeholdersList.length > 0) {
            setStakeholders(stakeholdersList);
            console.log("✅ Stakeholders loaded from tasks:", stakeholdersList);
          }
        } catch (taskError) {
          console.warn("⚠️ Could not load tasks:", taskError);
          // Continue without tasks - user can still add stakeholders manually
        }
        
        // Initialize email content
        const eventCreator = subEventData.creator?.fullName || user?.name || "Event Organizer";
        const eventCreatorEmail = subEventData.creator?.email || user?.email || "";
        
        const initialContent = `Kính gửi Stakeholder,<br><br>Chúng tôi hy vọng thông điệp này đến với bạn trong tình trạng tốt. Chúng tôi đang liên hệ để yêu cầu phản hồi quý giá của bạn về sự kiện sau:<br><br><strong>Sự kiện:</strong> ${subEventData.eventName || "Sự kiện"}<br><strong>Ngày:</strong> ${dayjs(subEventData.startTime).format("DD/MM/YYYY")}<br><strong>Thời gian:</strong> ${dayjs(subEventData.startTime).format("HH:mm")} - ${dayjs(subEventData.endTime).format("HH:mm")}<br><strong>Địa điểm:</strong> ${locationName}<br><br>Phản hồi của bạn rất quan trọng để giúp chúng tôi cải thiện các sự kiện trong tương lai. Vui lòng dành vài phút để chia sẻ suy nghĩ và đề xuất của bạn.<br><br>Cảm ơn bạn đã dành thời gian và tham gia.<br><br>Trân trọng,<br>${eventCreator}`;
        
        setSubject(`Yêu cầu phản hồi: ${subEventData.eventName || "Sự kiện"}`);
        setEmailBody(initialContent);
        
        // Update editor content
        if (editorRef.current) {
          isUpdatingContent.current = true;
          editorRef.current.innerHTML = initialContent;
          setTimeout(() => {
            isUpdatingContent.current = false;
          }, 0);
        }
        
        // Generate feedback form link
        setFeedbackFormLink(`https://forms.google.com/feedback/${eventId}/${subEventId}`);
      } catch (error) {
        console.error("❌ Error loading event:", error);
        message.error("Không thể tải dữ liệu sự kiện");
      }
    };

    if (subEventId) {
      fetchData();
    }
  }, [eventId, subEventId, user]);

  // Get director name (from creator if available)
  const getDirectorName = () => {
    if (subEvent?.creator?.fullName) {
      return subEvent.creator.fullName;
    }
    return "Director";
  };

  // Get event creator name
  const getEventCreator = () => {
    if (subEvent?.creator?.fullName) {
      return subEvent.creator.fullName;
    }
    return user?.name || user?.email || "Event Organizer";
  };

  // Get contentEditable element
  const getEditorElement = () => {
    return document.getElementById("stakeholder-email-editor");
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
            try {
              newSelection.removeAllRanges();
              newSelection.addRange(savedRange);
            } catch (err) {
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

  // Formatting functions
  const handleFormat = (command, value = null) => {
    const editor = getEditorElement();
    if (editor) {
      editor.focus();
      document.execCommand(command, false, value);
      setEmailBody(editor.innerHTML);
    }
  };

  const handleAlign = (align) => {
    handleFormat("justify" + align.charAt(0).toUpperCase() + align.slice(1));
  };

  // Insert variable into email body
  const insertVariable = (variable) => {
    const editor = getEditorElement();
    if (editor) {
      editor.focus();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(variable);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        setEmailBody(editor.innerHTML);
      }
    }
  };

  // Handle insert image
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

  // Handle custom list modal
  const handleCustomListSelect = () => {
    setShowCustomListModal(true);
  };

  // Handle add manual recipient
  const handleAddManualRecipient = () => {
    if (!manualEmail.trim()) {
      message.warning("Please enter an email address");
      return;
    }
    
    const newRecipient = {
      key: Date.now(),
      email: manualEmail.trim(),
      name: manualName.trim() || manualEmail.trim(),
    };
    
    setCustomRecipients([...customRecipients, newRecipient]);
    setManualEmail("");
    setManualName("");
  };

  // Handle remove recipient
  const handleRemoveRecipient = (key) => {
    setCustomRecipients(customRecipients.filter((r) => r.key !== key));
  };

  // Handle CSV/Excel upload
  const handleBeforeUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const newRecipients = [];
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed) {
          const parts = trimmed.split(",");
          const email = parts[0]?.trim();
          const name = parts[1]?.trim() || email;
          
          if (email && email.includes("@")) {
            newRecipients.push({
              key: Date.now() + index,
              email,
              name,
            });
          }
        }
      });
      
      setCustomRecipients([...customRecipients, ...newRecipients]);
      message.success(`Added ${newRecipients.length} recipients from file`);
    };
    
    reader.readAsText(file);
    setUploadedFile(file);
    return false; // Prevent auto upload
  };

  // Handle save custom list
  const handleSaveCustomList = () => {
    if (customRecipients.length === 0) {
      message.warning("Please add at least one recipient");
      return;
    }
    
    setStakeholders(customRecipients);
    setShowCustomListModal(false);
    message.success(`Added ${customRecipients.length} stakeholders`);
  };

  // Handle send email
  const handleSendEmail = () => {
    if (stakeholders.length === 0) {
      message.warning("Please add at least one stakeholder");
      return;
    }
    
    if (!subject.trim()) {
      message.warning("Please enter an email subject");
      return;
    }
    
    if (!emailBody.trim()) {
      message.warning("Please enter email content");
      return;
    }
    
    // TODO: Send email via API
    console.log("Sending email to stakeholders:", {
      stakeholders,
      subject,
      emailBody,
      feedbackRecipient,
      includeFeedbackForm,
      feedbackFormLink,
    });
    
    message.success(`Email sent to ${stakeholders.length} stakeholder(s)`);
    
    // Navigate back
    setTimeout(() => {
      navigate(`/admin/events/${eventId}/sub-events/${subEventId}/detail`);
    }, 1500);
  };

  // Sync emailBody to editor when changed externally
  useEffect(() => {
    if (editorRef.current && !isUpdatingContent.current) {
      const editor = editorRef.current;
      const isFocused = document.activeElement === editor;
      if (!isFocused && editor.innerHTML !== emailBody) {
        isUpdatingContent.current = true;
        editor.innerHTML = emailBody;
        setTimeout(() => {
          isUpdatingContent.current = false;
        }, 0);
      }
    }
  }, [emailBody]);

  if (!subEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  const directorName = getDirectorName();
  const eventCreator = getEventCreator();

  return (
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
            Back to Sub-Event Detail
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Gửi yêu cầu phản hồi đến Stakeholders</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Yêu cầu phản hồi từ stakeholders cho: <strong>{subEvent.eventName || subEvent.name}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recipients & Settings */}
          <div className="lg:col-span-1 space-y-4">
            {/* Recipients Card */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <UserOutlined />
                  <span className="text-[14px] font-semibold">Recipients</span>
                </div>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Stakeholders</label>
                  {stakeholders.length > 0 ? (
                    <div className="space-y-2">
                      {stakeholders.map((stakeholder, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                        >
                          <div>
                            <p className="text-[12px] font-medium">{stakeholder.name}</p>
                            <p className="text-[11px] text-gray-500">{stakeholder.email}</p>
                          </div>
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => setStakeholders(stakeholders.filter((_, i) => i !== index))}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-gray-500">No stakeholders added</p>
                  )}
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCustomListSelect}
                    className="mt-3 w-full"
                    style={{ backgroundColor: "#F2721E", borderColor: "#F2721E", fontSize: "12px" }}
                  >
                    Add Stakeholders
                  </Button>
                </div>
              </div>
            </Card>

            {/* Feedback Settings Card */}
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileTextOutlined />
                  <span className="text-[14px] font-semibold">Feedback Settings</span>
                </div>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Feedback Recipient</label>
                  <Radio.Group
                    value={feedbackRecipient}
                    onChange={(e) => setFeedbackRecipient(e.target.value)}
                  >
                    <Space direction="vertical" className="w-full">
                      <Radio value="director">
                        Director ({directorName})
                      </Radio>
                      <Radio value="creator">
                        Event Creator ({eventCreator})
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
                <Divider className="my-3" />
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Include Feedback Form</label>
                  <Radio.Group
                    value={includeFeedbackForm}
                    onChange={(e) => setIncludeFeedbackForm(e.target.value)}
                  >
                    <Space direction="vertical" className="w-full">
                      <Radio value={true}>Yes, include feedback form link</Radio>
                      <Radio value={false}>No, only request feedback</Radio>
                    </Space>
                  </Radio.Group>
                  {includeFeedbackForm && (
                    <Input
                      value={feedbackFormLink}
                      onChange={(e) => setFeedbackFormLink(e.target.value)}
                      placeholder="Feedback form link"
                      className="mt-2"
                      style={{ fontSize: "12px" }}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Email Editor */}
          <div className="lg:col-span-2">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <MailOutlined />
                  <span className="text-[14px] font-semibold">Email Content</span>
                </div>
              }
              extra={
                <Space>
                  <Button
                    icon={<SendOutlined />}
                    type="primary"
                    onClick={handleSendEmail}
                    style={{ backgroundColor: "#F2721E", borderColor: "#F2721E", fontSize: "13px" }}
                  >
                    Send Email ({stakeholders.length})
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
                    {[
                      { key: "{EventName}", label: "Event Name" },
                      { key: "{SubEventName}", label: "Sub-Event Name" },
                      { key: "{Date}", label: "Event Date" },
                      { key: "{Time}", label: "Event Time" },
                      { key: "{Location}", label: "Location" },
                      { key: "{DirectorName}", label: "Director Name" },
                      { key: "{FeedbackFormLink}", label: "Feedback Form Link" },
                    ].map((variable) => (
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
                    onClick={() => handleFormat("bold")}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<ItalicOutlined />}
                    size="small"
                    title="Italic"
                    onClick={() => handleFormat("italic")}
                    onMouseDown={(e) => e.preventDefault()}
                  />
                  <Button
                    type="text"
                    icon={<UnderlineOutlined />}
                    size="small"
                    title="Underline"
                    onClick={() => handleFormat("underline")}
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
                    id="stakeholder-email-editor"
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
                    #stakeholder-email-editor:empty:before {
                      content: attr(placeholder);
                      color: #bfbfbf;
                      pointer-events: none;
                    }
                    #stakeholder-email-editor:focus {
                      border-color: #F2721E !important;
                      outline: none;
                      box-shadow: 0 0 0 2px rgba(242, 114, 30, 0.2);
                    }
                    #stakeholder-email-editor img {
                      max-width: 100%;
                      height: auto;
                    }
                  `}</style>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Custom List Modal */}
        <Modal
          title={
            <span style={{ color: "#F2721E" }}>Add Stakeholders</span>
          }
          open={showCustomListModal}
          onCancel={() => setShowCustomListModal(false)}
          footer={[
            <Button key="back" onClick={() => setShowCustomListModal(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleSaveCustomList}
              style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
            >
              Save Stakeholders ({customRecipients.length})
            </Button>,
          ]}
          width={800}
        >
          <Tabs defaultActiveKey="manual">
            <TabPane tab="Add Manually" key="manual">
              <Space className="w-full mb-4">
                <Input
                  placeholder="Email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Input
                  placeholder="Name (optional)"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddManualRecipient}
                  style={{ backgroundColor: "#F2721E", borderColor: "#F2721E" }}
                >
                  Add
                </Button>
              </Space>
            </TabPane>
            <TabPane tab="Upload CSV/Excel" key="upload">
              <Dragger
                name="file"
                multiple={false}
                beforeUpload={handleBeforeUpload}
                onRemove={() => setUploadedFile(null)}
                fileList={uploadedFile ? [uploadedFile] : []}
                accept=".csv, .xlsx"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  Support for a single upload. Strictly prohibit from uploading
                  company data or other band files.
                </p>
                <p className="ant-upload-hint text-red-500">
                  CSV/Excel format: email,name (one recipient per line)
                </p>
              </Dragger>
            </TabPane>
          </Tabs>

          <Divider>Current Stakeholders ({customRecipients.length})</Divider>
          <Table
            dataSource={customRecipients}
            columns={[
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Name", dataIndex: "name", key: "name" },
              {
                title: "Action",
                key: "action",
                render: (_, record) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveRecipient(record.key)}
                  />
                ),
              },
            ]}
            pagination={{ pageSize: 5 }}
            rowKey="key"
            locale={{ emptyText: "No stakeholders added yet." }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default StakeholderFeedbackEmail;
