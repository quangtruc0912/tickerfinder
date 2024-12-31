import React, { useState, useEffect } from 'react';
import '@src/TickerPopup.css';

export default function TickerPopup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popupText, setPopupText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  //   const fetchTicker = async (url : string) => {
  //     try {
  //     //   const response = await fetch(`https://api.github.com/repos/${url}`);
  //     //   const data = await response.json();
  //     //   if (response.ok) {
  //         setRepoInfo(props.name)
  //     } catch (err) {
  //       setError('Error fetching ticker data.');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  const handleMouseOver = (e: Event) => {
    const target = e.target;

    // Check if the target is an <a> element with a specific data attribute
    if (target instanceof HTMLElement && target.dataset.popupText) {
      const rect = target.getBoundingClientRect();
      setPopupPosition({
        top: rect.top,
        left: rect.left,
      });
      setPopupText(target.dataset.popupText); // Set the text content from the data attribute
      setShowPopup(true); // Show the popup
    }
  };

  const handleMouseOut = (e: Event) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.dataset.popupText) {
      setShowPopup(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // Cleanup event listeners when the component is unmounted
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  let popupStyle: React.CSSProperties = {
    position: 'absolute',
    top: `${popupPosition.top + 20}px`, // 20px offset for better positioning
    left: `${popupPosition.left + 20}px`, // 20px offset to the right of the element
    backgroundColor: '#333',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    width: '200px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  };

  return <div>{showPopup && <div style={popupStyle}>{popupText}</div>}</div>;
}
