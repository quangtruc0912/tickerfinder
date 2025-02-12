import React, { useEffect, useState } from 'react';

import SearchField from '@src/SearchField';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const toggleModal = () => {
      setIsOpen(prev => !prev);
    };

    document.addEventListener('keydown', event => {
      // Example shortcut: "Ctrl + Shift + K"
      if (event.ctrlKey && event.key === '/') {
        document.dispatchEvent(new CustomEvent('toggle-modal'));
      }
    });
    document.addEventListener('toggle-modal', toggleModal);
    return () => {
      document.removeEventListener('toggle-modal', toggleModal);
    };
  }, []);

  return <SearchField isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

export default App;
