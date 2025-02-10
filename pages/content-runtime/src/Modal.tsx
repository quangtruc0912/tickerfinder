import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    modal: {
      backgroundColor: '#222',
      color: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      width: '400px', // Ensure modal width
      maxWidth: '90%',
      textAlign: 'center' as 'center',
      boxSizing: 'border-box' as 'border-box', // Prevent layout shifts
    },
    input: {
      width: '100%', // Ensures full width inside modal
      padding: '10px',
      marginTop: '10px',
      borderRadius: '4px',
      border: '1px solid #444',
      outline: 'none',
      fontSize: '16px',
      backgroundColor: '#333',
      color: '#fff',
      boxSizing: 'border-box' as 'border-box', // Ensures padding doesn't shrink input width
    },
    button: {
      marginTop: '15px',
      padding: '10px',
      width: '100%',
      border: 'none',
      borderRadius: '4px',
      background: '#007BFF',
      color: '#fff',
      cursor: 'pointer',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>Search</h2>
        <input ref={inputRef} type="text" placeholder="Search..." style={styles.input} />
        <button onClick={onClose} style={styles.button}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
