// ========================================
// REGION: IMPORTS
// ========================================
// src/pages/EventManager/CreateEventWizard/steps/Step1MainEvent.jsx
import React, { useEffect, useState, useRef } from "react";
import { 
  Input, 
  Select, 
  DatePicker, 
  Checkbox, 
  Button, 
  Form, 
  Row, 
  Col, 
  Typography, 
  Space,
  Modal,
  Radio,
  message,
  Card,
  Divider,
  Upload,
  Image,
  InputNumber
} from "antd";
import { 
  InfoCircleOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  SaveOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  PlusOutlined,
  PictureOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
// ========================================
// REGION: API IMPORTS
// ========================================
// Import API client để call external location API
import apiClient from "../../../../services/api.js";
// Import Events API service để create event
import { createEvent as createEventAPI } from "../../../../services/events.api.js";
// Import Locations API service
import { getLocations, searchLocations, createLocation } from "../../../../services/locations.api.js";
// ========================================
// REGION: UTILITY IMPORTS
// ========================================
import { WizardSS } from "../wizardStorage";
import "../../../../assets/css/Step1MainEvent.css";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

export default function Step1MainEvent({ onNext }) {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    eventName: "",
    description: "",
    expectedAttendees: "",
    startTime: null,
    endTime: null,
    estimatedCost: "",
    hasSubEvents: true,
  });

  // ========================================
  // REGION: BANNER UPLOAD STATE
  // ========================================
  const [bannerFileList, setBannerFileList] = useState([]);
  const [bannerPreview, setBannerPreview] = useState({
    visible: false,
    image: "",
    title: "",
  });

  const [locationMode, setLocationMode] = useState("internal"); // "internal", "external"
  const [externalLocationType, setExternalLocationType] = useState("manual"); // "manual", "maps", "online"
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");
  const [eventType, setEventType] = useState("Conference");
  const [category, setCategory] = useState("Technology");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [showMapsInputModal, setShowMapsInputModal] = useState(false);
  const [mapsSearchQuery, setMapsSearchQuery] = useState("");
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  
  // Locations state
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [createLocationForm] = Form.useForm();
  const [creatingLocation, setCreatingLocation] = useState(false);

  // Convert dayjs to ISO string
  const toISO = (dayjsObj) => {
    if (!dayjsObj) return null;
    return dayjsObj.toISOString();
  };

  // ========================================
  // REGION: LOAD DRAFT DATA
  // ========================================
  // Load draft from session storage
  useEffect(() => {
    const draft = WizardSS.get("mainEventDraft", null);
    if (draft) {
      if (draft.form) {
        setFormData({
          ...draft.form,
          startTime: draft.form.startTime ? dayjs(draft.form.startTime) : null,
          endTime: draft.form.endTime ? dayjs(draft.form.endTime) : null,
        });
        form.setFieldsValue({
          eventName: draft.form.eventName,
          description: draft.form.description,
          expectedAttendees: draft.form.expectedAttendees || null,
          startTime: draft.form.startTime ? dayjs(draft.form.startTime) : null,
          endTime: draft.form.endTime ? dayjs(draft.form.endTime) : null,
          estimatedCost: draft.form.estimatedCost,
        });
      }
      setLocationMode(draft.locationMode || "internal");
      setSelectedLocation(draft.selectedLocation || null);
      setExternalLocationName(draft.externalLocationName || "");
      setExternalLocationAddress(draft.externalLocationAddress || "");
      setEventType(draft.eventType || "Conference");
      setCategory(draft.category || "Technology");
      setIsMultiDay(draft.isMultiDay || false);
      
      // Load banner if exists in draft
      if (draft.bannerUrl) {
        setBannerFileList([
          {
            uid: "-1",
            name: "banner",
            status: "done",
            url: draft.bannerUrl,
          },
        ]);
      }
    }
    
    // Load banner from mainEvent if exists (when editing)
    const mainEvent = WizardSS.get("mainEvent", null);
    if (mainEvent?.bannerUrl) {
      setBannerFileList([
        {
          uid: "-1",
          name: "banner",
          status: "done",
          url: mainEvent.bannerUrl,
        },
      ]);
    }
    // eslint-disable-next-line
  }, []);

  // Filter rooms - Initialize with locations from API
  const [filteredRooms, setFilteredRooms] = useState([]);
  
  // Load locations from API
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoadingLocations(true);
        const response = await getLocations({
          page: 1,
          pageSize: 100, // Load more locations
          sortBy: "Name",
          sortDescending: false,
        });
        
        // Handle response format: {data: [...], totalRecords: ...}
        const locationsList = response?.data || response || [];
        setLocations(locationsList);
        setFilteredRooms(locationsList);
      } catch (error) {
        console.error("Failed to load locations:", error);
        message.error("Failed to load locations");
        setLocations([]);
        setFilteredRooms([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    if (showLocationModal) {
      loadLocations();
    }
  }, [showLocationModal]);

  // Search locations with debounce
  useEffect(() => {
    const searchLocationsAPI = async () => {
    if (!searchTerm.trim()) {
        // If search is empty, show all locations
        setFilteredRooms(locations);
        return;
      }

      try {
        setLoadingLocations(true);
        const results = await searchLocations(searchTerm);
        setFilteredRooms(results || []);
      } catch (error) {
        console.error("Failed to search locations:", error);
        message.error("Failed to search locations");
        setFilteredRooms([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      if (showLocationModal) {
        searchLocationsAPI();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, showLocationModal, locations]);

  const openLocationModal = () => {
    setShowLocationModal(true);
    setSearchTerm("");
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setShowLocationModal(false);
    setSearchTerm("");
  };

  // Handle create new location
  const handleCreateLocation = async (values) => {
    try {
      setCreatingLocation(true);
      const newLocation = await createLocation({
        name: values.name,
        capacity: values.capacity,
        building: values.building,
        roomNumber: values.roomNumber,
        imageUrl: values.imageUrl || "null",
      });

      // Add new location to list
      setLocations((prev) => [...prev, newLocation]);
      setFilteredRooms((prev) => [...prev, newLocation]);
      
      // Select the newly created location
      setSelectedLocation(newLocation);
      
      // Close modals
      setShowCreateLocationModal(false);
      setShowLocationModal(false);
      createLocationForm.resetFields();
      
      message.success("Location created successfully");
    } catch (error) {
      console.error("Failed to create location:", error);
      message.error(error.message || "Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  };

  // ========================================
  // REGION: SAVE DRAFT
  // ========================================
  /**
   * Save current form data as draft
   * Includes banner URL if uploaded
   */
  const saveDraft = () => {
    const values = form.getFieldsValue();
    const bannerUrl = bannerFileList.length > 0 
      ? (bannerFileList[0].url || bannerFileList[0].thumbUrl || null)
      : null;
    
    WizardSS.set("mainEventDraft", {
      form: { 
        ...formData, 
        ...values,
        startTime: values.startTime ? values.startTime.toISOString() : null,
        endTime: values.endTime ? values.endTime.toISOString() : null,
      },
      locationMode,
      selectedLocation,
      externalLocationName,
      externalLocationAddress,
      eventType,
      category,
      isMultiDay,
      bannerUrl, // Save banner URL
      savedAt: new Date().toISOString(),
    });
    message.success("Draft saved successfully");
  };

  // ========================================
  // REGION: GOOGLE MAPS PICKER HANDLER
  // ========================================
  /**
   * Initialize Google Places Autocomplete when modal opens
   */
  useEffect(() => {
    if (!showMapsInputModal) return;

    // Check if Google Maps API is loaded
    const initAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && autocompleteInputRef.current) {
        // Initialize Autocomplete
        const autocomplete = new window.google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          {
            types: ['establishment', 'geocode'],
            fields: ['name', 'formatted_address', 'geometry', 'place_id']
          }
        );

        autocompleteRef.current = autocomplete;

        // Listen for place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (place && place.name) {
            const locationName = place.name;
            const locationAddress = place.formatted_address || "";

            setMapLocation({
              name: locationName,
              address: locationAddress
            });
            setExternalLocationName(locationName);
            setExternalLocationAddress(locationAddress);
            setMapsSearchQuery(locationName);
            
            // Auto-close modal after selection
            setTimeout(() => {
              setShowMapsInputModal(false);
              message.success("Location selected successfully");
            }, 500);
          }
        });
      } else if (autocompleteInputRef.current) {
        // Retry after a short delay if Google Maps API is not loaded yet
        setTimeout(initAutocomplete, 100);
      }
    };

    // Wait for Google Maps API to load
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      // Listen for Google Maps loaded event
      const handleGoogleMapsLoaded = () => {
        setTimeout(initAutocomplete, 100);
      };
      window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
      
      // Cleanup
      return () => {
        window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
        if (autocompleteRef.current) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
      };
    }

    // Cleanup on unmount or modal close
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [showMapsInputModal]);

  /**
   * Handle Google Maps location picker
   * Opens modal with Google Places Autocomplete
   */
  const handleMapsPick = () => {
    setShowMapsInputModal(true);
    setMapsSearchQuery("");
  };

  const handleConfirmMapsLocation = () => {
    if (!mapsSearchQuery.trim()) {
      message.warning("Please search and select a location");
      return;
    }

    // If location was already selected via autocomplete, it's already set
    if (mapLocation && mapLocation.name === mapsSearchQuery) {
      setShowMapsInputModal(false);
      return;
    }

    // Fallback: Manual entry
    const queryParts = mapsSearchQuery.split(",").map(s => s.trim());
    const locationName = queryParts[0] || mapsSearchQuery.trim();
    const locationAddress = queryParts.length > 1 ? queryParts.slice(1).join(", ") : mapsSearchQuery.trim();

    setMapLocation({
      name: locationName,
      address: locationAddress
    });
    setExternalLocationName(locationName);
    setExternalLocationAddress(locationAddress);
    setShowMapsInputModal(false);
    setMapsSearchQuery("");
    message.success("Location confirmed");
  };

  // ========================================
  // REGION: FORM SUBMISSION HANDLER
  // ========================================
  /**
   * Handle form submission
   * - Validate form fields
   * - Create external location if needed
   * - Upload banner image
   * - Call API to create event
   * - Save data to session storage
   */
  const handleSubmit = async () => {
    try {
      // ========================================
      // REGION: FORM VALIDATION
      // ========================================
      const values = await form.validateFields();
      setErr(null);

      // Validate start/end time
      if (!values.startTime || !values.endTime) {
        return setErr("Vui lòng chọn Start/End time");
      }

      const start = values.startTime.toDate();
      const end = values.endTime.toDate();

      // Validate time logic
      if (start >= end) return setErr("Start time phải trước End time");
      if (start < new Date(Date.now() - 60 * 60 * 1000)) {
        return setErr("Start time không được ở quá khứ");
      }

      // Validate location
      if (locationMode === "internal" && !selectedLocation) {
        return setErr("Vui lòng chọn phòng");
      }
      if (locationMode === "external" && externalLocationType === "manual" && !externalLocationName.trim()) {
        return setErr("Vui lòng nhập tên địa điểm");
      }

      setSaving(true);

      // ========================================
      // REGION: CREATE EXTERNAL LOCATION (if needed)
      // ========================================
      let externalLocationId = null;
      if (locationMode === "external") {
        if (externalLocationType === "online") {
          // Online event - no location needed
          externalLocationId = null;
        } else {
          // Create external location via API
          const extRes = await apiClient.post("/externallocations", {
            name: externalLocationName || "External Location",
            address: externalLocationAddress || "N/A",
            contactPerson: null,
            contactPhone: null,
            cost: null,
            note: null,
          });
          externalLocationId = extRes.data?.data?.externalLocationId ?? extRes.data?.data?.id ?? null;
          if (!extRes.data?.success || !externalLocationId) {
            throw new Error("Không tạo được external location");
          }
        }
      }

      // ========================================
      // REGION: UPLOAD BANNER IMAGE
      // ========================================
      let bannerUrl = null;
      
      // Helper function to check if URL is valid (http/https)
      const isValidHttpUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        try {
          const urlObj = new URL(url);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      };
      
      // Check if user uploaded a new banner file
      const uploadedFile = bannerFileList.find(file => file.originFileObj);
      
      if (uploadedFile && uploadedFile.originFileObj) {
        // New file uploaded - need to upload to server
        try {
          bannerUrl = await uploadBanner(uploadedFile.originFileObj);
          // Validate banner URL format (API requires valid URL)
          if (bannerUrl && !isValidHttpUrl(bannerUrl)) {
            throw new Error('Banner URL must be a valid URL');
          }
        } catch (uploadErr) {
          setErr(`Upload banner thất bại: ${uploadErr.message}`);
          setSaving(false);
          return;
        }
      } else if (bannerFileList.length > 0 && bannerFileList[0].url) {
        // Existing banner URL (from draft or previous upload)
        const existingUrl = bannerFileList[0].url;
        // Only use if it's a valid HTTP/HTTPS URL
        if (isValidHttpUrl(existingUrl)) {
          bannerUrl = existingUrl;
        } else {
          // If not a valid URL, set to null (backend will handle default)
          bannerUrl = null;
        }
      } else {
        // No banner uploaded - set to null (will use default below)
        bannerUrl = null;
      }

      // If bannerUrl is null, use default banner URL
      if (!bannerUrl) {
        bannerUrl = "https://beecomm.com.vn/wp-content/uploads/2022/09/1-event-activation.png";
      }

      // ========================================
      // REGION: PREPARE EVENT DATA FOR API
      // ========================================
      // Map form data to API request format
      // API uses camelCase, backend maps to snake_case DB columns:
      // - eventName -> event_name
      // - description -> description
      // - bannerUrl -> banner_url
      // - startTime -> start_time (ISO format: YYYY-MM-DDTHH:mm:ss)
      // - endTime -> end_time (ISO format: YYYY-MM-DDTHH:mm:ss)
      // - expectedAttendees -> expected_attendees
      // - estimatedCost -> estimated_cost
      // - locationId -> location_id
      // - externalLocationId -> external_location_id
      // - templateId -> template_id
      // - categoryId -> category_id (direct ID, not string)
      // - typeId -> type_id (direct ID, not string)
      
      // Map eventType string to typeId
      const EVENT_TYPE_MAP = {
        'Conference': 1,
        'Workshop': 2,
        'Seminar': 3,
        'Webinar': 4,
        'Meetup': 5,
        'Other': 6
      };
      
      // Map category string to categoryId
      const CATEGORY_MAP = {
        'Technology': 1,
        'Business': 2,
        'Education': 3,
        'Entertainment': 4,
        'Sports': 5,
        'Other': 6
      };
      
      const eventPayload = {
        eventName: values.eventName, // DB: event_name (VARCHAR, NOT NULL)
        description: values.description || null, // DB: description (VARCHAR, nullable)
        bannerUrl: bannerUrl || null, // DB: banner_url (VARCHAR, nullable), must be valid URL if provided
        startTime: values.startTime, // DB: start_time (DATETIME), dayjs object will be converted to ISO string (YYYY-MM-DDTHH:mm:ss)
        endTime: values.endTime, // DB: end_time (DATETIME), dayjs object will be converted to ISO string (YYYY-MM-DDTHH:mm:ss)
        expectedAttendees: values.expectedAttendees ? Number(values.expectedAttendees) : null, // DB: expected_attendees (INT, nullable)
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0, // DB: estimated_cost (DECIMAL, default 0)
        // Only send locationId if internal location is selected, otherwise send null
        locationId: locationMode === "internal" && selectedLocation?.locationId ? selectedLocation.locationId : null, // DB: location_id (INT, nullable, FK to Locations)
        // Only send externalLocationId if external location is selected and not online, otherwise send null
        externalLocationId: (locationMode === "external" && externalLocationType !== "online" && externalLocationId) ? externalLocationId : null, // DB: external_location_id (INT, nullable, FK to ExternalLocations)
        templateId: null, // DB: template_id (INT, nullable, FK to Templates), default: null
        typeId: EVENT_TYPE_MAP[eventType] || 1, // DB: type_id (INT, FK to EventTypes) - map from eventType string
        categoryId: CATEGORY_MAP[category] || 1 // DB: category_id (INT, FK to Categories) - map from category string
      };
      
      // Note: Backend will automatically set these fields:
      // - event_id (auto increment PRIMARY KEY)
      // - created_by (from JWT token in Authorization header)
      // - status_id (default status)
      // - parent_event_id (NULL for main events)
      // - created_at (current timestamp)
      // - updated_at (current timestamp)
      // - is_deleted (default false)

      // ========================================
      // REGION: CALL API TO CREATE EVENT
      // ========================================
      // API Endpoint: POST https://localhost:7273/api/Events
      // API response format: {success: true, message: "...", data: {eventId: 1, ...}}
      const apiResponse = await createEventAPI(eventPayload);

      // ========================================
      // REGION: HANDLE API RESPONSE
      // ========================================
      // Extract event data from response
      // apiResponse format: {success: true, message: "...", data: {eventId: 1, ...}}
      const created = apiResponse?.data || apiResponse;
      
      // Extract event ID from response
      const eventId = created?.eventId ?? null;
      
      // Show success message
      if (apiResponse?.success !== false) {
        const successMessage = apiResponse?.message || "Event created successfully!";
        message.success(successMessage);
      }

      const mainEventData = {
        name: values.eventName,
        description: values.description,
        expected: values.expectedAttendees ? Number(values.expectedAttendees) : null,
        start: toISO(values.startTime),
        end: toISO(values.endTime),
        estimatedCost: values.estimatedCost ? Number(values.estimatedCost) : 0,
        bannerUrl,
        locationMode,
        locationId: locationMode === "internal" ? selectedLocation?.locationId : null,
        locationName: locationMode === "internal" 
          ? selectedLocation?.name 
          : (externalLocationType === "online" ? "Online Event" : externalLocationName),
        externalLocationName: locationMode === "external" && externalLocationType !== "online" ? externalLocationName : "",
        externalLocationAddress: locationMode === "external" && externalLocationType !== "online" ? externalLocationAddress : "",
        eventId: eventId,
        hasSubEvents: !!formData.hasSubEvents,
      };

      WizardSS.set("mainEvent", mainEventData);
      WizardSS.set("subEvents", []);
      WizardSS.remove("mainEventDraft");

      // ========================================
      // REGION: NAVIGATE TO NEXT STEP
      // ========================================
      onNext();
    } catch (e) {
      // ========================================
      // REGION: ERROR HANDLING
      // ========================================
      console.error("❌ Error creating main event:", e);
      
      let errorMessage = "Tạo sự kiện thất bại";
      
      // Handle API validation errors (400 status)
      if (e.status === 400 && e.errors) {
        // Format validation errors from API
        const errorMessages = [];
        Object.keys(e.errors).forEach(field => {
          const fieldErrors = e.errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(msg => errorMessages.push(msg));
          } else {
            errorMessages.push(`${fieldErrors}`);
          }
        });
        errorMessage = errorMessages.join('\n');
      } 
      // Handle API response errors
      else if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } 
      // Handle errors object from API
      else if (e?.response?.data?.errors) {
        const errorMessages = [];
        Object.keys(e.response.data.errors).forEach(field => {
          const fieldErrors = e.response.data.errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach(msg => errorMessages.push(msg));
          } else {
            errorMessages.push(`${fieldErrors}`);
          }
        });
        errorMessage = errorMessages.join('\n');
      } 
      // Handle generic error message
      else if (e.message) {
        errorMessage = e.message;
      }
      
      setErr(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // REGION: BANNER UPLOAD FUNCTION
  // ========================================
  /**
   * Upload banner image to Cloudinary or backend
   * @param {File} file - File object to upload
   * @returns {Promise<string>} Uploaded image URL
   */
  const uploadBanner = async (file) => {
    if (!file) return null;
    
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Try backend upload first if Cloudinary not configured
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      try {
        const formDataObj = new FormData();
        formDataObj.append("file", file);
        const res = await apiClient.post("/upload/banner", formDataObj, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) {
          return res.data.data.url;
        }
      } catch (e) {
        console.error("Backend upload failed:", e);
      }
      // Fallback to placeholder
      return "https://via.placeholder.com/1200x400?text=Event+Banner";
    }

    // Upload to Cloudinary
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("upload_preset", UPLOAD_PRESET);
    formDataObj.append("folder", "fptsphere/banners");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener("load", () => {
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error("Upload failed"));
          }
        } catch {
          reject(new Error("Upload failed"));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formDataObj);
    });
  };

  return (
    <div className="step1-container" style={{ padding: "20px" }}>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleSubmit}
        style={{ 
          '--form-item-margin-bottom': '12px'
        }}
      >
        {/* General Information Section */}
        <div className="form-section" style={{ marginBottom: "12px" }}>
          <div className="section-header" style={{ marginBottom: "8px" }}>
            <InfoCircleOutlined style={{ fontSize: "20px", color: "#F2721E", marginRight: "8px" }} />
            <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>General Information</Title>
          </div>
          
          <Form.Item
            name="eventName"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Event Title</span>}
            rules={[{ required: true, message: "Please enter event title" }]}
            style={{ marginBottom: "8px" }}
          >
            <Input 
              placeholder="e.g., Annual Tech Summit 2024"
              size="large"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <Form.Item 
            name="description" 
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Description</span>}
            style={{ marginBottom: "8px" }}
          >
            <TextArea
              placeholder="Describe what your event is about, the agenda, and what attendees can expect..."
              rows={4}
              maxLength={500}
              showCount
              style={{ fontSize: "14px" }}
              className="custom-textarea"
            />
          </Form.Item>

          {/* ======================================== */}
          {/* REGION: EXPECTED ATTENDEES */}
          {/* ======================================== */}
          <Form.Item
            name="expectedAttendees"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Expected Attendees</span>}
            style={{ marginBottom: "8px" }}
            rules={[
              { required: true, message: "Please enter expected attendees" },
              {
                validator: (_, value) => {
                  // Check if value is null, undefined, or empty string
                  if (value === null || value === undefined || value === '') {
                    return Promise.reject(new Error("Please enter expected attendees"));
                  }
                  // Convert to number
                  const numValue = typeof value === 'number' ? value : Number(value);
                  // Check if valid number
                  if (isNaN(numValue)) {
                    return Promise.reject(new Error("Please enter a valid number"));
                  }
                  // Check range
                  if (numValue < 1) {
                    return Promise.reject(new Error("Expected attendees must be at least 1"));
                  }
                  if (numValue > 100000) {
                    return Promise.reject(new Error("Expected attendees must not exceed 100,000"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            initialValue={null}
          >
            <Space orientation="vertical" style={{ width: "100%" }} size={4}>
              <InputNumber
                min={1}
                max={100000}
                placeholder="Enter number of attendees"
                size="large"
                style={{ width: "100%", fontSize: "14px" }}
                id="expectedAttendeesInput"
                precision={0}
              />
              <Space size={4} wrap>
                {[15, 25, 50, 100].map((v) => (
                  <Button
                    key={v}
                    size="small"
                    onClick={() => {
                      form.setFieldsValue({ expectedAttendees: v });
                      // Focus vào input sau khi set giá trị
                      setTimeout(() => {
                        const input = document.getElementById("expectedAttendeesInput");
                        if (input) {
                          const inputElement = input.querySelector("input");
                          if (inputElement) {
                            inputElement.focus();
                            inputElement.select();
                          }
                        }
                      }, 100);
                    }}
                    style={{ fontSize: "12px" }}
                  >
                    {v}
                  </Button>
                ))}
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Unit: peoples
                </Text>
              </Space>
            </Space>
          </Form.Item>

          {/* ======================================== */}
          {/* REGION: BANNER IMAGE UPLOAD */}
          {/* ======================================== */}
          <Form.Item
            label={
              <span style={{ fontWeight: 700, fontSize: "14px" }}>
                <PictureOutlined style={{ marginRight: "8px", color: "#F2721E" }} />
                Banner Image (optional)
              </span>
            }
            style={{ marginBottom: "8px" }}
          >
            <Upload
              listType="picture-card"
              fileList={bannerFileList}
              beforeUpload={() => false} // Prevent auto upload
              onChange={({ fileList }) => {
                // Limit to 1 file
                const newFileList = fileList.slice(-1).map(file => {
                  // Create preview URL for new files
                  if (file.originFileObj && !file.url && !file.thumbUrl) {
                    file.thumbUrl = URL.createObjectURL(file.originFileObj);
                    file.url = file.thumbUrl;
                  }
                  return file;
                });
                setBannerFileList(newFileList);
                
                // Update form value if file has URL
                const file = newFileList[0];
                if (file && (file.url || file.thumbUrl)) {
                  form.setFieldsValue({
                    bannerUrl: file.url || file.thumbUrl,
                  });
                } else {
                  form.setFieldsValue({ bannerUrl: null });
                }
              }}
              onPreview={(file) => {
                // Show preview modal
                const previewUrl = file.url || file.thumbUrl || 
                  (file.originFileObj ? URL.createObjectURL(file.originFileObj) : "");
                setBannerPreview({
                  visible: true,
                  image: previewUrl,
                  title: file.name || "Banner preview",
                });
              }}
              onRemove={() => {
                setBannerFileList([]);
                form.setFieldsValue({ bannerUrl: null });
              }}
              accept="image/*"
              maxCount={1}
            >
              {bannerFileList.length >= 1 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8, fontSize: "12px" }}>Upload</div>
                </div>
              )}
            </Upload>
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#8c8c8c" }}>
              Recommended size: 1200x400px. Max file size: 5MB.
              {bannerFileList.length === 0 && (
                <span style={{ display: "block", marginTop: "4px", fontStyle: "italic" }}>
                  Default banner will be used if no image is uploaded.
                </span>
              )}
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Event Type</span>}
                style={{ marginBottom: "8px" }}
              >
                <Select
                  value={eventType}
                  onChange={setEventType}
                  size="large"
                  style={{ fontSize: "14px" }}
                  className="custom-select-orange"
                >
                  <Option value="Conference">Conference</Option>
                  <Option value="Workshop">Workshop</Option>
                  <Option value="Seminar">Seminar</Option>
                  <Option value="Webinar">Webinar</Option>
                  <Option value="Meetup">Meetup</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Category</span>}
                style={{ marginBottom: "8px" }}
              >
                <Select
                  value={category}
                  onChange={setCategory}
                  size="large"
                  style={{ fontSize: "14px" }}
                  className="custom-select-orange"
                >
                  <Option value="Technology">Technology</Option>
                  <Option value="Business">Business</Option>
                  <Option value="Education">Education</Option>
                  <Option value="Entertainment">Entertainment</Option>
                  <Option value="Sports">Sports</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Date & Time Section */}
        <div className="form-section" style={{ marginBottom: "12px" }}>
          <div className="section-header" style={{ marginBottom: "8px" }}>
            <CalendarOutlined style={{ fontSize: "20px", color: "#F2721E", marginRight: "8px" }} />
            <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>Date & Time</Title>
          </div>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Start Date</span>}
                rules={[{ required: true, message: "Please select start date" }]}
                style={{ marginBottom: "8px" }}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                  size="large"
                  className="custom-datepicker"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>End Date</span>}
                rules={[{ required: true, message: "Please select end date" }]}
                style={{ marginBottom: "8px" }}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: "100%" }}
                  size="large"
                  className="custom-datepicker"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: "8px" }}>
            <Checkbox
              checked={isMultiDay}
              onChange={(e) => setIsMultiDay(e.target.checked)}
            >
              This is a multi-day event
            </Checkbox>
          </Form.Item>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Location Section */}
        <div className="form-section" style={{ marginBottom: "12px" }}>
          <div className="section-header" style={{ marginBottom: "8px" }}>
            <EnvironmentOutlined style={{ fontSize: "20px", color: "#F2721E", marginRight: "8px" }} />
            <Title level={4} style={{ margin: 0, color: "#F2721E", fontSize: "16px", fontWeight: 600 }}>Location</Title>
          </div>
          
          <Form.Item 
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Location Type</span>}
            style={{ marginBottom: "8px" }}
          >
            <Radio.Group
              value={locationMode}
              onChange={(e) => {
                setLocationMode(e.target.value);
                setSelectedLocation(null);
                setExternalLocationName("");
                setExternalLocationAddress("");
                setExternalLocationType("manual");
              }}
            >
              <Radio value="internal">Internal</Radio>
              <Radio value="external">External</Radio>
            </Radio.Group>
          </Form.Item>

          {locationMode === "internal" && (
            <div style={{ marginBottom: "8px" }}>
              {!selectedLocation ? (
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={openLocationModal}
                  size="large"
                  style={{ fontSize: "14px", background: "#F2721E", borderColor: "#F2721E" }}
                >
                  Add Location
                </Button>
              ) : (
                <Card size="small">
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <div>
                      <Text strong>{selectedLocation.name}</Text>
                      <br />
                      <Text type="secondary">
                        {selectedLocation.building} • {selectedLocation.roomNumber} • Capacity: {selectedLocation.capacity ?? "N/A"}
                      </Text>
                    </div>
                    <Space>
                      <Button size="small" onClick={openLocationModal} style={{ fontSize: "14px" }}>Change</Button>
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => setSelectedLocation(null)}
                        style={{ fontSize: "14px" }}
                      >
                        Remove
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}
            </div>
          )}

          {locationMode === "external" && (
            <div>
              <Form.Item 
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>External Location Type</span>}
                style={{ marginBottom: "8px" }}
              >
                <Radio.Group
                  value={externalLocationType}
                  onChange={(e) => {
                    setExternalLocationType(e.target.value);
                    if (e.target.value === "online") {
                      setExternalLocationName("Online Event");
                      setExternalLocationAddress("");
                    } else {
                      setExternalLocationName("");
                      setExternalLocationAddress("");
                    }
                  }}
                >
                  <Radio value="manual">Manual Entry</Radio>
                  <Radio value="maps">Pick from Maps</Radio>
                  <Radio value="online">Online Event</Radio>
                </Radio.Group>
              </Form.Item>

              {externalLocationType === "online" && (
                <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: "8px", marginBottom: "8px" }}>
                  <Text>This event will be held online. Meeting link will be provided later.</Text>
                </div>
              )}

              {externalLocationType === "maps" && (
                <div style={{ marginBottom: "8px" }}>
                  <Space orientation="vertical" style={{ width: "100%" }} size={8}>
                    <Button
                      type="default"
                      icon={<EnvironmentOutlined />}
                      onClick={handleMapsPick}
                      size="large"
                      style={{ fontSize: "14px", borderColor: "#F2721E", color: "#F2721E" }}
                      className="maps-button-custom"
                    >
                      Pick Location from Maps
                    </Button>
                    {mapLocation && (
                      <Card size="small" style={{ marginTop: "8px", background: "#f0f9ff" }}>
                        <Space orientation="vertical" style={{ width: "100%" }} size={4}>
                          <Text strong style={{ fontSize: "14px" }}>Selected Location:</Text>
                          <Text style={{ fontSize: "14px" }}>{mapLocation.name}</Text>
                          {mapLocation.address && (
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {mapLocation.address}
                            </Text>
                          )}
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setMapLocation(null);
                              setExternalLocationName("");
                              setExternalLocationAddress("");
                            }}
                            style={{ marginTop: "8px" }}
                          >
                            Clear Selection
                          </Button>
                        </Space>
                      </Card>
                    )}
                    {!mapLocation && (
                      <Text type="secondary" style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                        Click the button above to open Google Maps and select a location. After selecting, the location details will be automatically filled in.
                      </Text>
                    )}
                  </Space>
                </div>
              )}

              {externalLocationType === "manual" && (
                <>
                  <Form.Item
                    label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Location Name</span>}
                    rules={[{ required: true, message: "Please enter location name" }]}
                    style={{ marginBottom: "8px" }}
                  >
                    <Input
                      value={externalLocationName}
                      onChange={(e) => setExternalLocationName(e.target.value)}
                      placeholder="External location name"
                      size="large"
                      style={{ fontSize: "14px" }}
                    />
                  </Form.Item>
                  <Form.Item 
                    label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Address</span>}
                    style={{ marginBottom: "8px" }}
                  >
                    <TextArea
                      value={externalLocationAddress}
                      onChange={(e) => setExternalLocationAddress(e.target.value)}
                      placeholder="External address (optional)"
                      rows={3}
                      size="large"
                      style={{ fontSize: "14px" }}
                    />
                  </Form.Item>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {err && (
          <div style={{ 
            marginBottom: "16px", 
            padding: "12px", 
            background: "#fff2f0", 
            border: "1px solid #ffccc7",
            borderRadius: "4px",
            color: "#ff4d4f"
          }}>
            <Text strong>Error: </Text>
            <Text>{err}</Text>
          </div>
        )}

        {/* Actions */}
        <Divider style={{ margin: "16px 0" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
          <Button
            icon={<SaveOutlined />}
            onClick={saveDraft}
            size="large"
            style={{ fontSize: "14px" }}
          >
            Save Draft
          </Button>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleSubmit}
            loading={saving}
            size="large"
            style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
          >
            Next
          </Button>
        </div>
      </Form>

      {/* Location Modal */}
      <Modal
        title="Select Location"
        open={showLocationModal}
        onCancel={() => {
          setShowLocationModal(false);
          setSearchTerm("");
        }}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
        <Input
          placeholder="Search by name, building, or room number"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, fontSize: "14px" }}
          size="large"
            allowClear
        />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateLocationModal(true)}
            size="large"
            style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
          >
            Add New
          </Button>
        </div>
        {loadingLocations ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary">Loading locations...</Text>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Text type="secondary">No locations found</Text>
          </div>
        ) : (
        <div style={{ 
          maxHeight: "400px", 
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "12px"
        }}>
          {filteredRooms.map((room) => (
            <Card
              key={room.locationId}
              hoverable
              onClick={() => selectLocation(room)}
              style={{
                cursor: "pointer",
                border: selectedLocation?.locationId === room.locationId ? "2px solid #F2721E" : "1px solid #d9d9d9"
              }}
            >
              <Text strong>{room.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                {room.building} • {room.roomNumber}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Capacity: {room.capacity ?? "N/A"}
              </Text>
            </Card>
          ))}
        </div>
        )}
      </Modal>

      {/* Create Location Modal */}
      <Modal
        title="Create New Location"
        open={showCreateLocationModal}
        onCancel={() => {
          setShowCreateLocationModal(false);
          createLocationForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createLocationForm}
          layout="vertical"
          onFinish={handleCreateLocation}
        >
          <Form.Item
            name="name"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Location Name</span>}
            rules={[{ required: true, message: "Please enter location name" }]}
          >
            <Input
              placeholder="e.g., ĐH FPT Hà Nội Beta"
              size="large"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="building"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Building</span>}
                rules={[{ required: true, message: "Please enter building name" }]}
              >
                <Input
                  placeholder="e.g., Beta"
                  size="large"
                  style={{ fontSize: "14px" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomNumber"
                label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Room Number</span>}
                rules={[{ required: true, message: "Please enter room number" }]}
              >
                <Input
                  placeholder="e.g., BE-201"
                  size="large"
                  style={{ fontSize: "14px" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="capacity"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Capacity</span>}
            rules={[
              { required: true, message: "Please enter capacity" },
              { type: "number", min: 1, message: "Capacity must be at least 1" }
            ]}
          >
            <InputNumber
              min={1}
              placeholder="e.g., 10000"
              size="large"
              style={{ width: "100%", fontSize: "14px" }}
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Image URL (Optional)</span>}
          >
            <Input
              placeholder="Image URL (optional)"
              size="large"
              style={{ fontSize: "14px" }}
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
            <Button
              onClick={() => {
                setShowCreateLocationModal(false);
                createLocationForm.resetFields();
              }}
              size="large"
              style={{ fontSize: "14px" }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creatingLocation}
              size="large"
              style={{ background: "#F2721E", borderColor: "#F2721E", fontSize: "14px" }}
            >
              Create Location
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ======================================== */}
      {/* REGION: BANNER PREVIEW MODAL */}
      {/* ======================================== */}
      <Modal
        open={bannerPreview.visible}
        title={bannerPreview.title}
        footer={null}
        onCancel={() =>
          setBannerPreview({ visible: false, image: "", title: "" })
        }
        width={800}
        centered
      >
        {bannerPreview.image && (
          <Image
            alt="Banner preview"
            style={{ width: "100%" }}
            src={bannerPreview.image}
            preview={false}
          />
        )}
      </Modal>

      {/* ======================================== */}
      {/* REGION: GOOGLE MAPS LOCATION INPUT MODAL */}
      {/* ======================================== */}
      <Modal
        open={showMapsInputModal}
        title="Enter Location Details"
        onOk={handleConfirmMapsLocation}
        onCancel={() => {
          setShowMapsInputModal(false);
          setMapsSearchQuery("");
        }}
        okText="Confirm Location"
        cancelText="Cancel"
        width={600}
        centered
      >
        <Space orientation="vertical" style={{ width: "100%" }} size={16}>
          <div>
            <Text strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
              Search Location:
            </Text>
            <Text type="secondary" style={{ fontSize: "12px", display: "block", marginBottom: "12px" }}>
              Start typing to search for a location. Select from the dropdown suggestions to automatically fill in the details.
            </Text>
          </div>
          
          <Form.Item
            label={<span style={{ fontWeight: 700, fontSize: "14px" }}>Search Location</span>}
            required
            help={!window.google?.maps?.places ? "Loading Google Maps API..." : undefined}
          >
            <Input
              ref={autocompleteInputRef}
              value={mapsSearchQuery}
              onChange={(e) => setMapsSearchQuery(e.target.value)}
              placeholder="Type to search for a location..."
              size="large"
              style={{ fontSize: "14px" }}
              prefix={<SearchOutlined style={{ color: "#F2721E" }} />}
              onPressEnter={handleConfirmMapsLocation}
              disabled={!window.google?.maps?.places}
            />
            <Text type="secondary" style={{ fontSize: "12px", marginTop: "4px", display: "block" }}>
              💡 Tip: Select a location from the dropdown to automatically fill in the details.
            </Text>
          </Form.Item>

          {mapLocation && (
            <Card size="small" style={{ background: "#f0f9ff", marginTop: "8px" }}>
              <Text strong style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>
                Current Selected Location:
              </Text>
              <Text style={{ fontSize: "12px" }}>{mapLocation.name}</Text>
              {mapLocation.address && (
                <Text type="secondary" style={{ fontSize: "11px", display: "block", marginTop: "4px" }}>
                  {mapLocation.address}
                </Text>
              )}
            </Card>
          )}
        </Space>
      </Modal>
    </div>
  );
}
