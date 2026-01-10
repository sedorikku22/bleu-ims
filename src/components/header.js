import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { FaBell, FaBars } from "react-icons/fa";
import { jwtDecode } from 'jwt-decode';
import NotificationModal from './home/notification/notification';
import { fetchNotificationCount } from '../utils/notifs';
import "./header.css";

const Header = ({ pageTitle }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userName, setUserName] = useState("Admin User");
  const [userRole, setUserRole] = useState("Admin");
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const closeNotification = () => {
    setIsNotificationOpen(false);
  };

  const handleLogout = useCallback(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      window.location.href = 'https://bleu-ums-zeta.vercel.app';
  }, []);

  // Dispatch custom event to toggle mobile sidebar
  const toggleMobileSidebar = () => {
    const event = new Event('toggleMobileSidebar');
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const usernameFromUrl = params.get('username');
    const tokenFromUrl = params.get('authorization');

    if (usernameFromUrl && tokenFromUrl) {
      localStorage.setItem('username', usernameFromUrl);
      localStorage.setItem('authToken', tokenFromUrl);

      if (window.history.replaceState) {
        const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      }
    }

    const storedUsername = localStorage.getItem('username');
    const storedToken = localStorage.getItem('authToken');

    if (storedUsername && storedToken) {
      setUserName(storedUsername);
      try {
        const decodedToken = jwtDecode(storedToken);
        setUserRole(decodedToken.role || "Admin");
      } catch (error) {
        console.error("Error decoding token:", error);
        handleLogout();
      }
    } else {
      console.log("No session found. Redirecting to login.");
      navigate('/');
    }
  }, [navigate, handleLogout]);

  useEffect(() => {
    const timerId = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // fetch notification count for badge
  useEffect(() => {
    fetchNotificationCount()
      .then(data => setNotificationCount(data.count || 0))
      .catch(() => setNotificationCount(0));
  }, [isNotificationOpen]);

  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-sidebar-toggle" onClick={toggleMobileSidebar} aria-label="Toggle sidebar">
          <FaBars />
        </button>
        <h2 className="page-title">{pageTitle}</h2>
      </div>

      <div className="header-right">
        <div className="header-date">
          {currentDate.toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          })}
        </div>
        <div className="header-profile">
          <div className="profile-info">
            <div className="profile-role">Hi! I'm {userRole}</div>
            <div className="profile-name">{userName}</div>
          </div>
          <div className="bell-icon" onClick={toggleNotification} style={{ cursor: 'pointer', position: 'relative' }}>
            <FaBell className="bell-outline" />
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </div>
        </div>
      </div>

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={closeNotification}
      />
    </header>
  );
};

export default Header;
