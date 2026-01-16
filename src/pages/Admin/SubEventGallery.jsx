import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  UploadOutlined,
  PictureOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Upload,
  Modal,
  Image,
  Space,
  message,
  Row,
  Col,
  Empty,
} from "antd";
import { useAuth } from "../../contexts/AuthContext";

const { Dragger } = Upload;

const SubEventGallery = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [images, setImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Check permissions (Staff and Manager only)
  const hasPermission = user?.role === "Staff" || user?.role === "Event Manager" || user?.role === "Admin";

  // Load event and sub-event data
  useEffect(() => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("events_storage") || "[]");
      const foundEvent = storedEvents.find((e) => e.id === parseInt(eventId));
      
      if (foundEvent) {
        setEvent(foundEvent);
        const subs = foundEvent.subEvents || [];
        const foundSubEvent = subs[parseInt(subEventId)];
        
        if (foundSubEvent) {
          setSubEvent(foundSubEvent);
          // Load images from sub-event data
          const subEventImages = foundSubEvent.images || [];
          setImages(subEventImages);
        }
      }
    } catch (error) {
      console.error("Error loading sub-event:", error);
      message.error("Failed to load sub-event data");
    }
  }, [eventId, subEventId]);

  // Save images to localStorage
  const saveImages = (newImages) => {
    try {
      const storedEvents = JSON.parse(localStorage.getItem("events_storage") || "[]");
      const eventIndex = storedEvents.findIndex((e) => e.id === parseInt(eventId));
      
      if (eventIndex !== -1) {
        const subEvents = storedEvents[eventIndex].subEvents || [];
        const subEventIndex = parseInt(subEventId);
        
        if (subEvents[subEventIndex]) {
          subEvents[subEventIndex].images = newImages;
          storedEvents[eventIndex].subEvents = subEvents;
          localStorage.setItem("events_storage", JSON.stringify(storedEvents));
        }
      }
    } catch (error) {
      console.error("Error saving images:", error);
      message.error("Failed to save images");
    }
  };

  // Handle file upload
  const handleUpload = async (fileList) => {
    if (!hasPermission) {
      message.error("You don't have permission to upload images");
      return;
    }

    setUploading(true);
    try {
      const newImages = [];
      
      for (const file of fileList) {
        if (file.originFileObj) {
          // Convert file to base64 for storage
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              newImages.push({
                id: Date.now() + Math.random(),
                url: e.target.result,
                name: file.name,
                uploadedAt: new Date().toISOString(),
                uploadedBy: user?.email || user?.name || "Unknown",
              });
              resolve();
            };
            reader.onerror = reject;
            reader.readAsDataURL(file.originFileObj);
          });
        } else if (file.url) {
          // Already uploaded image
          newImages.push(file);
        }
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      saveImages(updatedImages);
      message.success(`Successfully uploaded ${newImages.length} image(s)`);
      setUploadModalVisible(false);
    } catch (error) {
      console.error("Error uploading images:", error);
      message.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  // Handle delete image
  const handleDelete = (imageId) => {
    if (!hasPermission) {
      message.error("You don't have permission to delete images");
      return;
    }

    Modal.confirm({
      title: "Delete Image",
      content: "Are you sure you want to delete this image?",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const updatedImages = images.filter((img) => img.id !== imageId);
        setImages(updatedImages);
        saveImages(updatedImages);
        message.success("Image deleted successfully");
      },
    });
  };

  // Handle preview
  const handlePreview = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  // Upload props
  const uploadProps = {
    multiple: true,
    accept: "image/*",
    beforeUpload: () => false, // Prevent auto upload
    showUploadList: false,
    onChange: (info) => {
      const fileList = info.fileList;
      if (fileList.length > 0) {
        handleUpload(fileList);
      }
    },
  };

  if (!event || !subEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Sub-event not found</p>
          <Button onClick={() => navigate(`/admin/events/${eventId}/sub-events`)} className="mt-4">
            Back to Sub-events
          </Button>
        </div>
      </div>
    );
  }

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
            Back to Sub-event Detail
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subEvent.name} - Gallery
              </h1>
              <p className="text-[14px] text-gray-600">
                Manage and view event photos
              </p>
            </div>
            {hasPermission && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
                style={{
                  fontSize: "14px",
                  backgroundColor: "#F2721E",
                  borderColor: "#F2721E",
                }}
              >
                Upload Images
              </Button>
            )}
          </div>
        </div>

        {/* Image Grid */}
        {images.length === 0 ? (
          <Card className="shadow-sm">
            <Empty
              description="No images uploaded yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {hasPermission && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                  style={{
                    backgroundColor: "#F2721E",
                    borderColor: "#F2721E",
                  }}
                >
                  Upload Images
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {images.map((image, index) => (
              <Col key={image.id} xs={12} sm={8} md={6} lg={4}>
                <Card
                  className="shadow-sm"
                  hoverable
                  cover={
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      <img
                        alt={image.name || "Event image"}
                        src={image.url}
                        className="w-full h-full object-cover"
                        onClick={() => handlePreview(index)}
                      />
                      {hasPermission && (
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(index)}
                            style={{ backgroundColor: "rgba(0,0,0,0.5)", border: "none" }}
                          />
                          <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(image.id)}
                            style={{ backgroundColor: "rgba(255,0,0,0.7)", border: "none" }}
                          />
                        </div>
                      )}
                    </div>
                  }
                  bodyStyle={{ padding: "8px" }}
                >
                  <div className="text-[12px] text-gray-600 truncate">
                    {image.name || "Image"}
                  </div>
                  {image.uploadedAt && (
                    <div className="text-[11px] text-gray-400 mt-1">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Upload Modal */}
        <Modal
          title="Upload Images"
          open={uploadModalVisible}
          onCancel={() => setUploadModalVisible(false)}
          footer={null}
          width={600}
        >
          <Dragger {...uploadProps} disabled={uploading}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined className="text-[#F2721E] text-4xl" />
            </p>
            <p className="ant-upload-text text-[14px]">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint text-[12px] text-gray-500">
              Support for multiple image uploads. Accepted formats: JPG, PNG, GIF, WEBP
            </p>
          </Dragger>
          {uploading && (
            <div className="mt-4 text-center text-[14px] text-gray-600">
              Uploading images...
            </div>
          )}
        </Modal>

        {/* Preview Modal with Image Gallery */}
        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="90%"
          style={{ top: 20 }}
          bodyStyle={{ padding: 0, background: "#000" }}
          centered
        >
          <div className="relative w-full" style={{ minHeight: "70vh" }}>
            <img
              src={images[previewIndex]?.url}
              alt={images[previewIndex]?.name || "Event image"}
              className="w-full h-auto max-h-[80vh] object-contain mx-auto"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded text-[14px]">
              {previewIndex + 1} / {images.length}
            </div>
            {images.length > 1 && (
              <>
                {previewIndex > 0 && (
                  <Button
                    type="primary"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => setPreviewIndex(previewIndex - 1)}
                    style={{
                      backgroundColor: "rgba(242, 114, 30, 0.8)",
                      borderColor: "#F2721E",
                    }}
                  >
                    ← Previous
                  </Button>
                )}
                {previewIndex < images.length - 1 && (
                  <Button
                    type="primary"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={() => setPreviewIndex(previewIndex + 1)}
                    style={{
                      backgroundColor: "rgba(242, 114, 30, 0.8)",
                      borderColor: "#F2721E",
                    }}
                  >
                    Next →
                  </Button>
                )}
              </>
            )}
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-0 right-0 overflow-x-auto bg-black bg-opacity-50 p-2">
                <div className="flex gap-2 justify-center">
                  {images.map((img, idx) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.name || "Thumbnail"}
                      className={`w-16 h-16 object-cover cursor-pointer border-2 ${
                        idx === previewIndex ? "border-[#F2721E]" : "border-transparent"
                      }`}
                      onClick={() => setPreviewIndex(idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SubEventGallery;
