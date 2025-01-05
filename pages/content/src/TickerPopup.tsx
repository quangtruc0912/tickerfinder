import React, { useRef, useState, useEffect } from 'react';
import { Pair } from '@extension/shared';
import PairTable from '@extension/shared/lib/components/PairTable';
import '@src/TickerPopup.css';
import { useTheme } from '@mui/material/styles';

export default function TickerPopup() {
  const [ticker, setTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('null');
  const [popupText, setPopupText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement | null>(null); // Reference to the popup div
  const theme = useTheme();

  const handleMouseOver = async (e: Event) => {
    const target = e.target as HTMLElement;

    // Check if the target is an <a> element with a specific data attribute
    if (target && target.dataset.popupText) {
      setShowPopup(true); // Show the popup
      setIsLoading(true);

      setTicker(target.dataset.popupText.substring(1));

      const rect = target.getBoundingClientRect();

      // Adjust for scrolling
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      setPopupPosition({
        top: rect.top + scrollTop + rect.height, // Place the popup just below the hovered element
        left: rect.left + scrollLeft + rect.width / 2, // Center the popup relative to the hovered element
      });

      setPopupText(target.dataset.popupText); // Set the text content from the data attribute
    }
  };

  const handleMouseOut = (e: MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if the mouse left the element and is not over the popup
    if (target && target.dataset.popupText && !popupRef.current?.contains(e.relatedTarget as Node)) {
      setShowPopup(false);
    }
  };

  const handlePopupMouseOver = () => {
    setShowPopup(true); // Ensure the popup stays visible when hovering over it
  };

  const handlePopupMouseOut = () => {
    setShowPopup(false); // Hide the popup when the mouse leaves the popup
  };

  useEffect(() => {
    // Add the event listeners with the correct type (MouseEvent)
    const handleMouseOverEvent = (e: MouseEvent) => handleMouseOver(e);
    const handleMouseOutEvent = (e: MouseEvent) => handleMouseOut(e);

    document.addEventListener('mouseover', handleMouseOverEvent);
    document.addEventListener('mouseout', handleMouseOutEvent);

    // Cleanup event listeners when the component is unmounted
    return () => {
      document.removeEventListener('mouseover', handleMouseOverEvent);
      document.removeEventListener('mouseout', handleMouseOutEvent);
    };
  }, []);

  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    top: popupPosition.top,
    left: popupPosition.left,
    backgroundColor: theme.palette.background.default, // Dynamically set background
    color: theme.palette.text.primary, // Dynamically set text color
    padding: '10px',
    borderRadius: '5px',
    zIndex: 1000,
    scale: 0.9,
  };

  return (
    <div>
      {showPopup && (
        <div ref={popupRef} style={popupStyle} onMouseOver={handlePopupMouseOver} onMouseOut={handlePopupMouseOut}>
          <PairTable ticker={ticker} />
        </div>
      )}
    </div>
  );
}
