import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Threshold, useWatchListStorage, WatchlistItem } from '@extension/storage';
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
  TextField,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

function formatCustomPrice(price: number): string {
  if (price === undefined) {
    return '0';
  }

  // Ensure the price is represented as a fixed-point number string
  const priceString = price.toFixed(20); // Use a sufficiently large precision
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) {
    // If no decimal part, return as is
    return priceString;
  }

  const zerosCount = decimalPart.match(/^0+/)?.[0]?.length || 0;

  // Apply formatting only if there are more than 4 leading zeros
  if (zerosCount > 4) {
    const significantDigits = decimalPart.slice(zerosCount).replace(/0+$/, ''); // Remove trailing zeros
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Otherwise, return the price as a normal decimal without trailing zeros
  return parseFloat(priceString).toString(); // Remove trailing zeros from normal decimals
}
const SidePanel = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [threshold, setThreshold] = useState<Threshold>({ active: false, id: '', lower: 0, upper: 0 });
  const [expandedItem, setExpandedItem] = useState<string | null>(null); // Track expanded item by its unique ID

  useEffect(() => {
    const fetchWatchlist = async () => {
      let list = await useWatchListStorage.getWatchlist();
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

  const toggleExpandItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id); // Toggle expanded state
    chrome.runtime.sendMessage({ type: 'GET_THRESHOLD', id }, response => {
      if (response) {
        setThreshold(response);
      }
    });
  };

  // const toggleActiveThreshold = (url: string, name: string, isPriority: boolean) => {
  //   setWatchlist(prev =>
  //     prev.map(item =>
  //       (item.url === url && !isPriority) || (item.name === name && isPriority)
  //         ? { ...item, threshold: { ...item.thresholds, active: !item.thresholds.active } }
  //         : item,
  //     ),
  //   );
  // };

  // const updateThreshold = (url: string, name: string, isPriority: boolean, key: string, value: string) => {
  //   setWatchlist(prev =>
  //     prev.map(item =>
  //       (item.url === url && !isPriority) || (item.name === name && isPriority)
  //         ? { ...item, thresholds: { ...item.thresholds, [key]: value } } // Store as string in state
  //         : item,
  //     ),
  //   );
  // };

  // const sanitizeInput = (url: string, name: string, isPriority: boolean, key: string, value: string) => {
  //   const sanitizedValue = isNaN(Number(value)) ? '' : Number(value); // Convert to number or clear invalid input
  //   setWatchlist(prev =>
  //     prev.map(item =>
  //       (item.url === url && !isPriority) || (item.name === name && isPriority)
  //         ? { ...item, thresholds: { ...item.thresholds, [key]: sanitizedValue } }
  //         : item,
  //     ),
  //   );
  // };

  return (
    <Drawer
      anchor="left"
      open={true}
      variant="persistent"
      sx={{
        width: 400,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: '400px', // Fixed width for Uniswap-like design
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
            <React.Fragment key={item.guidID}>
              <ListItem
                alignItems="center"
                sx={{ display: 'flex', justifyContent: 'space-between' }}
                onClick={() => toggleExpandItem(item.guidID)} // Expand/Collapse on click
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
                      ${formatCustomPrice(Number(item.price))}
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
              <Collapse in={expandedItem === item.guidID} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    padding: 2,
                    borderRadius: 1,
                    margin: 1,
                  }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Configure Threshold for {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Active:</Typography>
                      <IconButton
                        // onClick={() => toggleActiveThreshold(item.url, item.name, item.isPriority)} // Function to toggle active state
                        color={threshold?.active ? 'primary' : 'default'}>
                        {threshold?.active ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                      </IconButton>
                    </Box>

                    <TextField
                      label="Upper Limit"
                      type="text" // Use text to allow partial input
                      value={threshold?.upper} // Ensure the value is a string for input
                      // onChange={e => updateThreshold(item.url, item.name, item.isPriority, 'upper', e.target.value)} // Update function
                      // onBlur={e => sanitizeInput(item.url, item.name, item.isPriority, 'upper', e.target.value)}
                      fullWidth
                      size="small"
                    />

                    <TextField
                      label="Lower Limit"
                      type="text" // Use text to allow partial input
                      value={threshold?.lower} // Ensure the value is a string for input
                      // onChange={e => updateThreshold(item.url, item.name, item.isPriority, 'lower', e.target.value)} // Update function
                      // onBlur={e => sanitizeInput(item.url, item.name, item.isPriority, 'upper', e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Box>
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
