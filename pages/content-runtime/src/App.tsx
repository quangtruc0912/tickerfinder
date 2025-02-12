import React, { useEffect, useState } from 'react';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true); // Open modal on first load

  useEffect(() => {
    const toggleModal = () => {
      setIsOpen(prev => !prev);
    };

    document.addEventListener('toggle-modal', toggleModal);
    return () => {
      document.removeEventListener('toggle-modal', toggleModal);
    };
  }, []);

  return '';
};

export default App;
