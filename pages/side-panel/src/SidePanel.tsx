import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Threshold, useWatchListStorage, WatchlistItem, useThresholdStorage } from '@extension/storage';
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
  Button,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';

function formatCustomPrice(price: number): string {
  if (price === undefined || price === 0) {
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

  const toggleNotification = (guidID: string) => {
    setThreshold(prevThreshold => {
      const updatedThreshold = {
        ...prevThreshold,
        active: !prevThreshold.active, // Toggle the active status
      };

      // Call updateThreshold with the updated state
      useThresholdStorage.updateThreshold(updatedThreshold);

      return updatedThreshold; // Return the updated state
    });
  };

  const updateUpperThreshold = (price: number) => {
    setThreshold(prev => ({
      ...prev, // Keep the existing properties
      upper: price, // Update the 'lower' property
    }));
  };

  const updateLowerThreshold = (price: number) => {
    setThreshold(prev => ({
      ...prev, // Keep the existing properties
      lower: price, // Update the 'lower' property
    }));
  };

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
                    Notification Threshold for {item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}
                  </Typography>

                  {/* First Row: Limits and Price */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
                    {/* Lower Limit Input */}
                    <TextField
                      label="Lower Limit"
                      type="text"
                      value={formatCustomPrice(Number(threshold?.lower))}
                      fullWidth
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-input': {
                          textAlign: 'right', // Right-align the text in the input field
                        },
                        '& .MuiInputLabel-root': {
                          color: '#007BFF', // Default label color
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#007BFF', // Default border color
                          },
                        },
                      }}
                    />

                    {/* Price in the Middle */}
                    <Typography
                      variant="body2"
                      sx={{
                        textAlign: 'center',
                        minWidth: 80, // Adjust width as needed
                        padding: 1,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                        fontWeight: 'bold',
                      }}>
                      ${formatCustomPrice(Number(item.price))}
                    </Typography>

                    {/* Upper Limit Input */}
                    <TextField
                      label="Upper Limit"
                      type="text"
                      value={formatCustomPrice(Number(threshold?.upper))}
                      fullWidth
                      size="small"
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-input': {
                          textAlign: 'right', // Right-align the text in the input field
                        },
                        '& .MuiInputLabel-root': {
                          color: '#007BFF', // Default label color
                        },
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#007BFF', // Default border color
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Second Row: Percentage Buttons */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {/* Lower Limit Buttons */}
                    <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[10, 20, 50].map(percent => (
                        <Button
                          key={percent}
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const adjustedPrice = Number(item.price) * (1 - percent / 100);
                            updateLowerThreshold(adjustedPrice);
                          }}>
                          -{percent}%
                        </Button>
                      ))}
                    </Box>

                    {/* Spacer */}
                    <Box sx={{ minWidth: 80 }}>
                      <Button
                        variant="contained"
                        color={threshold?.active ? 'success' : 'error'}
                        startIcon={threshold?.active ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                        onClick={() => toggleNotification(item.guidID)} // Function to toggle active state
                        sx={{
                          '& .MuiButton-startIcon': { marginRight: '0px', marginLeft: '0px' },
                          textTransform: 'none', // Keep the text case as is
                          padding: '8px 16px',
                        }}></Button>
                    </Box>

                    {/* Upper Limit Buttons */}
                    <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {[10, 20, 50].map(percent => (
                        <Button
                          key={percent}
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const adjustedPrice = Number(item.price) * (1 + percent / 100);
                            updateUpperThreshold(adjustedPrice);
                          }}>
                          +{percent}%
                        </Button>
                      ))}
                    </Box>
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
