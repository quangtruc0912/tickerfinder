import { Avatar, Box, Typography } from '@mui/material';
import React from 'react';
import { TokenBalanceData } from '@extension/storage';

interface CoinItemProps {
  item: TokenBalanceData & { tokenCoinPrice?: number };
}

const formatCustomPrice = (price: number): string => {
  if (!price || price === 0) return '0';

  const priceString = price.toFixed(20);
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) return integerPart;

  const leadingZeros = decimalPart.match(/^0+/)?.[0]?.length || 0;

  if (leadingZeros > 4 && integerPart === '0') {
    const significantDigits = decimalPart.slice(leadingZeros).replace(/0+$/, '');
    return `0.0{${leadingZeros}}${significantDigits}`;
  }

  return price >= 10
    ? price.toFixed(1)
    : price >= 1
      ? price.toFixed(1).replace(/\.0$/, '')
      : price.toFixed(3).replace(/\.?0+$/, '');
};

const formatTokenValue = (value: number): string =>
  value >= 10 ? Math.floor(value).toString() : value >= 1 ? value.toFixed(1) : value.toFixed(3);

const CoinBalanceItem: React.FC<CoinItemProps> = ({ item }) => {
  const normalizedBalance = Number(item.value) / 10 ** Number(item.token.decimals);
  const tokenCoinPrice = item.tokenCoinPrice ?? normalizedBalance * Number(item.token_cex?.exchange_rate ?? 0);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', height: '72px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 32, height: 32 }} src={item.token.icon_url} alt={item.token.symbol} />
        <Box sx={{ marginLeft: 1 }}>
          <Typography variant="body1" fontWeight="500">
            {item.token.name.length > 10 ? `${item.token.name.slice(0, 10)}...` : item.token.name}
          </Typography>
          <Typography variant="body2" color="gray">
            {formatTokenValue(normalizedBalance)} {item.token.symbol}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" fontWeight="500">
            ${formatCustomPrice(tokenCoinPrice)}
          </Typography>
          <Typography variant="caption" color={Number(item.token_cex?.change_24h) > 0 ? 'success.main' : 'error.main'}>
            {Number(item.token_cex?.change_24h) > 0 ? '+' : ''}
            {Number(item.token_cex?.change_24h ?? 0).toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CoinBalanceItem;
