import { Avatar, Box, Typography } from '@mui/material';
import React from 'react';
import { TokenBalanceData } from '@extension/storage';

interface CoinItemProps {
  item: TokenBalanceData;
}
function formatCustomPrice(price: number): string {
  if (price === undefined || price === 0) {
    return '0';
  }

  // Convert number to string with high precision
  const priceString = price.toFixed(20);
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) {
    return integerPart;
  }

  const zerosCount = decimalPart.match(/^0+/)?.[0]?.length || 0;

  // If there are more than 4 leading zeros in decimal and integer part is 0
  if (zerosCount > 4 && integerPart === '0') {
    const significantDigits = decimalPart.slice(zerosCount).replace(/0+$/, ''); // Remove trailing zeros
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Convert price to number to ensure correct type usage
  const priceNumber = Number(price);

  // For numbers >= 10, keep one decimal place
  if (priceNumber >= 10) {
    return priceNumber.toFixed(1);
  }

  // For numbers between 1 and 10, keep one decimal place
  if (priceNumber >= 1) {
    return priceNumber.toFixed(1).replace(/\.0$/, ''); // Remove trailing .0
  }

  // For numbers < 1, keep up to 3 decimal places
  return priceNumber.toFixed(3).replace(/\.?0+$/, ''); // Remove trailing zeros
}

function formatTokenValue(value: number): string {
  if (value >= 10) {
    return Math.floor(value).toString(); // Remove decimals for values >= 10
  } else if (value >= 1) {
    return value.toFixed(1); // One decimal place for values >= 1
  } else {
    return value.toFixed(3); // Three decimal places for values < 1
  }
}

const CoinBalanceItem: React.FC<CoinItemProps> = props => {
  const normalizedBalance = Number(props.item.value) / 10 ** Number(props.item.token.decimals);
  const tokenCoinPrice = normalizedBalance * Number(props.item.token_cex.exchange_rate);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '72px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 32, height: 32 }} src={props.item.token.icon_url} alt={props.item.token.symbol} />
        <Box sx={{ marginLeft: 1 }}>
          <Typography variant="body1" fontWeight="500">
            {props.item.token.name.length > 10 ? `${props.item.token.name.slice(0, 10)}...` : props.item.token.name}
          </Typography>
          <Typography variant="body2" color="gray">
            {formatTokenValue(normalizedBalance)} {props.item.token.symbol}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5, // Space between elements
        }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="500">
            ${formatCustomPrice(Number(tokenCoinPrice))}
          </Typography>
          <Typography
            variant="caption"
            color={Number(props.item.token_cex.change_24h) > 0 ? 'success.main' : 'error.main'}>
            {Number(props.item.token_cex.change_24h) > 0 ? '+' : ''}
            {Number(props.item.token_cex.change_24h).toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CoinBalanceItem;
