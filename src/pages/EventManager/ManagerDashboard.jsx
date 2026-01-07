import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  X,
  Edit,
  Eye,
  MapPin,
  MoreVertical,
  Search,
  Users,
  Copy,
  Trash2,
} from "lucide-react";
import eventService from "../../services/EventService";
import { toast } from "react-toastify";

const ManagerDashboard = () => {
  const user = {
    fullName: "Event Manager",
    roleName: "Event Manager",
  };

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    bannerUrl: "",
    startTime: "",
    endTime: "",
    expectedAttendees: "",
    estimatedCost: "",
    locationId: "",
    externalLocationId: "",
    locationType: "internal", // "internal" or "external"
  });

  const [formErrors, setFormErrors] = useState({});

  // Location data
  const [internalLocations, setInternalLocations] = useState([]);
  const [externalLocations, setExternalLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });

  const fetchEvent = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents({
        page,
        pageSize,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy: sortBy || undefined,
      });
      console.log(response);

      setEvents(response.data || []);
      setFilteredEvents(response.data || []);

      setPagination({
        currentPage: response.currentPage || page,
        pageSize: response.pageSize || pageSize,
        totalPages: response.totalPages || 0,
        totalItems: response.totalItems || 0,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent(pagination.currentPage, pagination.pageSize);
    fetchLocations(); // Fetch locations on mount
  }, []);

  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      // Replace with your actual API endpoints
      const [internalResponse, externalResponse] = await Promise.all([
        eventService.getAllLocations({ page: 1, pageSize: 100 }),
        eventService.getAllExternalLocations({ page: 1, pageSize: 100 }),
      ]);

      setInternalLocations(internalResponse.data || []);
      setExternalLocations(externalResponse.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    setStats({
      total: pagination.totalItems,
      draft: events.filter((e) => e.statusId === 1).length,
      upcoming: events.filter((e) => e.statusId === 3).length,
      ongoing: events.filter((e) => e.statusId === 4).length,
      completed: events.filter((e) => e.statusId === 5).length,
    });
  }, [events, pagination.totalItems]);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
    setShowMoreMenu(null);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    fetchEvent(1, pagination.pageSize);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    fetchEvent(1, pagination.pageSize);
  };

  const handleSort = (value) => {
    setSortBy(value);
    fetchEvent(1, pagination.pageSize);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      eventName: event.eventName,
      description: event.description || "",
      bannerUrl: event.bannerUrl || "",
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      expectedAttendees: event.expectedAttendees || "",
      estimatedCost: event.estimatedCost || "",
      locationId: event.locationId || "",
      externalLocationId: event.externalLocationId || "",
      locationType: event.locationId ? "internal" : "external",
    });
    setFormErrors({});
    setShowEditModal(true);
    setShowMoreMenu(null);
  };

  const handleCreateNew = () => {
    setFormData({
      eventName: "",
      description: "",
      bannerUrl: "",
      startTime: "",
      endTime: "",
      expectedAttendees: "",
      estimatedCost: "",
      locationId: "",
      externalLocationId: "",
      locationType: "internal",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.eventName.trim()) {
      errors.eventName = "Event name is required";
    } else if (formData.eventName.length > 255) {
      errors.eventName = "Event name cannot exceed 255 characters";
    }

    if (formData.description && formData.description.length > 4000) {
      errors.description = "Description cannot exceed 4000 characters";
    }

    if (formData.bannerUrl && formData.bannerUrl.length > 255) {
      errors.bannerUrl = "Banner URL cannot exceed 255 characters";
    } else if (formData.bannerUrl && !isValidUrl(formData.bannerUrl)) {
      errors.bannerUrl = "Banner URL must be a valid URL";
    }

    if (!formData.startTime) {
      errors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      errors.endTime = "End time is required";
    } else if (
      formData.startTime &&
      formData.endTime &&
      new Date(formData.endTime) <= new Date(formData.startTime)
    ) {
      errors.endTime = "End time must be after start time";
    }

    if (formData.expectedAttendees) {
      const attendees = parseInt(formData.expectedAttendees);
      if (attendees < 1 || attendees > 100000) {
        errors.expectedAttendees =
          "Expected attendees must be between 1 and 100,000";
      }
    }

    if (formData.estimatedCost) {
      const cost = parseFloat(formData.estimatedCost);
      if (cost < 0 || cost > 9999999999999.99) {
        errors.estimatedCost =
          "Estimated cost must be between 0 and 9,999,999,999,999.99";
      }
    }

    // Location validation based on type
    if (formData.locationType === "internal" && !formData.locationId) {
      errors.location = "Please select an internal location";
    } else if (
      formData.locationType === "external" &&
      !formData.externalLocationId
    ) {
      errors.location = "Please select an external location";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (error) {
      console.log(error);

      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If changing location type, clear both location fields
    if (name === "locationType") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        locationId: "",
        externalLocationId: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const createEventDto = {
      eventName: formData.eventName,
      description: formData.description || null,
      bannerUrl: formData.bannerUrl || null,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      expectedAttendees: formData.expectedAttendees
        ? parseInt(formData.expectedAttendees)
        : null,
      estimatedCost: formData.estimatedCost
        ? parseFloat(formData.estimatedCost)
        : null,
      locationId:
        formData.locationType === "internal" && formData.locationId
          ? parseInt(formData.locationId)
          : null,
      externalLocationId:
        formData.locationType === "external" && formData.externalLocationId
          ? parseInt(formData.externalLocationId)
          : null,
    };

    console.log("Creating event:", createEventDto);

    try {
      const response = await eventService.createEvent(createEventDto);
      console.log("Create event response:", response);

      if (response.success) {
        await fetchEvent(1, pagination.pageSize); // Refresh list
        setShowCreateModal(false);
        toast.success("Event created successfully!");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
    setShowCreateModal(false);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updateEventDto = {
      eventName: formData.eventName,
      description: formData.description || null,
      bannerUrl: formData.bannerUrl || null,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      expectedAttendees: formData.expectedAttendees
        ? parseInt(formData.expectedAttendees)
        : null,
      estimatedCost: formData.estimatedCost
        ? parseFloat(formData.estimatedCost)
        : null,
      locationId:
        formData.locationType === "internal" && formData.locationId
          ? parseInt(formData.locationId)
          : null,
      externalLocationId:
        formData.locationType === "external" && formData.externalLocationId
          ? parseInt(formData.externalLocationId)
          : null,
    };

    console.log("Updating event:", selectedEvent.eventId, updateEventDto);

    try {
      const response = await eventService.updateEvent(
        selectedEvent.eventId,
        updateEventDto
      );
      console.log("Update event response:", response);
      if (response.success) {
        await fetchEvent(pagination.currentPage, pagination.pageSize); // Refresh list
        setShowEditModal(false);
        toast.success("Event updated successfully!");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };

  const handleDelete = (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((e) => e.eventId !== eventId));
      setShowMoreMenu(null);
    }
  };

  const handleDuplicate = (event) => {
    const newEvent = {
      ...event,
      eventId: Math.max(...events.map((e) => e.eventId)) + 1,
      eventName: `${event.eventName} (Copy)`,
      statusId: 1,
      status: { statusName: "Draft" },
      createdAt: new Date().toISOString(),
    };
    setEvents([newEvent, ...events]);
    setShowMoreMenu(null);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                🎯 Event Management Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Welcome back,{" "}
                <span className="font-semibold text-indigo-600">
                  {user.fullName}
                </span>
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105"
            >
              <span className="text-xl">+</span>
              Create New Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
                Total Events
              </span>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {stats.total}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-gray-200 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
                Draft
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-700">
              {stats.draft}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
                Upcoming
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-700">
              {stats.upcoming}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-green-200 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
                Ongoing
              </span>
            </div>
            <div className="text-3xl font-bold text-green-700">
              {stats.ongoing}
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold text-sm uppercase tracking-wide">
                Completed
              </span>
            </div>
            <div className="text-3xl font-bold text-purple-700">
              {stats.completed}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="date">By Event Date</option>
              <option value="attendees">By Attendees</option>
            </select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 font-semibold">
              Loading events...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No events found
            </h3>
            <p className="text-slate-600">
              Try adjusting your filters or create a new event
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.eventId}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {/* Event Banner */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.eventName}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://upcontent.vn/wp-content/uploads/2024/07/banner-su-kien.jpg";
                      }}
                      onLoad={(e) => {
                        e.currentTarget.classList.remove("opacity-0");
                      }}
                      className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
                    />
                  ) : (
                    <img
                      src="https://upcontent.vn/wp-content/uploads/2024/07/banner-su-kien.jpg"
                      alt="Default banner"
                      className="w-full h-full object-cover"
                    />
                  )}

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                        event.statusId
                      )}`}
                    >
                      {event.status.statusName}
                    </span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">
                    {event.eventName}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <div className="text-slate-500">Start</div>
                        <div className="font-semibold text-slate-900">
                          {formatDate(event.startTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <div className="text-slate-500">End</div>
                        <div className="font-semibold text-slate-900">
                          {formatDate(event.endTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <div className="text-slate-500">Location</div>
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {event.location && event.location.name
                            ? event.location.name
                            : "N/A"}
                        </div>
                        <div className="text-slate-500">
                          Building{" "}
                          {event.location && event.location.building
                            ? event.location.building
                            : "N/A"}
                          , Room{" "}
                          {event.location && event.location.roomNumber
                            ? event.location.roomNumber
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs">
                        <div className="text-slate-500">Attendees</div>
                        <div className="font-semibold text-slate-900">
                          {event.expectedAttendees || 0} /{" "}
                          {event.location && event.location.capacity
                            ? event.location.capacity
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget & Creator */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="text-xs">
                      <div className="text-slate-500 uppercase tracking-wide font-semibold">
                        Estimated Budget
                      </div>
                      <div className="font-bold text-indigo-600">
                        {formatCurrency(event.estimatedCost)}
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      <div className="text-slate-500 uppercase tracking-wide font-semibold">
                        Created by
                      </div>
                      <div className="font-semibold text-slate-900">
                        {event.creator.fullName}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setShowMoreMenu(
                            showMoreMenu === event.eventId
                              ? null
                              : event.eventId
                          )
                        }
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showMoreMenu === event.eventId && (
                        <div
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDuplicate(event)}
                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDelete(event.eventId)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-600">
              Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} -{" "}
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} events
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  fetchEvent(pagination.currentPage - 1, pagination.pageSize)
                }
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-slate-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() =>
                  fetchEvent(pagination.currentPage + 1, pagination.pageSize)
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <div
          className="fixed inset-0  flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Event Details
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Event Banner
                </div>
                <img
                  src={selectedEvent.bannerUrl}
                  alt={selectedEvent.eventName}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Event Name
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {selectedEvent.eventName}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Description
                </div>
                <div className="text-slate-700">
                  {selectedEvent.description}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </div>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedEvent.statusId
                  )}`}
                >
                  {selectedEvent.status.statusName}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Start Time
                </div>
                <div className="text-slate-900">
                  {formatDate(selectedEvent.startTime)}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  End Time
                </div>
                <div className="text-slate-900">
                  {formatDate(selectedEvent.endTime)}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Location
                </div>
                <div className="text-slate-900">
                  {selectedEvent.location.name} - Building{" "}
                  {selectedEvent.location.building}, Room{" "}
                  {selectedEvent.location.roomNumber}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Expected Attendees
                </div>
                <div className="text-slate-900">
                  {selectedEvent.expectedAttendees} /{" "}
                  {selectedEvent.location.capacity
                    ? selectedEvent.location.capacity
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Estimated Budget
                </div>
                <div className="text-indigo-600 font-bold">
                  {formatCurrency(selectedEvent.estimatedCost)}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Created By
                </div>
                <div className="text-slate-900 font-semibold">
                  {selectedEvent.creator.fullName}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  {selectedEvent.creator.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvent && (
        <div
          className="fixed inset-0  flex items-center justify-center p-4 z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Edit Event</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.eventName
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="Enter event name"
                    maxLength="255"
                  />
                  {formErrors.eventName && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.eventName}
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
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none ${
                      formErrors.description
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="Enter event description"
                    maxLength="4000"
                  />
                  {formErrors.description && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.description}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 mt-1 block">
                    {formData.description.length}/4000 characters
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Banner URL
                  </label>
                  <input
                    type="url"
                    name="bannerUrl"
                    value={formData.bannerUrl}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.bannerUrl
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="https://example.com/banner.jpg"
                    maxLength="255"
                  />
                  {formErrors.bannerUrl && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.bannerUrl}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.startTime
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.startTime && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.startTime}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.endTime
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.endTime && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.endTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Expected Attendees
                    </label>
                    <input
                      type="number"
                      name="expectedAttendees"
                      value={formData.expectedAttendees}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.expectedAttendees
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Number of attendees"
                      min="1"
                      max="100000"
                    />
                    {formErrors.expectedAttendees && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.expectedAttendees}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 mt-1 block">
                      Between 1 and 100,000
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Estimated Cost (VND)
                    </label>
                    <input
                      type="number"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.estimatedCost
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Enter budget"
                      min="0"
                      step="1000"
                    />
                    {formErrors.estimatedCost && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.estimatedCost}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="locationType"
                        value="internal"
                        checked={formData.locationType === "internal"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">Internal Location</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="locationType"
                        value="external"
                        checked={formData.locationType === "external"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">External Location</span>
                    </label>
                  </div>

                  {formData.locationType === "internal" ? (
                    <select
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.location
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      disabled={loadingLocations}
                    >
                      <option value="">Select internal location</option>
                      {internalLocations.map((loc) => (
                        <option key={loc.locationId} value={loc.locationId}>
                          {loc.name} - Building {loc.building}, Room{" "}
                          {loc.roomNumber} (Capacity: {loc.capacity})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      name="externalLocationId"
                      value={formData.externalLocationId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.location
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      disabled={loadingLocations}
                    >
                      <option value="">Select external location</option>
                      {externalLocations.map((loc) => (
                        <option
                          key={loc.externalLocationId}
                          value={loc.externalLocationId}
                        >
                          {loc.name} - {loc.address} (Cost:{" "}
                          {formatCurrency(loc.cost)})
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.location && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Update Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0  flex items-center justify-center p-4 z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Create New Event
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Event Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.eventName
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="Enter event name"
                    maxLength="255"
                  />
                  {formErrors.eventName && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.eventName}
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
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none ${
                      formErrors.description
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="Enter event description"
                    maxLength="4000"
                  />
                  {formErrors.description && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.description}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 mt-1 block">
                    {formData.description.length}/4000 characters
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Banner URL
                  </label>
                  <input
                    type="url"
                    name="bannerUrl"
                    value={formData.bannerUrl}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.bannerUrl
                        ? "border-red-500"
                        : "border-slate-300"
                    }`}
                    placeholder="https://example.com/banner.jpg"
                    maxLength="255"
                  />
                  {formErrors.bannerUrl && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.bannerUrl}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.startTime
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.startTime && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.startTime}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.endTime
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                    />
                    {formErrors.endTime && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.endTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Expected Attendees
                    </label>
                    <input
                      type="number"
                      name="expectedAttendees"
                      value={formData.expectedAttendees}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.expectedAttendees
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Number of attendees"
                      min="1"
                      max="100000"
                    />
                    {formErrors.expectedAttendees && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.expectedAttendees}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 mt-1 block">
                      Between 1 and 100,000
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Estimated Cost (VND)
                    </label>
                    <input
                      type="number"
                      name="estimatedCost"
                      value={formData.estimatedCost}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.estimatedCost
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      placeholder="Enter budget"
                      min="0"
                      step="1000"
                    />
                    {formErrors.estimatedCost && (
                      <span className="text-xs text-red-500 mt-1 block">
                        {formErrors.estimatedCost}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Location Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="locationType"
                        value="internal"
                        checked={formData.locationType === "internal"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">Internal Location</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="locationType"
                        value="external"
                        checked={formData.locationType === "external"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700">External Location</span>
                    </label>
                  </div>

                  {formData.locationType === "internal" ? (
                    <select
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.location
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      disabled={loadingLocations}
                    >
                      <option value="">Select internal location</option>
                      {internalLocations.map((loc) => (
                        <option key={loc.locationId} value={loc.locationId}>
                          {loc.name} - Building {loc.building}, Room{" "}
                          {loc.roomNumber} (Capacity: {loc.capacity})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      name="externalLocationId"
                      value={formData.externalLocationId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        formErrors.location
                          ? "border-red-500"
                          : "border-slate-300"
                      }`}
                      disabled={loadingLocations}
                    >
                      <option value="">Select external location</option>
                      {externalLocations.map((loc) => (
                        <option
                          key={loc.externalLocationId}
                          value={loc.externalLocationId}
                        >
                          {loc.name} - {loc.address} (Cost:{" "}
                          {formatCurrency(loc.cost)})
                        </option>
                      ))}
                    </select>
                  )}
                  {formErrors.location && (
                    <span className="text-xs text-red-500 mt-1 block">
                      {formErrors.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
