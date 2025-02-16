import React, { useEffect, useRef, useState } from 'react';
import { Modal, Box, TextField, Button, Typography, CircularProgress, InputAdornment } from '@mui/material';
import PairTable from '@extension/shared/lib/components/PairTable';

interface SearchFieldProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticker, setTicker] = useState('');
  const [modalWidth, setModalWidth] = useState('900px');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setTicker('');
      return;
    }

    setIsLoading(true); // Start loading
    const handler = setTimeout(() => {
      setTicker(searchTerm.trim());
      setIsLoading(false); // Stop loading
    }, 1000);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 🔹 Adjust modal width dynamically based on PairTable content
  useEffect(() => {
    if (tableRef.current && ticker) {
      const newWidth = Math.min(Math.max(tableRef.current.clientWidth + 40, 400), 1300);
      setModalWidth(`${newWidth + 150}px`); // Expand width by 150px
    }
  }, [ticker]);

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="search-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(calc(-50% - 75px), -50%)', // Shift left by 75px
          width: modalWidth,
          maxWidth: '90%',
          bgcolor: 'background.default',
          color: 'text.primary',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}>
        <Typography id="search-modal-title" variant="h6" gutterBottom>
          Search
        </Typography>

        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          autoFocus
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

        {/*Only render PairTable if `ticker` exists */}
        {ticker && (
          <div ref={tableRef}>
            <PairTable key={ticker} ticker={ticker} />
          </div>
        )}

        <Button onClick={onClose} fullWidth variant="contained" sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default SearchField;
