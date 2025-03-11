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
      setIsLoading(true);

      const rect = target.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const scrollLeft = window.scrollX;
      let top = rect.top + scrollTop + rect.height;
      let left = rect.left + scrollLeft - 150;
      const popupWidth = 600;
      const viewportWidth = window.innerWidth;
      const wouldOverflowRight = left + popupWidth > viewportWidth;

      if (wouldOverflowRight) {
        left = rect.left + scrollLeft - popupWidth + rect.width;
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

  const handlePopupMouseOver = () => {
    setShowPopup(true);
  };
  const handlePopupMouseOut = () => {
    setShowPopup(false);
  };

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
    padding: '10px',
    borderRadius: '5px',
    zIndex: 1000,
    scale: 0.9,
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
              minWidth: '1000px',
              maxWidth: '1300px',
              width: 'fit-content',
            }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px', // Space between input and button
              }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search Ticker or Contract address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                sx={{ flexGrow: 1 }} // Makes the input take available space
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
                  textTransform: 'none', // Keep text formatting
                  padding: '6px 10px', // Adjust padding if needed
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
