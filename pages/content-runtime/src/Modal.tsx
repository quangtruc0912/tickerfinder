import React, { useEffect, useRef, useState } from 'react';
import { Modal, Box, TextField, Button, Typography } from '@mui/material';
import PairTable from '@extension/shared/lib/components/PairTable';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ticker, setTicker] = useState('');
  const [modalWidth, setModalWidth] = useState('900px');

  // Debounce logic: Update `ticker` 1s after user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setTicker(searchTerm.trim()); // Trim whitespace
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Adjust modal width dynamically based on PairTable content
  useEffect(() => {
    if (tableRef.current && ticker) {
      const newWidth = Math.min(Math.max(tableRef.current.clientWidth + 40, 400), 1200);
      setModalWidth(`${newWidth}px`);
    }
  }, [ticker]); // Recalculate width when `ticker` changes

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="search-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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
        />

        {/* ✅ Always re-render PairTable when ticker changes */}
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

export default SearchModal;
