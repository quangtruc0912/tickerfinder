import React, { useEffect, useRef, useState } from 'react';
import CoinBalanceItem from './CoinBalanceItem';
import CoinSmallBalanceItem from './CoinSmallBalanceItem';
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

  const lastFetchTime = setting.lastFetchCoinBalance
    ? new Date(setting.lastFetchCoinBalance).toLocaleString()
    : 'Never';

  const sortedTokens = [...tokenBalance]
    .map(token => ({
      ...token,
      tokenCoinPrice: (Number(token.value) / 10 ** Number(token.token.decimals)) * Number(token.token.exchange_rate),
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

  const updatedTokens = useFetchTokenPrices(displayedTokens);

  const [currentSmallPage, setCurrentSmallPage] = useState(1); // Pagination for small balances

  // Calculate pagination for small balances
  const totalSmallPages = Math.ceil(smallBalances.length / ITEMS_PER_PAGE);
  const smallStartIndex = (currentSmallPage - 1) * ITEMS_PER_PAGE;
  const displayedSmallBalances = smallBalances.slice(smallStartIndex, smallStartIndex + ITEMS_PER_PAGE);

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

  return (
    <Container>
      {/* Total Portfolio Value */}
      <Box textAlign="center" my={2}>
        <Typography variant="body2" color="gray">
          Last Fetched: {lastFetchTime}
        </Typography>
      </Box>
      <Box textAlign="center" my={2}>
        <Typography variant="h6" fontWeight="bold">
          Portfolio: ${totalValue.toFixed(2)}
        </Typography>
      </Box>

      {/* Large Balances */}
      <Box>
        {updatedTokens.map(
          (token: TokenBalanceData & { tokenCoinPrice?: number }, index: React.Key | null | undefined) => (
            <CoinBalanceItem key={index} item={token} />
          ),
        )}
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
              {displayedSmallBalances.map((token, index) => (
                <CoinSmallBalanceItem key={index} item={token} />
              ))}

              {/* Pagination for Small Balances */}
              {totalSmallPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={totalSmallPages}
                    page={currentSmallPage}
                    onChange={(_, page) => setCurrentSmallPage(page)}
                    color="primary"
                    shape="rounded"
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default CoinBalanceList;

const useFetchTokenPrices = (displayedTokens: any = []) => {
  const [updatedTokens, setUpdatedTokens] = useState(displayedTokens);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchData = async () => {
      try {
        if (displayedTokens.length === 0) return;

        // Filter out Ethereum tokens before fetching
        const tokensToFetch = displayedTokens.filter(
          (token: { token: { symbol: string } }) => token.token.symbol.toLowerCase() !== 'eth',
        );

        if (tokensToFetch.length === 0) return; // No tokens to fetch

        const tokenAddresses = tokensToFetch.map((item: { token: { address: any } }) => item.token.address).join(',');

        const url = `https://api.dexscreener.com/tokens/v1/ethereum/${encodeURIComponent(tokenAddresses)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch prices');

        const newPrices = await response.json();

        const updatedList = displayedTokens.map((token: { token: { address: string; symbol: string } }) => {
          // Skip Ethereum tokens (keep them unchanged)
          if (token.token.symbol.toLowerCase() === 'eth') {
            return token;
          }

          const foundItem = newPrices.find(
            (item: { baseToken: { address: string } }) =>
              item.baseToken.address.toLowerCase() === token.token.address.toLowerCase(),
          );

          return {
            ...token,
            token_cex: {
              exchange_rate: foundItem?.priceUsd ?? '0',
              change_24h: foundItem?.priceChange?.h24 ?? null,
            },
          };
        });

        if (isMounted.current) {
          setUpdatedTokens(updatedList);
        }
      } catch (err) {
        console.error('Error fetching prices:', err);
      }
    };

    // Fetch initially and set interval
    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [displayedTokens]);

  return updatedTokens;
};
