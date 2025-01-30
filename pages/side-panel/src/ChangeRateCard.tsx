import React from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface ChangeRateCardProps {
  changeRate24h: string;
  changeRate5m: string;
  changeRate1h: string;
  changeRate6h: string;
}

const ChangeRateCard: React.FC<ChangeRateCardProps> = ({ changeRate24h, changeRate5m, changeRate1h, changeRate6h }) => {
  const renderChangeRate = (label: string, value: string) => {
    const isPositive = parseFloat(value) > 0;
    const color = isPositive ? '#00C853' : '#D50000';
    const Icon = isPositive ? ArrowUpwardIcon : ArrowDownwardIcon;

    return (
      <Box key={label} sx={{ flex: 1, minWidth: '20%' }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            backgroundColor: 'background.default',
            px: 2,
            py: 1.5,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {label}
          </Typography>
          <Box display="flex" alignItems="center">
            <Icon sx={{ color, fontSize: '1rem', mr: 0.5 }} />
            <Typography variant="body2" color={color}>
              {parseFloat(value).toFixed(2)}%
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Stack direction="row" justifyContent="space-between" flexWrap="wrap">
      {renderChangeRate('5m', changeRate5m)}
      {renderChangeRate('1h', changeRate1h)}
      {renderChangeRate('6h', changeRate6h)}
      {renderChangeRate('24h', changeRate24h)}
    </Stack>
  );
};

export default ChangeRateCard;
