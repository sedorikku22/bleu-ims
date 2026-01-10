export function parseBackendDate(dateString) {
  if (typeof dateString === 'string' && dateString.includes(' ')) {
    return new Date(dateString.replace(' ', 'T'));
  }
  return new Date(dateString);
}

export function formatRelativeTime(dateString) {
  const date = parseBackendDate(dateString);
  const now = new Date();
  if (isNaN(date)) return "Unknown time";
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins === 1) return "1 minute ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}