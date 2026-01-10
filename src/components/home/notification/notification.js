import React, { useState, useEffect } from 'react';
import './notification.css';
import { fetchNotifications, markAllNotificationsAsRead } from '../../../utils/notifs';
import { formatRelativeTime, parseBackendDate } from '../../../utils/time';
import loadingAnimation from "../../../assets/animation/loading.webm";

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [allRead, setAllRead] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch notifications
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchNotifications()
        .then(data => {
          const filtered = data.filter(n =>
            n.message &&
            n.message.toLowerCase().includes('low on stock')
          );
          setNotifications(filtered);
          setAllRead(filtered.every(n => n.is_read));
          setLoading(false);
        })
        .catch(() => {
          setNotifications([]);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(n => n.map(ntf => ({ ...ntf, is_read: true })));
    setAllRead(true);
  };

  const toggleExpanded = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <h3>Notifications</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="notification-content">
          {loading ? (
            <div className="loading-container">
              <video
                src={loadingAnimation}
                autoPlay
                loop
                muted
                className="loading-animation"
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">
              <p>No notifications available.</p>
            </div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => {
                const isExpanded = expandedNotification === notification.notification_id;
                return (
                  <div
                    key={notification.notification_id}
                    className={`notification-item ${allRead || notification.is_read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-details">
                      <div className="notification-header-row">
                        <h4>{notification.name}</h4>
                        <span
                          className="notification-status"
                          style={{ backgroundColor: '#ffa726' }}
                        >
                          Low Stock
                        </span>
                      </div>
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-type">{notification.type}</span>
                        <span className="notification-timestamp">
                          {formatRelativeTime(notification.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={() => toggleExpanded(notification.notification_id)}
                        className="more-info-btn"
                      >
                        {isExpanded ? 'Less Info' : 'More Info'}
                      </button>

                      {isExpanded && (
                        <div className="expanded-details">
                          <div className="detail-row">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">
                              {parseBackendDate(notification.created_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                            </span>
                          </div>
                          {notification.remaining && (
                            <div className="detail-row">
                              <span className="detail-label">Remaining:</span>
                              <span className="detail-value">{notification.remaining}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="notification-footer">
          <button
            className={`mark-all-read${allRead ? ' disabled' : ''}`}
            onClick={handleMarkAllAsRead}
            disabled={allRead}
            style={allRead ? { cursor: "not-allowed", backgroundColor: "#ccc", color: "#666" } : {}}
          >
            {allRead ? 'All notifications are read' : 'Mark All as Read'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;