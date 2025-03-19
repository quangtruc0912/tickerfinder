import React, { useRef, useState, useEffect } from 'react';
import { Pair } from '@extension/shared';
import PairTable from '@extension/shared/lib/components/PairTable';
import '@src/TickerPopup.css';
import { useTheme } from '@mui/material/styles';
import { TextField, CircularProgress, InputAdornment, Box, Button, Typography } from '@mui/material';

export default function TickerPopup() {
  const [ticker, setTicker] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();

  const handleMouseOver = async (e: Event) => {
    const target = e.target as HTMLElement;
    const popUpText = target.dataset.popupText || target.parentElement?.dataset.popupText;

    if (target && popUpText) {
      setShowPopup(true);

      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;
      const popupWidth = 600; // Adjust based on content
      const popupHeight = 400; // Adjust based on content
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Determine the $ tag's position
      const isRightHalf = rect.left + rect.width / 2 > viewportWidth / 2;
      const isTopThird = rect.top < viewportHeight / 3;
      const isBottomThird = rect.top > (viewportHeight * 2) / 3;

      let top = 0;
      let left = 0;

      if (isRightHalf) {
        if (isTopThird) {
          // Top-right: Display below the tag
          top = rect.bottom + scrollTop; // No gap below
          left = rect.left + scrollLeft - popupWidth; // Flush to the left
        } else if (isBottomThird) {
          // Bottom-right: Display above the tag
          top = rect.top + scrollTop - popupHeight; // Flush above
          left = rect.left + scrollLeft; // Align with the tag’s left edge
        } else {
          // Middle-right: Display to the left of the tag
          top = rect.top + scrollTop - popupHeight / 2 + rect.height / 2; // Vertically centered
          left = rect.left + scrollLeft - popupWidth; // Flush to the left
        }
      } else {
        // Default (left or center): Display below the tag
        top = rect.top + scrollTop + rect.height; // Flush below
        left = rect.left + scrollLeft; // Align with the tag’s left edge
      }

      // Adjust for viewport boundaries
      if (left + popupWidth > viewportWidth) {
        left = viewportWidth - popupWidth; // Flush to right edge if needed
      }
      if (left < 0) {
        left = 0; // Flush to left edge
      }
      if (top + popupHeight > viewportHeight + scrollTop) {
        top = viewportHeight + scrollTop - popupHeight; // Flush to bottom edge
      }
      if (top < scrollTop) {
        top = scrollTop; // Flush to top edge
      }

      setPopupPosition({ top, left });
      setSearchTerm(popUpText.substring(1));
      setTicker(popUpText.substring(1));
    }
  };

  const handleMouseOut = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.dataset.popupText && !popupRef.current?.contains(e.relatedTarget as Node)) {
      setShowPopup(false);
    }
  };

  const handlePopupMouseOver = () => setShowPopup(true);
  const handlePopupMouseOut = () => setShowPopup(false);

  useEffect(() => {
    const handleMouseOverEvent = (e: MouseEvent) => handleMouseOver(e);
    const handleMouseOutEvent = (e: MouseEvent) => handleMouseOut(e);

    document.addEventListener('mouseover', handleMouseOverEvent);
    document.addEventListener('mouseout', handleMouseOutEvent);

    return () => {
      document.removeEventListener('mouseover', handleMouseOverEvent);
      document.removeEventListener('mouseout', handleMouseOutEvent);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setTicker('');
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(() => {
      setTicker(searchTerm.trim());
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const openSidePanel = () => {
    chrome.runtime.sendMessage({ type: 'btn_side_panel' });
  };

  const popupStyle: React.CSSProperties = {
    position: 'absolute',
    top: popupPosition.top,
    left: popupPosition.left,
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    padding: '5px', // Reduced padding to minimize internal gap
    borderRadius: '5px',
    zIndex: 1000,
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  };

  return (
    <div>
      {showPopup && (
        <div ref={popupRef} style={popupStyle} onMouseOver={handlePopupMouseOver} onMouseOut={handlePopupMouseOut}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              minwidth: '1000px',
              maxWidth: '100%',
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '5px', // Reduced to minimize vertical gap
              }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search Ticker or Contract address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                sx={{ flexGrow: 1 }}
                slotProps={{
                  input: {
                    endAdornment: isLoading ? (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={openSidePanel}
                sx={{
                  minWidth: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textTransform: 'none',
                  padding: '6px 10px',
                }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  Watch List
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  Ctrl + B
                </Typography>
              </Button>
            </Box>

            {ticker && <PairTable key={ticker} ticker={ticker} />}
          </Box>
        </div>
      )}
    </div>
  );
}
