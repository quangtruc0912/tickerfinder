import React, { useState } from 'react';
import CoinBalanceItem from './CoinBalanceItem';
import { TokenBalanceData } from '@extension/storage';
import { Pagination, Container, Box, TextField, Typography, Button } from '@mui/material';
import { useStorage } from '@extension/shared';
import { settingStorage } from '@extension/storage';

interface CoinBalanceListProps {
  tokenBalance: TokenBalanceData[];
}

const ITEMS_PER_PAGE = 10; // Number of items per page

const CoinBalanceList: React.FC<CoinBalanceListProps> = ({ tokenBalance }) => {
  const setting = useStorage(settingStorage);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSmallBalances, setShowSmallBalances] = useState(false); // Toggle for small balances

  // Return early if there are no token balances
  if (!tokenBalance || tokenBalance.length === 0 || !setting.address) {
    return (
      <Container>
        <Box textAlign="center" my={4}>
          <Typography variant="h6" fontWeight="bold">
            Wallet address not found. Please configure your wallet settings.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => chrome.runtime.openOptionsPage()} sx={{ mt: 2 }}>
            Open Settings
          </Button>
        </Box>
      </Container>
    );
  }

  const sortedTokens = [...tokenBalance]
    .map(token => ({
      ...token,
      tokenCoinPrice:
        (Number(token.value) / 10 ** Number(token.token.decimals)) * Number(token.token_cex.exchange_rate),
    }))
    .sort((a, b) => b.tokenCoinPrice - a.tokenCoinPrice);

  // Separate tokens based on the threshold
  const largeBalances = sortedTokens.filter(token => token.tokenCoinPrice >= setting.coinBalanceLowerThreshold);
  const smallBalances = sortedTokens.filter(token => token.tokenCoinPrice < setting.coinBalanceLowerThreshold);

  // Calculate total value
  const totalValue = sortedTokens.reduce((sum, token) => sum + token.tokenCoinPrice, 0);

  // Pagination logic for large balances
  const totalPages = Math.ceil(largeBalances.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedTokens = largeBalances.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Container>
      {/* Total Portfolio Value */}
      <Box textAlign="center" my={2}>
        <Typography variant="h6" fontWeight="bold">
          Portfolio: ${totalValue.toFixed(2)}
        </Typography>
      </Box>

      {/* Large Balances */}
      <Box>
        {displayedTokens.map((token, index) => (
          <CoinBalanceItem key={index} item={token} />
        ))}
      </Box>

      {/* Pagination for Large Balances */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}

      {/* Hide Small Balances Input */}
      <Box display="flex" justifyContent="center" alignItems="center" my={2}>
        <TextField
          label="Hide Balances Below"
          type="number"
          value={setting.coinBalanceLowerThreshold}
          onChange={e => settingStorage.setLowerThreshold(Number(e.target.value))}
          variant="outlined"
          size="small"
          sx={{ mr: 2 }}
        />
      </Box>

      {/* Small Balances Section */}
      {smallBalances.length > 0 && (
        <Box mt={4}>
          <Button variant="outlined" onClick={() => setShowSmallBalances(!showSmallBalances)} fullWidth>
            {showSmallBalances ? 'Hide Small Balances' : 'Show Small Balances'}
          </Button>

          {showSmallBalances && (
            <Box mt={2}>
              {smallBalances.map((token, index) => (
                <CoinBalanceItem key={index} item={token} />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default CoinBalanceList;
