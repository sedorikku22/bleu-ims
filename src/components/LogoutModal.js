import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './LogoutModal.css';

function LogoutModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="logout-modal-overlay" onClick={handleOverlayClick}>
      <div className="logout-modal-container">
        <div className="logout-modal-header">
          <h3 className="logout-modal-title">Confirm Logout</h3>
          <button className="logout-modal-close" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className="logout-modal-content">
          <p>Are you sure you want to logout?</p>
        </div>
        
        <div className="logout-modal-actions">
          <button className="logout-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="logout-confirm-btn" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutModal;