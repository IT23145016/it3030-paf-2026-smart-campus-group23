const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function upload(path, formData) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || "Upload failed");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  getCurrentUser: () => request("/api/auth/me"),
  updateNotificationPreferences: (payload) =>
    request("/api/auth/notification-preferences", { method: "PATCH", body: JSON.stringify(payload) }),
  getResources: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    return request(`/api/resources${queryString ? `?${queryString}` : ""}`);
  },
  getResource: (resourceId) => request(`/api/resources/${resourceId}`),
  createResource: (payload) => request("/api/resources", { method: "POST", body: JSON.stringify(payload) }),
  updateResource: (resourceId, payload) => request(`/api/resources/${resourceId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteResource: (resourceId) => request(`/api/resources/${resourceId}`, { method: "DELETE" }),
  getNotifications: () => request("/api/notifications"),
  getUnreadCount: () => request("/api/notifications/unread-count"),
  markNotificationRead: (notificationId) => request(`/api/notifications/${notificationId}/read`, { method: "PATCH" }),
  deleteNotification: (notificationId) => request(`/api/notifications/${notificationId}`, { method: "DELETE" }),
  markAllNotificationsRead: () => request("/api/notifications/read-all", { method: "PATCH" }),
  getUsers: () => request("/api/admin/users"),
  createUser: (payload) => request("/api/admin/users", { method: "POST", body: JSON.stringify(payload) }),
  updateRoles: (userId, roles) => request(`/api/admin/users/${userId}/roles`, { method: "PUT", body: JSON.stringify({ roles }) }),
  updateUserStatus: (userId, active) => request(`/api/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ active }) }),
  deleteUser: (userId) => request(`/api/admin/users/${userId}`, { method: "DELETE" }),
  createBooking: (payload) => request("/api/bookings", { method: "POST", body: JSON.stringify(payload) }),
  getUserBookings: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status.toUpperCase());
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return request(`/api/bookings${params.toString() ? `?${params.toString()}` : ""}`);
  },
  getBooking: (bookingId) => request(`/api/bookings/${bookingId}`),
  cancelBooking: (bookingId) => request(`/api/bookings/${bookingId}`, { method: "DELETE" }),
  getAllBookings: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status.toUpperCase());
    if (filters.userId) params.set("userId", filters.userId);
    if (filters.resourceId) params.set("resourceId", filters.resourceId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    return request(`/api/bookings/admin${params.toString() ? `?${params.toString()}` : ""}`);
  },
  getPendingBookings: () => request("/api/bookings/admin/pending"),
  updateBookingStatus: (bookingId, payload) => request(`/api/bookings/admin/${bookingId}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.location) params.set("location", filters.location);
    return request(`/api/tickets${params.toString() ? `?${params.toString()}` : ""}`);
  },
  getTicket: (ticketId) => request(`/api/tickets/${ticketId}`),
  createTicket: (payload) => request("/api/tickets", { method: "POST", body: JSON.stringify(payload) }),
  updateTicket: (ticketId, payload) => request(`/api/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTicket: (ticketId) => request(`/api/tickets/${ticketId}`, { method: "DELETE" }),
  updateTicketStatus: (ticketId, payload) => request(`/api/tickets/${ticketId}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  assignTicket: (ticketId, technicianId) => request(`/api/tickets/${ticketId}/assign`, { method: "PATCH", body: JSON.stringify({ technicianId }) }),
  addTicketUpdate: (ticketId, message) => request(`/api/tickets/${ticketId}/updates`, { method: "POST", body: JSON.stringify({ message }) }),
  editTicketUpdate: (ticketId, updateId, message) => request(`/api/tickets/${ticketId}/updates/${updateId}`, { method: "PATCH", body: JSON.stringify({ message }) }),
  deleteTicketUpdate: (ticketId, updateId) => request(`/api/tickets/${ticketId}/updates/${updateId}`, { method: "DELETE" }),
  getTicketAttachments: (ticketId) => request(`/api/tickets/${ticketId}/attachments`),
  uploadTicketAttachment: (ticketId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return upload(`/api/tickets/${ticketId}/attachments`, formData);
  }
};
