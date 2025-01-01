import React, { useState, useEffect } from 'react';
import { Pair } from '@extension/shared';
import '@src/TickerPopup.css';

export default function TickerPopup() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('null');
  const [popupText, setPopupText] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const fetchTicker = async (ticker: string) => {
    try {
      // Make the API call
      const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`, {
        method: 'GET',
        headers: {},
      });

      if (!response.ok) {
        throw new Error(`Error fetching ticker data. Status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        console.log(data.pairs);
        setPairs(data.pairs as Pair[]);
      } else {
        throw new Error('Invalid data received');
      }
    } catch (err: any) {
      setError(`Error fetching ticker data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseOver = async (e: Event) => {
    const target = e.target;

    // Check if the target is an <a> element with a specific data attribute
    if (target instanceof HTMLElement && target.dataset.popupText) {
      setShowPopup(true); // Show the popup
      setIsLoading(true);
      await fetchTicker(target.dataset.popupText);

      const rect = target.getBoundingClientRect();

      // Adjust for scrolling
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;

      setPopupPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
      });

      setPopupText(target.dataset.popupText); // Set the text content from the data attribute
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

  return (
    <div>
      {showPopup && (
        <div style={popupStyle}>
          {!isLoading ? (
            <ul>
              {pairs.map(pair => (
                <li key={pair.baseToken.address}>
                  {pair.baseToken.name} - ${pair.baseToken.symbol}
                </li>
              ))}
            </ul>
          ) : (
            <div>Loading....</div>
          )}
        </div>
      )}
    </div>
  );
}
