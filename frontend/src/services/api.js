const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
    throw new Error(errorBody.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getCurrentUser: () => request("/api/auth/me"),
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
  createResource: (payload) =>
    request("/api/resources", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateResource: (resourceId, payload) =>
    request(`/api/resources/${resourceId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  deleteResource: (resourceId) =>
    request(`/api/resources/${resourceId}`, {
      method: "DELETE"
    }),
  getNotifications: () => request("/api/notifications"),
  getUnreadCount: () => request("/api/notifications/unread-count"),
  markNotificationRead: (notificationId) =>
    request(`/api/notifications/${notificationId}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request("/api/notifications/read-all", { method: "PATCH" }),
  getUsers: () => request("/api/admin/users"),
  updateRoles: (userId, roles) =>
    request(`/api/admin/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles })
    })
};
