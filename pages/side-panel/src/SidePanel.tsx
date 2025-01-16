import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useWatchListStorage, WatchlistItem } from '@extension/storage';
import React, { useState, useEffect } from 'react';
import {} from '@extension/shared';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Divider,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useCoinData } from './LoadSidePanelData'; // Import your custom hook

function formatCustomPrice(price: number): string {
  const priceString = price.toString();
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) {
    // If no decimal part, return as is
    return priceString;
  }

  const zerosCount = decimalPart.match(/^0+/)?.[0]?.length || 0;

  // Apply formatting only if there are more than 4 leading zeros
  if (zerosCount > 4) {
    const significantDigits = decimalPart.slice(zerosCount);
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Otherwise, return the price as a normal decimal
  return price.toString();
}
const SidePanel = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  useEffect(() => {
    const fetchWatchlist = async () => {
      const list = await useWatchListStorage.get();
      setWatchlist(list);
    };

    fetchWatchlist();

    const unsubscribe = useWatchListStorage.subscribe(() => {
      setWatchlist(useWatchListStorage.getSnapshot() || []);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  const removeCoin = async (url: string, name: string, isPriority: boolean) => {
    if (!isPriority) {
      await useWatchListStorage.removeFromWatchlist(url);
    } else {
      await useWatchListStorage.removePriorityFromWatchlist(name);
    }
  };

  const coinData = useCoinData(watchlist);

  return (
    <Drawer
      anchor="left"
      open={true}
      variant="persistent"
      sx={{
        width: 360,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: '360px', // Fixed width for Uniswap-like design
          maxWidth: '100vw',
          height: '100vh', // Full height
          boxSizing: 'border-box',
          backgroundColor: 'background.default',
          color: 'text.primary',
        },
      }}>
      <Box p={2} display="flex" flexDirection="column" height="100%">
        <Typography variant="h6" gutterBottom>
          Crypto Watchlist
        </Typography>
        <Divider />
        <List>
          {coinData.map(item => (
            <React.Fragment key={item.address}>
              <ListItem alignItems="center" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemAvatar>
                    <Avatar
                      src={item.isPriority ? chrome.runtime.getURL(item.imageUrl) : item.imageUrl}
                      alt={item.symbol}
                    />
                  </ListItemAvatar>
                  <Box sx={{ marginLeft: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="500">
                          {item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="gray">
                          {item.symbol}
                        </Typography>
                      }
                    />
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
                      ${formatCustomPrice(item.price)} {/* Example: Replace with actual price */}
                    </Typography>
                    <Typography variant="caption" color={item.changeRate24h > 0 ? 'success.main' : 'error.main'}>
                      {item.changeRate24h > 0 ? '+' : ''}
                      {Number(item.changeRate24h).toFixed(2)}%
                    </Typography>
                  </Box>

                  <IconButton edge="end" onClick={() => removeCoin(item.url, item.name, item.isPriority)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
