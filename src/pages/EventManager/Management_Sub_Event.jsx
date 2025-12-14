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
  ChevronRight,
  Package,
  Plus,
  Minus,
} from "lucide-react";
import eventService from "../../services/EventService";
import { toast } from "react-toastify";

const SubEventManagement = () => {
  const [parentEvents, setParentEvents] = useState([]);
  const [subEvents, setSubEvents] = useState([]);
  const [selectedParentEvent, setSelectedParentEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  //   const [searchTerm, setSearchTerm] = useState("");
  //   const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [parentPagination, setParentPagination] = useState({
    currentPage: 1,
    pageSize: 9, // 3x3 grid
    totalPages: 0,
    totalItems: 0,
  });

  const [subPagination, setSubPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
  });
  // Resources
  const [internalResources, setInternalResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [externalServices, setExternalServices] = useState([]);

  // Locations
  const [internalLocations, setInternalLocations] = useState([]);
  const [externalLocations, setExternalLocations] = useState([]);

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
    locationType: "internal",
    resourceType: "internal", // "internal" or "external"
  });

  const [formErrors, setFormErrors] = useState({});

  // Mock data - Replace with actual API calls
  useEffect(() => {
    fetchParentEvents();
    fetchInternalLocations();
    fetchExternalLocations();
    fetchInternalResources();
  }, []);

  // Thêm state để cache
  const [allParentEventsCache, setAllParentEventsCache] = useState([]);

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

  const fetchInternalLocations = async () => {
    try {
      const response = await eventService.getAllLocations({
        page: 1,
        pageSize: 100,
      });
      eventService.getAllExternalLocations({ page: 1, pageSize: 100 }),
        setInternalLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchExternalLocations = async () => {
    try {
      const response = await eventService.getAllLocations({
        page: 1,
        pageSize: 100,
      });
      eventService.getAllExternalLocations({ page: 1, pageSize: 100 }),
        setExternalLocations(response.data);
    } catch (error) {
      console.error("Error fetching external locations:", error);
    }
  };

  const fetchInternalResources = async () => {
    try {
      const response = await eventService.getAllResources({
        page: 1,
        pageSize: 100,
      });
      setInternalResources(response.data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };
  const handleParentEventSelect = (event) => {
    setSelectedParentEvent(event);
    fetchSubEvents(event.eventId);
  };

  const handleCreateNew = () => {
    if (!selectedParentEvent) {
      alert("Please select a parent event first!");
      return;
    }
    setFormData({
      eventName: "",
      description: "",
      bannerUrl: "",
      startTime: selectedParentEvent.startTime.slice(0, 16),
      endTime: selectedParentEvent.endTime.slice(0, 16),
      expectedAttendees: "",
      estimatedCost: "",
      locationId: "",
      externalLocationId: "",
      locationType: "internal",
      resourceType: "internal",
    });

    setSelectedResources([]);
    setExternalServices([]);
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEdit = (subEvent) => {
    setSelectedSubEvent(subEvent);
    setFormData({
      eventName: subEvent.eventName,
      description: subEvent.description || "",
      bannerUrl: subEvent.bannerUrl || "",
      startTime: subEvent.startTime.slice(0, 16),
      endTime: subEvent.endTime.slice(0, 16),
      expectedAttendees: subEvent.expectedAttendees || "",
      estimatedCost: subEvent.estimatedCost || "",
      locationId: subEvent.locationId || "",
      externalLocationId: subEvent.externalLocationId || "",
      locationType: subEvent.locationId ? "internal" : "external",
      resourceType: "internal",
    });
    setSelectedResources(subEvent.resources || []);
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleViewDetails = (subEvent) => {
    setSelectedSubEvent(subEvent);
    setShowDetailModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "locationType" || name === "resourceType") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "locationType" && {
          locationId: "",
          externalLocationId: "",
        }),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Resource selection for internal resources
  const handleResourceSelect = (resource) => {
    const exists = selectedResources.find(
      (r) => r.resourceId === resource.resourceId
    );
    if (exists) {
      setSelectedResources(
        selectedResources.filter((r) => r.resourceId !== resource.resourceId)
      );
    } else {
      setSelectedResources([
        ...selectedResources,
        { ...resource, requestedQuantity: 1 },
      ]);
    }
  };

  const handleResourceQuantityChange = (resourceId, quantity) => {
    setSelectedResources(
      selectedResources.map((r) =>
        r.resourceId === resourceId
          ? {
              ...r,
              requestedQuantity: Math.max(1, Math.min(quantity, r.quantity)),
            }
          : r
      )
    );
  };

  // External service management
  const addExternalService = () => {
    setExternalServices([
      ...externalServices,
      {
        id: Date.now(),
        providerName: "",
        resourceType: "",
        cost: "",
        note: "",
      },
    ]);
  };

  const removeExternalService = (id) => {
    setExternalServices(externalServices.filter((s) => s.id !== id));
  };

  const handleExternalServiceChange = (id, field, value) => {
    setExternalServices(
      externalServices.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.eventName.trim())
      errors.eventName = "Sub-event name is required";
    if (!formData.startTime) errors.startTime = "Start time is required";
    if (!formData.endTime) errors.endTime = "End time is required";
    if (
      formData.startTime &&
      formData.endTime &&
      new Date(formData.endTime) <= new Date(formData.startTime)
    ) {
      errors.endTime = "End time must be after start time";
    }
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

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const createSubEventDto = {
      parentEventId: selectedParentEvent.eventId,
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

    console.log("Creating sub-event:", createSubEventDto);
    // Replace with actual API call: await eventService.createSubEvent(createSubEventDto);

    try {
      const response = await eventService.createSubEvent(
        selectedParentEvent.eventId, // eventId riêng
        createSubEventDto // data không chứa parentEventId nữa
      );
      console.log("Create Sub-Event Response:", response);
      
      if (
        formData.resourceType === "internal" &&
        selectedResources.length > 0
      ) {
        await eventService.assignEventResources({
          eventId: response.data.subEventId,
          resources: selectedResources.map((r) => ({
            resourceId: r.resourceId,
            quantity: r.requestedQuantity,
          })),
        });
      }

      // Nếu có External Services
      if (formData.resourceType === "external" && externalServices.length > 0) {
        for (const service of externalServices) {
          await eventService.createExternalService({
            eventId: response.data.subEventId,
            providerName: service.providerName,
            resourceType: service.resourceType,
            cost: parseFloat(service.cost),
            note: service.note || null,
          });
        }
      }

      if (response.success) {
        fetchSubEvents(selectedParentEvent.eventId);
        setShowCreateModal(false);
        toast.success("Sub-event created successfully!");
      }
    } catch (error) {
      console.error("Error creating sub-event:", error);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updateSubEventDto = {
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

    console.log(
      "Updating sub-event:",
      selectedSubEvent.subEventId,
      updateSubEventDto
    );
    try {
      const updatedSubEvent = await eventService.updateSubEvent(
        selectedSubEvent.subEventId,
        updateSubEventDto
      );
      if (
        formData.resourceType === "internal" &&
        selectedResources.length > 0
      ) {
        await eventService.updateAssignEventResources({
          eventId: selectedSubEvent.subEventId,
          resources: selectedResources.map((r) => ({
            resourceId: r.resourceId,
            quantity: r.requestedQuantity,
          })),
        });
      }
      // Nếu có External Services
      if (formData.resourceType === "external" && externalServices.length > 0) {
        for (const service of externalServices) {
          await eventService.updateExternalService({
            eventId: selectedSubEvent.subEventId,
            providerName: service.providerName,
            resourceType: service.resourceType,
            cost: parseFloat(service.cost),
            note: service.note || null,
          });
        }
      }
      if (updatedSubEvent.success) {
        setShowEditModal(false);
        fetchSubEvents(selectedParentEvent.eventId);
        toast.success("Sub-event updated successfully!");
      }
    } catch (error) {
      console.error("Error updating sub-event:", error);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                🎪 Sub-Event Management
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create and manage sub-events for parent events
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              disabled={!selectedParentEvent}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Sub-Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Parent Events Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Select Parent Event
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
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() =>
                  fetchParentEvents(
                    parentPagination.currentPage - 1,
                    parentPagination.pageSize
                  )
                }
                disabled={parentPagination.currentPage === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-slate-700">
                Page {parentPagination.currentPage} of{" "}
                {parentPagination.totalPages}
              </span>
              <button
                onClick={() =>
                  fetchParentEvents(
                    parentPagination.currentPage + 1,
                    parentPagination.pageSize
                  )
                }
                disabled={
                  parentPagination.currentPage === parentPagination.totalPages
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Sub-Events List */}
        {selectedParentEvent && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-indigo-600" />
                Sub-Events for "{selectedParentEvent.eventName}"
              </h2>
              <div className="text-sm text-slate-600">
                {subEvents.length} sub-event(s)
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : subEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">
                  No sub-events yet. Create one to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {subEvents.map((subEvent) => (
                  <div
                    key={subEvent.subEventId}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {subEvent.eventName}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">
                          {subEvent.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Start</div>
                              <div className="font-semibold text-slate-900">
                                {formatDate(subEvent.startTime)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">End</div>
                              <div className="font-semibold text-slate-900">
                                {formatDate(subEvent.endTime)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Location</div>
                              <div className="font-semibold text-slate-900">
                                {subEvent.location?.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-slate-500">Attendees</div>
                              <div className="font-semibold text-slate-900">
                                {subEvent.expectedAttendees}
                              </div>
                            </div>
                          </div>
                        </div>

                        {subEvent.resources &&
                          subEvent.resources.length > 0 && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Package className="w-4 h-4 text-indigo-600" />
                              <span className="text-slate-600">
                                {subEvent.resources.length} resource(s) assigned
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(subEvent)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(subEvent)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Thêm sau </div> của space-y-4 */}
            {subPagination.totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  {(subPagination.currentPage - 1) * subPagination.pageSize + 1}{" "}
                  -{" "}
                  {Math.min(
                    subPagination.currentPage * subPagination.pageSize,
                    subPagination.totalItems
                  )}{" "}
                  of {subPagination.totalItems} sub-events
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      fetchSubEvents(
                        selectedParentEvent.eventId,
                        subPagination.currentPage - 1,
                        subPagination.pageSize
                      )
                    }
                    disabled={subPagination.currentPage === 1}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-slate-700">
                    Page {subPagination.currentPage} of{" "}
                    {subPagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      fetchSubEvents(
                        selectedParentEvent.eventId,
                        subPagination.currentPage + 1,
                        subPagination.pageSize
                      )
                    }
                    disabled={
                      subPagination.currentPage === subPagination.totalPages
                    }
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
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
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {showCreateModal ? "Create Sub-Event" : "Edit Sub-Event"}
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
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sub-Event Name <span className="text-red-500">*</span>
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
                    placeholder="Enter sub-event name"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    placeholder="Enter description"
                  />
                </div>

                {/* Time */}
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

                {/* Attendees & Cost */}
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Number of attendees"
                    />
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
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter budget"
                    />
                  </div>
                </div>

                {/* Location Type */}
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
                        className="w-4 h-4 text-indigo-600"
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
                        className="w-4 h-4 text-indigo-600"
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

                {/* Resource Type */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Resource Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resourceType"
                        value="internal"
                        checked={formData.resourceType === "internal"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-slate-700">Internal Resources</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resourceType"
                        value="external"
                        checked={formData.resourceType === "external"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-slate-700">External Services</span>
                    </label>
                  </div>

                  {/* Internal Resources */}
                  {formData.resourceType === "internal" && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-600" />
                        Select Resources
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                        {internalResources.map((resource) => {
                          const isSelected = selectedResources.find(
                            (r) => r.resourceId === resource.resourceId
                          );
                          return (
                            <div
                              key={resource.resourceId}
                              className={`border-2 rounded-lg p-3 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-50"
                                  : "border-slate-200 bg-white hover:border-indigo-300"
                              }`}
                              onClick={() => handleResourceSelect(resource)}
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={resource.imageUrl}
                                  alt={resource.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900">
                                    {resource.name}
                                  </div>
                                  <div className="text-xs text-slate-600">
                                    {resource.type}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Available: {resource.quantity}
                                  </div>
                                  {isSelected && (
                                    <div
                                      className="flex items-center gap-2 mt-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleResourceQuantityChange(
                                            resource.resourceId,
                                            isSelected.requestedQuantity - 1
                                          )
                                        }
                                        className="p-1 bg-slate-200 hover:bg-slate-300 rounded"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        value={isSelected.requestedQuantity}
                                        onChange={(e) =>
                                          handleResourceQuantityChange(
                                            resource.resourceId,
                                            parseInt(e.target.value) || 1
                                          )
                                        }
                                        className="w-16 px-2 py-1 text-center border border-slate-300 rounded text-sm"
                                        min="1"
                                        max={resource.quantity}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleResourceQuantityChange(
                                            resource.resourceId,
                                            isSelected.requestedQuantity + 1
                                          )
                                        }
                                        className="p-1 bg-slate-200 hover:bg-slate-300 rounded"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {selectedResources.length > 0 && (
                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                          <div className="text-sm font-semibold text-indigo-900 mb-2">
                            Selected: {selectedResources.length} resource(s)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedResources.map((r) => (
                              <span
                                key={r.resourceId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs"
                              >
                                {r.name} × {r.requestedQuantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* External Services */}
                  {formData.resourceType === "external" && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          <Package className="w-5 h-5 text-indigo-600" />
                          External Services
                        </h3>
                        <button
                          type="button"
                          onClick={addExternalService}
                          className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Service
                        </button>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {externalServices.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            No external services added yet. Click "Add Service"
                            to start.
                          </div>
                        ) : (
                          externalServices.map((service) => (
                            <div
                              key={service.id}
                              className="bg-white rounded-lg p-3 border border-slate-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    placeholder="Provider Name *"
                                    value={service.providerName}
                                    onChange={(e) =>
                                      handleExternalServiceChange(
                                        service.id,
                                        "providerName",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Resource Type *"
                                    value={service.resourceType}
                                    onChange={(e) =>
                                      handleExternalServiceChange(
                                        service.id,
                                        "resourceType",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Cost (VND) *"
                                    value={service.cost}
                                    onChange={(e) =>
                                      handleExternalServiceChange(
                                        service.id,
                                        "cost",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Note"
                                    value={service.note}
                                    onChange={(e) =>
                                      handleExternalServiceChange(
                                        service.id,
                                        "note",
                                        e.target.value
                                      )
                                    }
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExternalService(service.id)
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {showCreateModal ? "Create Sub-Event" : "Update Sub-Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubEvent && (
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
                Sub-Event Details
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
                  Sub-Event Name
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {selectedSubEvent.eventName}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Description
                </div>
                <div className="text-slate-700">
                  {selectedSubEvent.description || "No description"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Start Time
                  </div>
                  <div className="text-slate-900">
                    {formatDate(selectedSubEvent.startTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    End Time
                  </div>
                  <div className="text-slate-900">
                    {formatDate(selectedSubEvent.endTime)}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Location
                </div>
                <div className="text-slate-900">
                  {selectedSubEvent.location?.name} - Building{" "}
                  {selectedSubEvent.location?.building}, Room{" "}
                  {selectedSubEvent.location?.roomNumber}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Expected Attendees
                </div>
                <div className="text-slate-900">
                  {selectedSubEvent.expectedAttendees || "Not specified"}
                </div>
              </div>
              {selectedSubEvent.resources &&
                selectedSubEvent.resources.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Assigned Resources
                    </div>
                    <div className="space-y-2">
                      {selectedSubEvent.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <span className="text-slate-900">
                            {resource.name}
                          </span>
                          <span className="text-sm text-slate-600">
                            Quantity: {resource.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </div>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedSubEvent.statusId
                  )}`}
                >
                  {selectedSubEvent.statusName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubEventManagement;
