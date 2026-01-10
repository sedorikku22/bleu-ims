import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import './sidebar.css';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faUtensils, faBox, faCarrot, faTruck, faTshirt,
  faRecycle, faFileAlt, faSignOutAlt, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import LogoutModal from './LogoutModal'; 

function SidebarComponent() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const [role, setRole] = useState("user");

  useEffect(() => {
    const targetSelectors = [
      'body',
      '.main-content', 
      '.app-container', 
      '#root', 
      '.App',
      '[class*="main"]',
      '[class*="content"]'
    ];

    targetSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.classList.remove('sidebar-collapsed');
        if (selector === 'body' || el === document.body) {
          el.style.marginLeft = '280px';
        }
      });
    });
    
    return () => {
      targetSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.classList.remove('sidebar-collapsed');
          if (selector === 'body' || el === document.body) {
            el.style.marginLeft = '';
          }
        });
      });
    };
  }, []);

  const handleLogout = useCallback(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      window.location.href = 'http://localhost:4002';
  }, []);

  // Show logout confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // update role based on token changes
  useEffect(() => {
    let intervalId = null;
    function updateRoleFromToken() {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          setRole(decodedToken.role ? decodedToken.role.toLowerCase() : "user");
        } catch (e) {
          setRole("user");
        }
      } else {
        setRole("user");
      }
    }
    updateRoleFromToken();

    // check for token changes in other tabs
    function handleStorageChange(e) {
      if (e.key === "authToken") {
        updateRoleFromToken();
      }
    }
    window.addEventListener("storage", handleStorageChange);

    // if role is still "manager" after mount, poll for changes for 2 seconds
    if (role === "user") {
      intervalId = setInterval(() => {
        updateRoleFromToken();
      }, 250);
      setTimeout(() => clearInterval(intervalId), 2000);
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, [location.pathname]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          setRole(decodedToken.role ? decodedToken.role.toLowerCase() : "user");
        } catch (e) {
          setRole("user");
        }
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Event listener for mobile sidebar toggle
  useEffect(() => {
    const handleToggleMobileSidebar = () => {
      setMobileSidebarOpen(prev => !prev);
    };
    window.addEventListener('toggleMobileSidebar', handleToggleMobileSidebar);
    return () => {
      window.removeEventListener('toggleMobileSidebar', handleToggleMobileSidebar);
    };
  }, []);

  return (
    <>
      <div className="sidebar-wrapper">
        {/* Sidebar Panel */}
        <Sidebar collapsed={false} className={`sidebar-container ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="side-container">
            <div className={`logo-wrapper`}>
              <img src={logo} alt="Logo" className="logo" />
            </div>

            <div className="section-title">GENERAL</div>
            <Menu>
              <MenuItem
                icon={<FontAwesomeIcon icon={faHome} />}
                component={<Link to="/home/dashboard" />}
                active={location.pathname === '/home/dashboard'}
              >
                Dashboard
              </MenuItem>
              <MenuItem
                icon={<FontAwesomeIcon icon={faBox} />}
                component={<Link to="/home/products" />}
                active={location.pathname === '/home/products'}
              >
                Menu Management
              </MenuItem>
              <MenuItem
                icon={<FontAwesomeIcon icon={faUtensils} />}
                component={<Link to="/home/recipeManagement" />}
                active={location.pathname === '/home/recipeManagement'}
              >
                Product Composition
              </MenuItem>

              <div className="section-title">STOCKS</div>
              <MenuItem
                icon={<FontAwesomeIcon icon={faCarrot} />}
                component={<Link to="/home/ingredients" />}
                active={location.pathname === '/home/ingredients'}
              >
                Ingredients
              </MenuItem>
              <MenuItem
                icon={<FontAwesomeIcon icon={faTruck} />}
                component={<Link to="/home/supplies" />}
                active={location.pathname === '/home/supplies'}
              >
                Supplies & Materials
              </MenuItem>
              <MenuItem
                icon={<FontAwesomeIcon icon={faTshirt} />}
                component={<Link to="/home/merchandise" />}
                active={location.pathname === '/home/merchandise'}
              >
                Merchandise
              </MenuItem>
            </Menu>

            <div className="section-title">LOGS</div>
            <Menu>
              <MenuItem
                icon={<FontAwesomeIcon icon={faFileAlt} />}
                component={<Link to="/home/restockLogs" />}
                active={location.pathname === '/home/restockLogs'}
              >
                Restock Logs
              </MenuItem>
              <MenuItem
                icon={<FontAwesomeIcon icon={faRecycle} />}
                component={<Link to="/home/waste" />}
                active={location.pathname === '/home/waste'}
              >
                Waste
              </MenuItem>
            </Menu>

            {/* Only show activity section and audit logs for admin users */}
            {role === "admin" && (
              <>
                <div className="section-title">ACTIVITY</div>
                <Menu>
                  <MenuItem
                    icon={<FontAwesomeIcon icon={faClipboardList} />}
                    component={<Link to="/home/auditLogs" />}
                    active={location.pathname === '/home/auditLogs'}
                  >
                    Audit Logs
                  </MenuItem>
                </Menu>
              </>
            )}

            {/* Logout Section at the bottom */}
            <div className="section-title">ACCOUNT</div>
            <Menu>
              <MenuItem
                icon={<FontAwesomeIcon icon={faSignOutAlt} />}
                onClick={handleLogoutClick}
                className="logout-item"
              >
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Sidebar>
      </div>

      {mobileSidebarOpen && <div className="mobile-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)}></div>}

      {/* Logout Confirmation Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}

export default SidebarComponent;