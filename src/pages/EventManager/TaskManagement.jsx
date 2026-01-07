import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  X,
  Edit,
  Eye,
  Search,
  Users,
  Trash2,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  User,
} from "lucide-react";
import eventService from "../../services/EventService";

const TaskManagement = () => {
  const [parentEvents, setParentEvents] = useState([]);
  const [subEvents, setSubEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedParentEvent, setSelectedParentEvent] = useState(null);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Pagination
  const [parentPagination, setParentPagination] = useState({
    currentPage: 1,
    pageSize: 9,
    totalPages: 0,
    totalItems: 0,
  });

  const [subPagination, setSubPagination] = useState({
    currentPage: 1,
    pageSize: 6,
    totalPages: 0,
    totalItems: 0,
  });

  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    status: "pending",
    startDate: "",
    dueDate: "",
    report: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [allParentEventsCache, setAllParentEventsCache] = useState([]);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    fetchParentEvents();
    fetchUsers();
  }, []);

  const fetchParentEvents = async (page = 1, pageSize = 9) => {
    try {
      setLoading(true);

      let allParentEvents = allParentEventsCache;

      // Chỉ fetch nếu chưa có cache
      if (allParentEvents.length === 0) {
        const response = await eventService.getAllEvents({
          page: 1,
          pageSize: 100,
        });

        allParentEvents = (response.data || []).filter(
          (event) => event.parentEventId === null
        );

        setAllParentEventsCache(allParentEvents); // Cache lại
      }

      // Pagination trên FE
      const totalItems = allParentEvents.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEvents = allParentEvents.slice(startIndex, endIndex);

      setParentEvents(paginatedEvents);
      setParentPagination({
        currentPage: page,
        pageSize: pageSize,
        totalPages: totalPages,
        totalItems: totalItems,
      });
    } catch (error) {
      console.error("Error fetching parent events:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchSubEvents = async (parentEventId, page = 1) => {
    try {
      setLoading(true);
      const res = await eventService.getSubEventsByParentID(parentEventId, {
        page,
        pageSize: 10,
      });

      // Ensure every subEvent has subEventId (fallback to id or sub_event_id)
      const normalizedSubEvents = (res.data || []).map((se) => ({
        ...se,
        subEventId: se.subEventId || se.id || se.sub_event_id,
      }));
      setSubEvents(normalizedSubEvents);
      setSubPagination({
        currentPage: page,
        pageSize: 10,
        totalPages: res.totalPages,
        totalItems: res.totalItems,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchTasks = async (subEventId, page = 1) => {
    try {
      setLoading(true);
      // Mock API call - Replace with: taskService.getTasksBySubEvent()
      const mockTasks = [
        {
          taskId: 1,
          eventId: subEventId,
          title: "Setup stage and audio system",
          description: "Prepare main stage with microphones and speakers",
          assignedTo: 1,
          assignedUser: {
            userId: 1,
            fullName: "Nguyen Van A",
            email: "vana@fpt.edu.vn",
          },
          status: "in_progress",
          startDate: "2025-03-14T08:00:00",
          dueDate: "2025-03-14T17:00:00",
          completedAt: null,
          report: null,
          createdAt: "2025-01-15T10:00:00",
        },
        {
          taskId: 2,
          eventId: subEventId,
          title: "Coordinate with speakers",
          description: "Confirm attendance and technical requirements",
          assignedTo: 2,
          assignedUser: {
            userId: 2,
            fullName: "Tran Thi B",
            email: "thib@fpt.edu.vn",
          },
          status: "pending",
          startDate: "2025-03-10T09:00:00",
          dueDate: "2025-03-14T18:00:00",
          completedAt: null,
          report: null,
          createdAt: "2025-01-15T10:30:00",
        },
        {
          taskId: 3,
          eventId: subEventId,
          title: "Print event materials",
          description: "Print brochures, name tags, and schedules",
          assignedTo: 3,
          assignedUser: {
            userId: 3,
            fullName: "Le Van C",
            email: "vanc@fpt.edu.vn",
          },
          status: "completed",
          startDate: "2025-03-08T09:00:00",
          dueDate: "2025-03-13T17:00:00",
          completedAt: "2025-03-12T15:30:00",
          report: "All materials printed and ready for distribution",
          createdAt: "2025-01-15T11:00:00",
        },
      ];

      setTasks(mockTasks);
      setTaskPagination({
        currentPage: page,
        pageSize: 10,
        totalPages: 1,
        totalItems: mockTasks.length,
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Mock API call - Replace with: userService.getAllUsers()
      const mockUsers = [
        { userId: 1, fullName: "Nguyen Van A", email: "vana@fpt.edu.vn" },
        { userId: 2, fullName: "Tran Thi B", email: "thib@fpt.edu.vn" },
        { userId: 3, fullName: "Le Van C", email: "vanc@fpt.edu.vn" },
        { userId: 4, fullName: "Pham Thi D", email: "thid@fpt.edu.vn" },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleParentEventSelect = (event) => {
    setSelectedParentEvent(event);
    setSelectedSubEvent(null);
    setTasks([]);
    fetchSubEvents(event.eventId);
  };

  const handleSubEventSelect = (subEvent) => {
    setSelectedSubEvent(subEvent);
    fetchTasks(subEvent.subEventId);
  };

  const handleCreateNew = () => {
    if (!selectedSubEvent) {
      alert("Please select a sub-event first!");
      return;
    }
    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      status: "pending",
      startDate: "",
      dueDate: "",
      report: "",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo.toString(),
      status: task.status,
      startDate: task.startDate.slice(0, 16),
      dueDate: task.dueDate.slice(0, 16),
      report: task.report || "",
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Task title is required";
    if (!formData.assignedTo) errors.assignedTo = "Please assign to a user";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.dueDate) errors.dueDate = "Due date is required";
    if (
      formData.startDate &&
      formData.dueDate &&
      new Date(formData.dueDate) <= new Date(formData.startDate)
    ) {
      errors.dueDate = "Due date must be after start date";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const createTaskDto = {
      eventId: selectedSubEvent.subEventId,
      title: formData.title,
      description: formData.description || null,
      assignedTo: parseInt(formData.assignedTo),
      status: formData.status,
      startDate: new Date(formData.startDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      report: formData.report || null,
    };

    console.log("Creating task:", createTaskDto);
    // Replace with: await taskService.createTask(createTaskDto);

    // Mock success
    alert("Task created successfully!");
    setShowCreateModal(false);
    fetchTasks(selectedSubEvent.subEventId);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updateTaskDto = {
      title: formData.title,
      description: formData.description || null,
      assignedTo: parseInt(formData.assignedTo),
      status: formData.status,
      startDate: new Date(formData.startDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      report: formData.report || null,
      completedAt:
        formData.status === "completed" ? new Date().toISOString() : null,
    };

    console.log("Updating task:", selectedTask.taskId, updateTaskDto);
    // Replace with: await taskService.updateTask(selectedTask.taskId, updateTaskDto);

    alert("Task updated successfully!");
    setShowEditModal(false);
    fetchTasks(selectedSubEvent.subEventId);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    console.log("Deleting task:", taskId);
    // Replace with: await taskService.deleteTask(taskId);

    alert("Task deleted successfully!");
    fetchTasks(selectedSubEvent.subEventId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1:
        return "bg-gray-100 text-gray-700 border border-gray-300";
      case 3:
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case 4:
        return "bg-green-100 text-green-700 border border-green-300";
      case 5:
        return "bg-purple-100 text-purple-700 border border-purple-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "completed":
        return "bg-green-100 text-green-700 border border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  const getTaskStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  // Thêm component này trước return statement của TaskManagement
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg font-medium ${
              currentPage === page
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                ✅ Task Management
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create and assign tasks for sub-events
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              disabled={!selectedSubEvent}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Parent Events Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Step 1: Select Parent Event
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parentEvents.map((event) => (
              <button
                key={event.eventId}
                onClick={() => handleParentEventSelect(event)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedParentEvent?.eventId === event.eventId
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300 bg-white"
                }`}
              >
                <div className="font-semibold text-slate-900 mb-1">
                  {event.eventName}
                </div>
                <div className="text-xs text-slate-600">
                  {formatDate(event.startTime)}
                </div>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    event.statusId
                  )}`}
                >
                  {event.status.statusName}
                </span>
              </button>
            ))}
          </div>
          {parentPagination.totalPages > 1 && (
            <Pagination
              currentPage={parentPagination.currentPage}
              totalPages={parentPagination.totalPages}
              onPageChange={(page) => fetchParentEvents(page)}
            />
          )}
        </div>

        {/* Sub-Events Selection */}
        {selectedParentEvent && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-indigo-600" />
              Step 2: Select Sub-Event
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subEvents.map((subEvent) => (
                <button
                  key={subEvent.subEventId}
                  onClick={() => handleSubEventSelect(subEvent)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedSubEvent?.subEventId === subEvent.subEventId
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-indigo-300 bg-white"
                  }`}
                >
                  <div className="font-semibold text-slate-900 mb-1">
                    {subEvent.eventName}
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    {formatDate(subEvent.startTime)}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2">
                    {subEvent.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tasks List */}
        {selectedSubEvent && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
                Tasks for "{selectedSubEvent.eventName}"
              </h2>
              <div className="text-sm text-slate-600">
                {filteredTasks.length} task(s)
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  No tasks found. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.taskId}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {task.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getTaskStatusColor(
                              task.status
                            )}`}
                          >
                            {getTaskStatusLabel(task.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {task.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Assigned to</div>
                              <div className="font-semibold text-slate-900">
                                {task.assignedUser?.fullName || "Unassigned"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Start</div>
                              <div className="font-semibold text-slate-900">
                                {formatDate(task.startDate)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Due</div>
                              <div className="font-semibold text-slate-900">
                                {formatDate(task.dueDate)}
                              </div>
                            </div>
                          </div>

                          {task.completedAt && (
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <div>
                                <div className="text-slate-500">Completed</div>
                                <div className="font-semibold text-slate-900">
                                  {formatDate(task.completedAt)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {task.report && (
                          <div className="flex items-start gap-2 text-xs bg-slate-50 p-3 rounded-lg">
                            <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
                            <div>
                              <div className="font-semibold text-slate-700 mb-1">
                                Report
                              </div>
                              <div className="text-slate-600">
                                {task.report}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(task)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.taskId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {showCreateModal ? "Create Task" : "Edit Task"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={showCreateModal ? handleSubmitCreate : handleSubmitEdit}
            >
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.title ? "border-red-500" : "border-slate-300"
                    }`}
                    placeholder="Enter task title"
                  />
                  {formErrors.title && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.title}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.assignedTo
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                  {formErrors.assignedTo && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.assignedTo}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.startDate
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.startDate && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.startDate}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.dueDate
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.dueDate && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {showEditModal && formData.status === "completed" && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Report
                    </label>
                    <textarea
                      name="report"
                      value={formData.report}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      placeholder="Enter task completion report"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {showCreateModal ? "Create Task" : "Update Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Task Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {selectedTask.title}
                  </h3>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getTaskStatusColor(
                      selectedTask.status
                    )}`}
                  >
                    {getTaskStatusLabel(selectedTask.status)}
                  </span>
                </div>
                {selectedTask.description && (
                  <p className="text-slate-600 mt-3">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <User className="w-5 h-5" />
                    <span className="font-semibold">Assigned To</span>
                  </div>
                  <div className="text-slate-900 font-medium">
                    {selectedTask.assignedUser?.fullName || "Unassigned"}
                  </div>
                  <div className="text-sm text-slate-600">
                    {selectedTask.assignedUser?.email}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold">Created At</span>
                  </div>
                  <div className="text-slate-900 font-medium">
                    {formatDate(selectedTask.createdAt)}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Start Date</span>
                  </div>
                  <div className="text-slate-900 font-medium">
                    {formatDate(selectedTask.startDate)}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Due Date</span>
                  </div>
                  <div className="text-slate-900 font-medium">
                    {formatDate(selectedTask.dueDate)}
                  </div>
                </div>

                {selectedTask.completedAt && (
                  <div className="bg-green-50 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Completed At</span>
                    </div>
                    <div className="text-green-900 font-medium">
                      {formatDate(selectedTask.completedAt)}
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.report && (
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="flex items-center gap-2 text-indigo-700 mb-3">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold text-lg">
                      Completion Report
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedTask.report}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedTask);
                }}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
