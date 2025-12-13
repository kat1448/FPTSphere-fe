import React, { useState, useEffect } from "react";
import eventService from "../../services/EventService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const StaffDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventTaskByStaff();
      setTasks(response);
      calculateStats(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Lỗi khi tải danh sách task!");
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    console.log(taskList);
    const stats = {
      total: taskList.length,
      todo: taskList.filter((t) => t.status === "To Do").length,
      inProgress: taskList.filter((t) => t.status === "In Progress").length,
      completed: taskList.filter((t) => t.status === "Completed").length,
    };
    setStats(stats);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTasks = await eventService.updateEventTaskByStaff(
        draggedTask.taskId,
        newStatus
      );

      if (updatedTasks) {
        toast.success("Cập nhật trạng thái task thành công!");
        fetchTasks();
      } else {
        toast.error("Không thể cập nhật trạng thái task!");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Lỗi khi cập nhật trạng thái task!");
    }

    setDraggedTask(null);
  };

  const handleOpenReport = (task) => {
    setSelectedTask(task);
    setReportText(task.report || "");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedTask) return;

    try {
      const updatedTasks = tasks.map((task) =>
        task.taskId === selectedTask.taskId
          ? { ...task, report: reportText }
          : task
      );

      setTasks(updatedTasks);
      toast.success("Lưu report thành công!");
      setShowReportModal(false);
      setSelectedTask(null);
      setReportText("");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Lỗi khi lưu report!");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>


      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .task-card {
          transition: all 0.3s ease;
        }
        
        .task-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .stat-card {
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .btn-report {
          transition: all 0.2s ease;
        }
        
        .btn-report:hover {
          transform: scale(1.02);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div
          style={{ ...styles.statCard, ...styles.statCardPurple }}
          className="stat-card"
        >
          <div style={styles.statContent}>
            <div>
              <p style={styles.statLabel}>Tổng Task</p>
              <p style={styles.statValue}>{stats.total}</p>
            </div>
            <div style={{ ...styles.statIcon, ...styles.statIconPurple }}>
              📊
            </div>
          </div>
        </div>

        <div
          style={{ ...styles.statCard, ...styles.statCardGray }}
          className="stat-card"
        >
          <div style={styles.statContent}>
            <div>
              <p style={styles.statLabel}>Chưa bắt đầu</p>
              <p style={styles.statValue}>{stats.todo}</p>
            </div>
            <div style={{ ...styles.statIcon, ...styles.statIconGray }}>⚠️</div>
          </div>
        </div>

        <div
          style={{ ...styles.statCard, ...styles.statCardBlue }}
          className="stat-card"
        >
          <div style={styles.statContent}>
            <div>
              <p style={styles.statLabel}>Đang thực hiện</p>
              <p style={styles.statValue}>{stats.inProgress}</p>
            </div>
            <div style={{ ...styles.statIcon, ...styles.statIconBlue }}>⏱️</div>
          </div>
        </div>

        <div
          style={{ ...styles.statCard, ...styles.statCardGreen }}
          className="stat-card"
        >
          <div style={styles.statContent}>
            <div>
              <p style={styles.statLabel}>Hoàn thành</p>
              <p style={styles.statValue}>{stats.completed}</p>
            </div>
            <div style={{ ...styles.statIcon, ...styles.statIconGreen }}>
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={styles.kanbanGrid}>
        {[
          { status: "To Do", icon: "⚠️", color: "#6b7280" },
          { status: "In Progress", icon: "⏱️", color: "#3b82f6" },
          { status: "Completed", icon: "✅", color: "#10b981" },
        ].map((column) => (
          <div
            key={column.status}
            style={{
              ...styles.kanbanColumn,
              borderTop: `4px solid ${column.color}`,
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div style={styles.columnHeader}>
              <h3 style={styles.columnTitle}>
                <span style={styles.columnIcon}>{column.icon}</span>
                {column.status}
                <span style={styles.columnCount}>
                  {tasks.filter((t) => t.status === column.status).length}
                </span>
              </h3>
            </div>

            <div style={styles.columnContent}>
              {tasks
                .filter((task) => task.status === column.status)
                .map((task) => (
                  <div
                    key={task.taskId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    style={styles.taskCard}
                    className="task-card"
                  >
                    <div style={styles.taskHeader}>
                      <h4 style={styles.taskTitle}>{task.title}</h4>
                      <span style={styles.taskId}>#{task.taskId}</span>
                    </div>

                    <p style={styles.taskDescription} className="line-clamp-2">
                      {task.description}
                    </p>

                    <div style={styles.taskDeadline}>
                      <span>📅</span>
                      <span>Deadline: {formatDate(task.dueDate)}</span>
                    </div>

                    <div style={styles.taskEvent}>
                      <p style={styles.taskEventName}>
                        🎯 {task.event.eventName}
                      </p>
                      <p style={styles.taskEventDate}>
                        {formatDate(task.event.startTime)} -{" "}
                        {formatDate(task.event.endTime)}
                      </p>
                    </div>

                    {task.report && (
                      <div style={styles.taskReport}>
                        <p
                          style={styles.taskReportText}
                          className="line-clamp-2"
                        >
                          📝 {task.report}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleOpenReport(task)}
                      style={styles.btnReport}
                      className="btn-report"
                    >
                      📄 {task.report ? "Xem/Cập nhật Report" : "Tạo Report"}
                    </button>
                  </div>
                ))}

              {tasks.filter((t) => t.status === column.status).length === 0 && (
                <div style={styles.emptyState}>
                  <p style={styles.emptyStateText}>Không có task nào</p>
                  <p style={styles.emptyStateSubtext}>Kéo thả task vào đây</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showReportModal && selectedTask && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {selectedTask.report ? "Cập nhật Report" : "Tạo Report"}
              </h3>
              <p style={styles.modalSubtitle}>{selectedTask.title}</p>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Nội dung báo cáo</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows="8"
                  style={styles.textarea}
                  placeholder="Nhập nội dung báo cáo chi tiết về task này..."
                />
              </div>

              <div style={styles.taskInfo}>
                <h4 style={styles.taskInfoTitle}>Thông tin Task</h4>
                <div style={styles.taskInfoContent}>
                  <p>
                    <strong>Event:</strong> {selectedTask.event.eventName}
                  </p>
                  <p>
                    <strong>Mô tả:</strong> {selectedTask.description}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{" "}
                    {formatDate(selectedTask.dueDate)}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong> {selectedTask.status}
                  </p>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setSelectedTask(null);
                  setReportText("");
                }}
                style={styles.btnCancel}
              >
                Hủy
              </button>
              <button onClick={handleSubmitReport} style={styles.btnSubmit}>
                Lưu Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
  },
  spinner: {
    width: "64px",
    height: "64px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    padding: "24px",
  },
  statCardPurple: {
    borderLeft: "4px solid #a855f7",
  },
  statCardGray: {
    borderLeft: "4px solid #6b7280",
  },
  statCardBlue: {
    borderLeft: "4px solid #3b82f6",
  },
  statCardGreen: {
    borderLeft: "4px solid #10b981",
  },
  statContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  statIcon: {
    padding: "12px",
    borderRadius: "50%",
    fontSize: "24px",
  },
  statIconPurple: {
    backgroundColor: "#f3e8ff",
  },
  statIconGray: {
    backgroundColor: "#f3f4f6",
  },
  statIconBlue: {
    backgroundColor: "#dbeafe",
  },
  statIconGreen: {
    backgroundColor: "#d1fae5",
  },
  kanbanGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
  },
  kanbanColumn: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  columnHeader: {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  columnTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  columnIcon: {
    fontSize: "20px",
  },
  columnCount: {
    marginLeft: "auto",
    fontSize: "14px",
    backgroundColor: "#f3f4f6",
    padding: "4px 8px",
    borderRadius: "9999px",
  },
  columnContent: {
    padding: "16px",
    minHeight: "400px",
    maxHeight: "600px",
    overflowY: "auto",
  },
  taskCard: {
    backgroundColor: "white",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
    cursor: "move",
  },
  taskHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  taskTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
    flex: 1,
    paddingRight: "8px",
  },
  taskId: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "9999px",
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  },
  taskDescription: {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  taskDeadline: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "12px",
  },
  taskEvent: {
    backgroundColor: "#dbeafe",
    border: "1px solid #93c5fd",
    borderRadius: "6px",
    padding: "8px",
    marginBottom: "12px",
  },
  taskEventName: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#1e40af",
    margin: 0,
    marginBottom: "4px",
  },
  taskEventDate: {
    fontSize: "12px",
    color: "#2563eb",
    margin: 0,
  },
  taskReport: {
    backgroundColor: "#d1fae5",
    border: "1px solid #86efac",
    borderRadius: "6px",
    padding: "8px",
    marginBottom: "12px",
  },
  taskReportText: {
    fontSize: "12px",
    color: "#065f46",
    margin: 0,
  },
  btnReport: {
    width: "100%",
    marginTop: "8px",
    backgroundColor: "#3b82f6",
    color: "white",
    fontSize: "12px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 0",
  },
  emptyStateText: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: 0,
  },
  emptyStateSubtext: {
    fontSize: "12px",
    color: "#d1d5db",
    margin: "4px 0 0 0",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "16px",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
    maxWidth: "672px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1f2937",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  taskInfo: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  taskInfoTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginTop: 0,
    marginBottom: "8px",
  },
  taskInfoContent: {
    fontSize: "14px",
    color: "#6b7280",
  },
  modalFooter: {
    padding: "24px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "12px",
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#e5e7eb",
    color: "#1f2937",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  btnSubmit: {
    flex: 1,
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default StaffDashboard;
