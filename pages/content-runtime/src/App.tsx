import React, { useState, useEffect } from 'react';
import Modal from '@src/Modal';

const App: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setModalOpen(prev => !prev);
    document.addEventListener('toggle-modal', handleToggle);

    return () => document.removeEventListener('toggle-modal', handleToggle);
  }, []);

  return (
    <div>
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default App;
