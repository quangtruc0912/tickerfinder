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
  Collapse,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

function formatCustomPrice(price: number): string {
  if (price === undefined) {
    return '0';
  }
  const priceString = price?.toString();
  const [integerPart, decimalPart] = priceString?.split('.');

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
  return price?.toString();
}
const SidePanel = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null); // Track expanded item by its unique ID

  useEffect(() => {
    const fetchWatchlist = async () => {
      // const list = await useWatchListStorage.get();
      // setWatchlist(list);
      chrome.runtime.sendMessage({ type: 'GET_WATCHLIST' }, response => {
        if (response) {
          setWatchlist(response.watchlist);
        }
      });
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

  const toggleExpandItem = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId); // Toggle expanded state
  };

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
          {watchlist?.map(item => (
            <React.Fragment key={item.address}>
              <ListItem
                alignItems="center"
                sx={{ display: 'flex', justifyContent: 'space-between' }}
                onClick={() => toggleExpandItem(item.address)} // Expand/Collapse on click
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemAvatar>
                    <Avatar
                      src={item.isPriority ? chrome.runtime.getURL(item?.imageUrl) : item?.imageUrl}
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
                      ${formatCustomPrice(Number(item.price))} {/* Example: Replace with actual price */}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={Number(item.changeRate24h) > 0 ? 'success.main' : 'error.main'}>
                      {Number(item.changeRate24h) > 0 ? '+' : ''}
                      {Number(item.changeRate24h).toFixed(2)}%
                    </Typography>
                  </Box>

                  <IconButton edge="end" onClick={() => removeCoin(item.url, item.name, item.isPriority)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
              <Collapse in={expandedItem === item.address} timeout="auto" unmountOnExit>
                <Box sx={{ padding: 2, backgroundColor: 'background.paper', borderRadius: 1, margin: 1 }}>
                  {/* Add additional info here */}
                  <Typography variant="body2" color="text.secondary">
                    Market Cap: ${formatCustomPrice(100)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Volume (24h): ${formatCustomPrice(100)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Circulating Supply: {100} {item.symbol}
                  </Typography>
                </Box>
              </Collapse>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
