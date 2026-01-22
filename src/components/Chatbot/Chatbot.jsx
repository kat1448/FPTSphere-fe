import React, { useEffect, useMemo, useRef, useState } from "react";
import chatbotIcon from "../../assets/images/Chatbot/chatbot-icon.webp";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
// Model hiện tại của Groq - sử dụng model từ documentation
const GROQ_MODEL = "openai/gpt-oss-20b"; // Model được khuyến nghị trong Groq docs
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// System prompt để định hướng chatbot về chủ đề sự kiện
const SYSTEM_PROMPT = `Bạn là một trợ lý AI chuyên về quản lý sự kiện. Nhiệm vụ của bạn là:
- Hỗ trợ người dùng tạo và quản lý sự kiện
- Tư vấn về cách tổ chức sự kiện hiệu quả
- Trả lời các câu hỏi liên quan đến sự kiện, lịch trình, địa điểm, người tham gia
- Hướng dẫn các bước tạo sự kiện từ cơ bản đến nâng cao
- Đưa ra gợi ý và best practices cho việc tổ chức sự kiện

Hãy trả lời một cách thân thiện, chuyên nghiệp và hữu ích bằng tiếng Việt. Nếu câu hỏi không liên quan đến sự kiện, hãy nhẹ nhàng hướng người dùng quay lại chủ đề sự kiện.`;

const STORAGE_KEY = "fptusphere_chatbot_threads_v1";
const EMPTY_ARR = [];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const nowTime = () => new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const buildTitleFromUserText = (text) => {
  const t = (text || "").trim();
  if (!t) return "Cuộc trò chuyện mới";
  return t.length > 22 ? `${t.slice(0, 22)}…` : t;
};

const getThreadPreview = (thread) => {
  const last = thread?.messages?.slice?.(-1)?.[0];
  if (!last?.content) return "Chưa có tin nhắn";
  return last.content.length > 28 ? `${last.content.slice(0, 28)}…` : last.content;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [threads, setThreads] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // ignore
    }
    const firstId = createId();
    return [
      {
        id: firstId,
        title: "Cuộc trò chuyện mới",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [
          {
            role: "assistant",
            content: "Xin chào! 👋 Tôi là trợ lý AI chuyên về quản lý sự kiện. Tôi có thể giúp bạn:\n\n• Tạo và quản lý sự kiện\n• Tư vấn cách tổ chức sự kiện hiệu quả\n• Hướng dẫn các bước tạo sự kiện\n• Trả lời câu hỏi về lịch trình, địa điểm, người tham gia\n\nBạn cần hỗ trợ gì về sự kiện hôm nay?",
            timestamp: nowTime(),
          },
        ],
      },
    ];
  });
  const [activeThreadId, setActiveThreadId] = useState(() => (threads?.[0]?.id ? threads[0].id : null));
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeThread = useMemo(() => threads.find((t) => t.id === activeThreadId) || threads[0], [threads, activeThreadId]);
  const messages = useMemo(() => activeThread?.messages || EMPTY_ARR, [activeThread]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const updateThread = (threadId, updater) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        const next = typeof updater === "function" ? updater(t) : updater;
        return { ...t, ...next, updatedAt: Date.now() };
      })
    );
  };

  const createNewThread = () => {
    const id = createId();
    const newThread = {
      id,
      title: "Cuộc trò chuyện mới",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          role: "assistant",
          content: "Xin chào! 👋 Tôi là trợ lý AI chuyên về quản lý sự kiện. Tôi có thể giúp bạn:\n\n• Tạo và quản lý sự kiện\n• Tư vấn cách tổ chức sự kiện hiệu quả\n• Hướng dẫn các bước tạo sự kiện\n• Trả lời câu hỏi về lịch trình, địa điểm, người tham gia\n\nBạn cần hỗ trợ gì về sự kiện hôm nay?",
          timestamp: nowTime(),
        },
      ],
    };
    setThreads((prev) => [newThread, ...(prev || [])]);
    setActiveThreadId(id);
  };

  const deleteThread = (id) => {
    setThreads((prev) => {
      const next = (prev || []).filter((t) => t.id !== id);
      if (!next.length) {
        const newId = createId();
        return [
          {
            id: newId,
            title: "Cuộc trò chuyện mới",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [
              {
                role: "assistant",
                content: "Xin chào 👋 Mình có thể hỗ trợ bạn điều gì?",
                timestamp: nowTime(),
              },
            ],
          },
        ];
      }
      return next;
    });
    if (activeThreadId === id) {
      // set sang thread đầu tiên sau khi xóa
      setTimeout(() => {
        setActiveThreadId((current) => {
          if (current !== id) return current;
          const first = (threads || []).find((t) => t.id !== id);
          return first?.id || null;
        });
      }, 0);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!activeThread?.id) return;

    const userMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: nowTime(),
    };

    const textToSend = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    updateThread(activeThread.id, (t) => {
      const nextTitle = t.title === "Cuộc trò chuyện mới" ? buildTitleFromUserText(textToSend) : t.title;
      return { title: nextTitle, messages: [...(t.messages || []), userMessage] };
    });

    try {
      // Build context: gửi một số message gần nhất để chat có ngữ cảnh
      const contextMessages = [...(activeThread.messages || []), userMessage].slice(-12);
      const messages = contextMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      }));

      // Thêm system prompt vào đầu messages để định hướng chatbot về chủ đề sự kiện
      const messagesWithSystem = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ];

      const requestBody = {
        model: GROQ_MODEL,
        messages: messagesWithSystem,
        temperature: 0.7,
        max_tokens: 512,
      };

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse error từ Groq response
        const errorType = data?.error?.type || "";
        const errorCode = data?.error?.code || "";
        const errorMessage = data?.error?.message || `HTTP ${response.status}`;

        // Tạo error object với thông tin chi tiết
        const error = new Error(errorMessage);
        error.type = errorType;
        error.code = errorCode;
        throw error;
      }

      const text = data?.choices?.[0]?.message?.content || "";
      if (text) {
        const assistantMessage = {
          role: "assistant",
          content: text,
          timestamp: nowTime(),
        };
        updateThread(activeThread.id, (t) => ({ messages: [...(t.messages || []), assistantMessage] }));
      } else {
        throw new Error("Không nhận được phản hồi từ Groq (choices rỗng).");
      }
    } catch (error) {
      console.error("Error calling Groq API:", error);
      let errorContent = "Xin lỗi, hiện tại không thể chat được.";
      const errorMsg = error?.message || "";
      const errorType = error?.type || "";
      const errorCode = error?.code || "";

      // Xử lý thông báo lỗi quota một cách thân thiện hơn
      if (errorType === "insufficient_quota" || errorCode === "insufficient_quota" ||
        errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("insufficient_quota")) {
        errorContent = "⚠️ API key đã hết quota hoặc vượt quá giới hạn sử dụng.\n\n" +
          "Vui lòng:\n" +
          "• Kiểm tra quota tại: https://console.groq.com/keys\n" +
          "• Nâng cấp gói dịch vụ nếu cần\n" +
          "• Hoặc sử dụng API key khác có quota còn lại\n\n" +
          "Chi tiết lỗi: " + errorMsg;
      } else if (errorType === "rate_limit_error" || errorCode === "rate_limit_exceeded" ||
        errorMsg.toLowerCase().includes("rate") || errorMsg.toLowerCase().includes("rate_limit")) {
        errorContent = "⏱️ Đã vượt quá giới hạn số lượng request.\n\n" +
          "Vui lòng thử lại sau vài giây hoặc vài phút.\n\n" +
          "Chi tiết: " + errorMsg;
      } else if (errorType === "invalid_api_key" || errorCode === "invalid_api_key" ||
        errorMsg.toLowerCase().includes("invalid_api_key") || errorMsg.toLowerCase().includes("authentication")) {
        errorContent = "🔑 API key không hợp lệ hoặc đã bị thu hồi.\n\n" +
          "Vui lòng kiểm tra lại API key tại: https://console.groq.com/keys\n\n" +
          "Chi tiết: " + errorMsg;
      } else if (errorType === "invalid_request_error" || errorCode === "model_decommissioned" ||
        errorMsg.toLowerCase().includes("decommissioned") || errorMsg.toLowerCase().includes("model")) {
        errorContent = "⚠️ Model đã bị ngừng hỗ trợ.\n\n" +
          "Vui lòng kiểm tra danh sách model hiện tại tại: https://console.groq.com/docs/models\n\n" +
          "Chi tiết: " + errorMsg;
      } else if (errorMsg) {
        errorContent = `❌ Có lỗi xảy ra khi kết nối với Groq API.\n\n` +
          `Lỗi: ${errorMsg}\n\n` +
          `Nếu lỗi vẫn tiếp tục, vui lòng liên hệ quản trị viên.`;
      }

      const errorMessage = {
        role: "assistant",
        content: errorContent,
        timestamp: nowTime(),
      };
      updateThread(activeThread.id, (t) => ({ messages: [...(t.messages || []), errorMessage] }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleChatbot = () => {
    if (!isOpen) {
      // Khi mở chatbot, tự động tạo thread mới
      createNewThread();
      setIsOpen(true);
    } else {
      // Khi đóng chatbot
      setIsOpen(false);
    }
  };

  const toggleMessageExpand = (messageIndex) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageIndex)) {
        next.delete(messageIndex);
      } else {
        next.add(messageIndex);
      }
      return next;
    });
  };

  const isMessageLong = (content) => {
    if (!content) return false;
    // Nếu có nhiều hơn 200 ký tự hoặc nhiều hơn 4 dòng thì coi là dài
    return content.length > 200 || (content.match(/\n/g) || []).length > 3;
  };

  // NOTE: Đã bỏ nút "Chia sẻ phản hồi" theo yêu cầu.

  return (
    <>
      {/* Chatbot Button */}
      <button
        className="fixed bottom-6 right-6 w-[60px] h-[60px] rounded-full bg-[#ff6b35] border border-white/40 cursor-pointer shadow-lg z-[1000] flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-xl"
        onClick={handleToggleChatbot}
        aria-label="Toggle chatbot"
      >
        <img src={chatbotIcon} alt="Chatbot" className="w-9 h-9 object-contain" />
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed bottom-[88px] right-6 h-[520px] bg-white rounded-2xl shadow-2xl flex z-[1001] overflow-hidden border border-orange-100 animate-[slideUp_0.3s_ease-out] md:max-w-[calc(100vw-48px)] md:right-6 md:bottom-[88px] md:h-[calc(100vh-140px)] md:max-h-[520px] text-sm ${isHistoryOpen ? "w-[520px]" : "w-[360px]"
            }`}
        >
          {/* History Sidebar */}
          <div
            className={`h-full bg-white border-r border-orange-100 flex flex-col transition-all duration-200 ${isHistoryOpen ? "w-[170px]" : "w-[44px]"
              }`}
          >
            <div className="h-[66.8px] flex items-center justify-between px-2 py-2 border-b border-orange-100 bg-orange-50">
              {isHistoryOpen && <div className="text-sm font-semibold text-gray-800">Lịch sử</div>}
              <button
                className="w-8 h-8 rounded-lg hover:bg-orange-100 flex items-center justify-center text-gray-700"
                type="button"
                onClick={() => setIsHistoryOpen((v) => !v)}
                title={isHistoryOpen ? "Thu gọn" : "Mở lịch sử"}
              >
                {isHistoryOpen ? "⟨" : "⟩"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              {isHistoryOpen && (
                <button
                  className="w-full mb-2 px-3 py-2 rounded-xl bg-[#ff6b35] text-white text-sm font-semibold hover:bg-[#e55a2b] shadow-sm"
                  type="button"
                  onClick={createNewThread}
                >
                  + Mới
                </button>
              )}

              {(threads || [])
                .slice()
                .sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0))
                .map((t) => {
                  const isActive = t.id === activeThreadId;
                  return (
                    <div
                      key={t.id}
                      className={`group rounded-xl mb-2 overflow-hidden border ${isActive ? "border-orange-300 bg-orange-50" : "border-transparent hover:border-orange-100 hover:bg-orange-50/40"
                        }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2"
                        onClick={() => setActiveThreadId(t.id)}
                        title={t.title}
                      >
                        <div className="text-sm font-semibold text-gray-900 truncate">{t.title || "Cuộc trò chuyện"}</div>
                        <div className="text-[12px] text-gray-600 truncate">{getThreadPreview(t)}</div>
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-[12px] text-red-600 hover:bg-red-50 border-t border-orange-100 hidden group-hover:block"
                        onClick={() => deleteThread(t.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-orange-50 px-4 py-3 flex items-center justify-between border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                    <img src="/src/assets/images/Chatbot/chatbot-icon-transparent.png" alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    Chatbot AI
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  </div>
                  <div className="text-sm text-gray-600">Event Manager Assistant</div>
                </div>
              </div>
              <button
                className="bg-white border border-orange-100 text-gray-700 cursor-pointer p-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-orange-100"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                ×
              </button>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-white [background-image:radial-gradient(rgba(255,107,53,0.08)_1px,transparent_1px)] [background-size:18px_18px] scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent hover:scrollbar-thumb-orange-300"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#ccc transparent'
              }}
            >
              {messages.map((message, index) => {
                const isLong = isMessageLong(message.content);
                const isExpanded = expandedMessages.has(index);
                const shouldTruncate = isLong && !isExpanded;

                return (
                  <div
                    key={index}
                    className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`${message.role === "assistant" ? "w-[300px]" : "max-w-[75%]"} min-w-0 px-3 py-2.5 rounded-2xl relative text-sm border ${message.role === "assistant"
                      ? "bg-white text-gray-900 shadow-sm border-orange-100"
                      : "bg-[#ff6b35] text-white border-[#ff6b35] shadow-sm"
                      }`}>
                      <div className={`break-words ${shouldTruncate ? "line-clamp-4" : ""}`}>
                        {message.content}
                      </div>
                      {isLong && (
                        <button
                          onClick={() => toggleMessageExpand(index)}
                          className={`mt-2 text-[12px] font-medium underline ${message.role === "user" ? "text-white/90 hover:text-white" : "text-orange-600 hover:text-orange-700"
                            }`}
                        >
                          {isExpanded ? "Thu gọn" : "Xem thêm"}
                        </button>
                      )}
                      <span className={`block text-[12px] mt-1 text-right ${message.role === "user" ? "text-white/80" : "text-gray-500"
                        }`}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="mb-3 flex justify-start">
                  <div className="w-[300px] px-3 py-2.5 rounded-xl bg-white text-[#212121] shadow-sm">
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-[typing_1.4s_infinite]"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-[typing_1.4s_infinite] [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-gray-500 animate-[typing_1.4s_infinite] [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 bg-white border-t border-orange-100 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 px-3 py-2 border border-orange-100 rounded-xl text-sm outline-none transition-colors duration-200 focus:border-[#ff6b35] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Nhập tin nhắn của bạn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="px-4 py-2 bg-[#ff6b35] text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#e55a2b] disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add custom animations to style tag */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
