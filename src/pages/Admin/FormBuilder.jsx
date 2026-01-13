import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  message,
  Modal,
  Divider,
  Radio,
  Checkbox,
} from "antd";

const { Option } = Select;
const { TextArea } = Input;

const FormBuilder = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const location = useLocation();
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [formLink, setFormLink] = useState("");

  // Load event data from location state
  useEffect(() => {
    if (location.state) {
      const { eventName, description, startTime, endTime, location: eventLocation } = location.state;
      setFormTitle(eventName || "Event Registration Form");
      setFormDescription(description || "");
      
      // Pre-populate with event details
      setQuestions([
        {
          id: 1,
          type: "text",
          question: "Full Name",
          required: true,
          placeholder: "Enter your full name",
        },
        {
          id: 2,
          type: "email",
          question: "Email Address",
          required: true,
          placeholder: "Enter your email",
        },
        {
          id: 3,
          type: "text",
          question: "Phone Number",
          required: false,
          placeholder: "Enter your phone number",
        },
        {
          id: 4,
          type: "date",
          question: "Event Date",
          required: true,
          defaultValue: startTime ? new Date(startTime).toISOString().split("T")[0] : "",
        },
        {
          id: 5,
          type: "text",
          question: "Event Location",
          required: true,
          defaultValue: eventLocation || "",
        },
      ]);
    }
  }, [location.state]);

  // Add new question
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: "text",
      question: "",
      required: false,
      options: [],
    };
    setQuestions([...questions, newQuestion]);
  };

  // Remove question
  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Update question
  const updateQuestion = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  // Add option to question (for select, radio, checkbox)
  const addOption = (questionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [...(q.options || []), { id: Date.now(), label: "" }],
          };
        }
        return q;
      })
    );
  };

  // Update option
  const updateOption = (questionId, optionId, value) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optionId ? { ...opt, label: value } : opt
            ),
          };
        }
        return q;
      })
    );
  };

  // Remove option
  const removeOption = (questionId, optionId) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((opt) => opt.id !== optionId),
          };
        }
        return q;
      })
    );
  };

  // Generate form link
  const generateFormLink = () => {
    // TODO: Integrate with Google Forms API or generate a shareable link
    const link = `https://forms.google.com/form/${Date.now()}`;
    setFormLink(link);
    message.success("Form link generated successfully!");
  };

  // Save form
  const handleSave = () => {
    if (!formTitle.trim()) {
      message.error("Please enter a form title");
      return;
    }
    if (questions.length === 0) {
      message.error("Please add at least one question");
      return;
    }

    // TODO: Save to backend or localStorage
    message.success("Form saved successfully!");
  };

  // Render question input based on type
  const renderQuestionInput = (question) => {
    switch (question.type) {
      case "text":
      case "email":
      case "number":
        return (
          <Input
            placeholder={question.placeholder || "Enter answer"}
            type={question.type}
            defaultValue={question.defaultValue}
            style={{ fontSize: "13px" }}
          />
        );
      case "textarea":
        return (
          <TextArea
            placeholder={question.placeholder || "Enter answer"}
            rows={4}
            style={{ fontSize: "13px" }}
          />
        );
      case "select":
        return (
          <Select
            placeholder="Select an option"
            style={{ width: "100%", fontSize: "13px" }}
          >
            {question.options?.map((opt) => (
              <Option key={opt.id} value={opt.label}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case "radio":
        return (
          <Radio.Group>
            <Space direction="vertical">
              {question.options?.map((opt) => (
                <Radio key={opt.id} value={opt.label}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      case "checkbox":
        return (
          <Checkbox.Group>
            <Space direction="vertical">
              {question.options?.map((opt) => (
                <Checkbox key={opt.id} value={opt.label}>
                  {opt.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
      case "date":
        return (
          <Input
            type="date"
            defaultValue={question.defaultValue}
            style={{ fontSize: "13px" }}
          />
        );
      default:
        return <Input placeholder="Enter answer" style={{ fontSize: "13px" }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/admin/events/${eventId}/sub-events/${subEventId}/email-editor`)}
            className="p-0 mb-2 text-[14px] text-gray-600 hover:text-[#F2721E]"
          >
            Back to Email Editor
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Form Builder</h1>
            <Space>
              <Button
                icon={<LinkOutlined />}
                onClick={generateFormLink}
                style={{ fontSize: "13px" }}
              >
                Generate Link
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                style={{
                  backgroundColor: "#F2721E",
                  borderColor: "#F2721E",
                  fontSize: "13px",
                }}
              >
                Save Form
              </Button>
            </Space>
          </div>
        </div>

        {/* Form Settings */}
        <Card className="mb-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-gray-600 mb-2 block">Form Title</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
                style={{ fontSize: "14px" }}
              />
            </div>
            <div>
              <label className="text-[12px] text-gray-600 mb-2 block">Form Description</label>
              <TextArea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                placeholder="Enter form description"
                style={{ fontSize: "14px" }}
              />
            </div>
            {formLink && (
              <div>
                <label className="text-[12px] text-gray-600 mb-2 block">Form Link</label>
                <Input
                  value={formLink}
                  readOnly
                  suffix={
                    <Button
                      type="link"
                      onClick={() => {
                        navigator.clipboard.writeText(formLink);
                        message.success("Link copied to clipboard!");
                      }}
                    >
                      Copy
                    </Button>
                  }
                  style={{ fontSize: "13px" }}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="shadow-sm"
              title={
                <span className="text-[13px] font-semibold">
                  Question {index + 1}
                </span>
              }
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeQuestion(question.id)}
                  size="small"
                />
              }
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Question Type</label>
                  <Select
                    value={question.type}
                    onChange={(value) => updateQuestion(question.id, "type", value)}
                    style={{ width: "100%", fontSize: "13px" }}
                  >
                    <Option value="text">Text</Option>
                    <Option value="email">Email</Option>
                    <Option value="number">Number</Option>
                    <Option value="textarea">Textarea</Option>
                    <Option value="select">Dropdown</Option>
                    <Option value="radio">Radio Buttons</Option>
                    <Option value="checkbox">Checkboxes</Option>
                    <Option value="date">Date</Option>
                  </Select>
                </div>
                <div>
                  <label className="text-[12px] text-gray-600 mb-2 block">Question</label>
                  <Input
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(question.id, "question", e.target.value)
                    }
                    placeholder="Enter question"
                    style={{ fontSize: "13px" }}
                  />
                </div>
                {(question.type === "select" ||
                  question.type === "radio" ||
                  question.type === "checkbox") && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[12px] text-gray-600">Options</label>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => addOption(question.id)}
                        style={{ fontSize: "11px" }}
                      >
                        + Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.options?.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <Input
                            value={opt.label}
                            onChange={(e) =>
                              updateOption(question.id, opt.id, e.target.value)
                            }
                            placeholder="Option label"
                            style={{ fontSize: "12px" }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => removeOption(question.id, opt.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {question.type !== "select" &&
                  question.type !== "radio" &&
                  question.type !== "checkbox" && (
                    <div>
                      <label className="text-[12px] text-gray-600 mb-2 block">
                        Placeholder (optional)
                      </label>
                      <Input
                        value={question.placeholder || ""}
                        onChange={(e) =>
                          updateQuestion(question.id, "placeholder", e.target.value)
                        }
                        placeholder="Enter placeholder text"
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                  )}
                <div>
                  <Checkbox
                    checked={question.required}
                    onChange={(e) =>
                      updateQuestion(question.id, "required", e.target.checked)
                    }
                  >
                    Required field
                  </Checkbox>
                </div>
                <Divider className="my-2" />
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-[11px] text-gray-500 mb-2 block">Preview:</label>
                  <div className="text-[12px] font-medium mb-2">
                    {question.question || "Question"}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </div>
                  {renderQuestionInput(question)}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add Question Button */}
        <Card className="shadow-sm">
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={addQuestion}
            style={{ fontSize: "13px", height: "48px" }}
          >
            Add Question
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default FormBuilder;
