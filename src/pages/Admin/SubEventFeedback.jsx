import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Pagination,
  Empty,
  Spin,
} from "antd";
import dayjs from "dayjs";
import { getEventById } from "../../services/events.api";
import feedbackData from "../../data/sub-event-feedback.json";

const SubEventFeedback = () => {
  const navigate = useNavigate();
  const { eventId, subEventId } = useParams();
  const [event, setEvent] = useState(null);
  const [subEvent, setSubEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Load event and sub-event data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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
        const transformedSubEvent = {
          ...subEventData,
          name: subEventData.eventName || "Sub-event",
          eventName: subEventData.eventName,
        };
        
        setSubEvent(transformedSubEvent);
        
        // Load feedbacks from JSON file
        setFeedbacks(feedbackData);
      } catch (error) {
        console.error("❌ Error loading sub-event:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subEventId) {
      fetchData();
    }
  }, [eventId, subEventId]);

  // Calculate pagination
  const totalFeedbacks = feedbacks.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentFeedbacks = feedbacks.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!subEvent) {
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
      <div className="max-w-4xl mx-auto p-6">
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
                {subEvent.eventName || subEvent.name} - Phản hồi
              </h1>
              <p className="text-[14px] text-gray-600">
                Xem phản hồi từ người tham dự
              </p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-600 mb-1">Tổng số phản hồi</div>
              <div className="text-3xl font-bold text-gray-900">{totalFeedbacks}</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-gray-600 mb-1">Sự kiện</div>
              <div className="text-lg font-semibold text-gray-900">
                {subEvent.eventName || subEvent.name}
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback List */}
        {feedbacks.length === 0 ? (
          <Card className="shadow-sm">
            <Empty
              description="Chưa có phản hồi nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {currentFeedbacks.map((feedback, index) => (
                <Card key={feedback.id || index} className="shadow-sm">
                  <div className="mb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-[14px] font-semibold text-gray-900">
                        {feedback.name || "Người dùng ẩn danh"}
                      </div>
                      {feedback.role && (
                        <span className="text-[12px] text-gray-500">
                          {feedback.role}
                        </span>
                      )}
                    </div>
                  </div>
                  {feedback.comment && (
                    <div className="text-[13px] text-gray-700 leading-relaxed">
                      {feedback.comment}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalFeedbacks > pageSize && (
              <div className="flex justify-center">
                <Pagination
                  current={currentPage}
                  total={totalFeedbacks}
                  pageSize={pageSize}
                  onChange={(page) => setCurrentPage(page)}
                  showSizeChanger={false}
                  showTotal={(total, range) =>
                    `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} phản hồi`
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubEventFeedback;
