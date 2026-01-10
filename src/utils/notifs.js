const API_BASE_URL = "https://bleu-stockservices.onrender.com";
const getAuthToken = () => localStorage.getItem("authToken");

export async function fetchNotifications(unreadOnly = false) {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");
  const url = `${API_BASE_URL}/notifications${unreadOnly ? '?unread_only=true' : ''}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
}

export async function fetchNotificationCount() {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");
  const response = await fetch(`${API_BASE_URL}/notifications/count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch notification count");
  return response.json();
}

export async function markAllNotificationsAsRead() {
  const token = getAuthToken();
  if (!token) throw new Error("No auth token found");
  const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to mark notifications as read");
  return response.json();
}