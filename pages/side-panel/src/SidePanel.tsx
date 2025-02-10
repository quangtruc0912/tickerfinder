import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense, useStorage } from '@extension/shared';
import { Threshold, useWatchListStorage, WatchlistItem, useThresholdStorage, settingStorage } from '@extension/storage';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ChangeRateCard from './ChangeRateCard';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReactDOM from 'react-dom';

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
  if (zerosCount > 4 && integerPart == '0') {
    const significantDigits = decimalPart.slice(zerosCount).replace(/0+$/, ''); // Remove trailing zeros
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Otherwise, return the price as a normal decimal without trailing zeros
  return parseFloat(priceString).toString(); // Remove trailing zeros from normal decimals
}
const SidePanel = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [thresholdList, setThresholdList] = useState<Threshold[]>([]);
  let [threshold, setThreshold] = useState<Threshold>({ active: false, id: '', lower: 0, upper: 0 });
  const [expandedItem, setExpandedItem] = useState<string | null>(null); // Track expanded item by its unique ID
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // To display alerts
  const [isModalOpen, setIsModalOpen] = useState(false);

  const setting = useStorage(settingStorage);

  useEffect(() => {
    const fetchWatchlist = async () => {
      let list = await useWatchListStorage.getWatchlist();
      setWatchlist(list);
    };

    const unsubscribeWatchList = useWatchListStorage.subscribe(() => {
      setWatchlist(useWatchListStorage.getSnapshot() || []);
    });

    const fetchThreshold = async () => {
      let list = await useThresholdStorage.getThreshold();
      setThresholdList(list);
    };
    fetchWatchlist();
    fetchThreshold();

    const unsubscribeThresholdList = useThresholdStorage.subscribe(() => {
      setThresholdList(useThresholdStorage.getSnapshot() || []);
    });

    return () => {
      unsubscribeWatchList();
      unsubscribeThresholdList();
    }; // Cleanup on unmount
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
    let threshold = thresholdList.find(item => item.id === id);
    if (threshold === undefined) {
      threshold = {
        id: id,
        active: false,
        lower: 0,
        upper: 0,
      } as Threshold;
    }
    setThreshold(threshold);
    setAlertMessage(null);
  };

  const toggleChangeRateDetail = () => {
    settingStorage.toggleChangeRate();
  };

  const toggleNotification = () => {
    // Only allow toggling if there are no active alerts
    if (!alertMessage) {
      setThreshold(prevThreshold => {
        const updatedThreshold = {
          ...prevThreshold,
          active: !prevThreshold.active,
        };

        useThresholdStorage.updateThreshold(updatedThreshold);
        return updatedThreshold;
      });
    }
  };

  const updateUpperThreshold = (price: string, item: WatchlistItem) => {
    setThreshold(prev => ({
      ...prev, // Keep the existing properties
      upper: price, // Update the 'lower' property
    }));
  };

  const updateLowerThreshold = (price: string, item: WatchlistItem) => {
    setThreshold(prev => ({
      ...prev, // Keep the existing properties
      lower: price, // Update the 'lower' property
    }));
  };

  const checkForAlerts = (item: WatchlistItem, price: string | number, threshold: string) => {
    if (price < item.price && price !== 0 && threshold == 'upper') {
      setAlertMessage(`Alert: Notification Upper threshold cant be lower the actual Price.`);
    } else if (price > item.price && price !== 0 && threshold == 'lower') {
      setAlertMessage(`Alert: Notification Lower threshold cant be higher the actual Price.`);
    } else {
      setAlertMessage(null); // Clear the alert if no condition is met
    }
  };

  const handleRedirect = (item: WatchlistItem) => {
    if (item?.url) {
      window.open(item?.url, '_blank');
    } else {
      window.open(`https://www.kucoin.com/trade/${item.symbol}-USDT`, '_blank');
    }
  };

  const toggleModal = async () => {
    const notificationOptions = {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-34.png'),
      title: 'Injecting content script error',
      message: 'You cannot inject script here!',
    } as const;
    const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
    await chrome.scripting
      .executeScript({
        target: { tabId: tab.id! },
        files: ['/content-runtime/index.iife.js'],
      })
      .catch(err => {
        // Handling errors related to other paths
        if (err.message.includes('Cannot access a chrome:// URL')) {
          chrome.notifications.create('inject-error', notificationOptions);
        }
      });
  };

  return (
    <>
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
          <Button onClick={toggleChangeRateDetail}>Display Change Rate Detail</Button>
          <Divider />
          <List>
            {watchlist?.map(item => (
              <React.Fragment key={item.guidID}>
                <ListItem
                  alignItems="center"
                  onClick={() => toggleExpandItem(item.guidID)} // Expand/Collapse on click
                  sx={{ display: 'block' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '-webkit-fill-available' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemAvatar style={{ position: 'relative' }}>
                        <Avatar
                          src={item.isPriority ? chrome.runtime.getURL(item?.imageUrl) : item?.imageUrl}
                          alt={item.symbol}
                        />
                        <IconButton
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: 'white', // Optional: To make the button stand out
                            padding: 4,
                          }}
                          size="small"
                          onClick={event => {
                            event.stopPropagation();
                            handleRedirect(item);
                          }}>
                          <OpenInNewIcon fontSize="small" sx={{ fontSize: 10 }} />
                        </IconButton>
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
                      <Box
                        sx={{
                          height: '72px',
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column', // Stack the children vertically
                          alignItems: 'center', // Center align horizontally
                        }}>
                        <IconButton
                          sx={{
                            scale: 0.9,
                          }}
                          edge="end"
                          onClick={() => removeCoin(item.url, item.name, item.isPriority)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          color={thresholdList.find(i => i.id === item.guidID)?.active ? 'success' : 'error'}>
                          {thresholdList.find(i => i.id === item.guidID)?.active ? (
                            <NotificationsActiveIcon />
                          ) : (
                            <NotificationsOffIcon />
                          )}
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                  {item.isPriority === false && setting.changeRate && (
                    <Box>
                      <ChangeRateCard
                        changeRate24h={item.changeRate24h}
                        changeRate5m={item.changeRate5m}
                        changeRate1h={item.changeRate1h}
                        changeRate6h={item.changeRate6h}
                      />
                    </Box>
                  )}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}>
                      {/* Lower Limit Input */}
                      <TextField
                        disabled={threshold.active}
                        label="Lower Limit"
                        type="text"
                        fullWidth
                        value={threshold?.lower?.toString() || ''}
                        size="small"
                        sx={{
                          flex: 1,
                          '& .MuiInputBase-input': {
                            textAlign: 'left', // Right-align the text in the input field
                          },
                          '& .MuiInputLabel-root': {
                            color: '#007BFF', // Default label color
                          },
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: '#007BFF', // Default border color
                            },
                          },
                          '& .MuiInputLabel-root.Mui-disabled': {
                            color: 'grey.400', // Label color when disabled
                          },
                          '& .MuiInputBase-input.Mui-disabled': {
                            color: 'grey.500', // Set text color for disabled state
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'grey.300', // Optional: Customize border color for disabled state
                          },
                        }}
                        onChange={event => {
                          const newValue = event.target.value;
                          updateLowerThreshold(newValue, item); // Update the lower threshold
                          checkForAlerts(item, newValue, 'lower'); // Trigger alert check immediately
                        }}
                      />

                      {/* Upper Limit Input */}
                      <TextField
                        disabled={threshold.active}
                        label="Upper Limit"
                        type="text"
                        value={threshold?.upper?.toString() || ''}
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
                          '& .MuiInputLabel-root.Mui-disabled': {
                            color: 'grey.400', // Label color when disabled
                          },
                        }}
                        onChange={event => {
                          const newValue = event.target.value;
                          updateUpperThreshold(newValue, item); // Update the upper threshold
                          checkForAlerts(item, newValue, 'upper'); // Trigger alert check immediately
                        }}
                      />
                    </Box>

                    {/* Second Row: Percentage Buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {/* Lower Limit Buttons */}
                      <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {[10, 20, 50].map(percent => (
                          <Button
                            disabled={threshold.active}
                            key={percent}
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              if (Number(item.price) < 0.00001) {
                                const adjustedPrice = (Number(item.price) * (1 - percent / 100)).toFixed(18); // Ensure 18 decimal precision
                                updateLowerThreshold(adjustedPrice, item); // Pass as a string to avoid scientific notation
                              } else {
                                const adjustedPrice = (Number(item.price) * (1 - percent / 100)).toFixed(4); // Ensure 18 decimal precision
                                updateLowerThreshold(adjustedPrice.toString(), item); // Pass as a string to avoid scientific notation
                              }
                            }}>
                            -{percent}%
                          </Button>
                        ))}
                      </Box>

                      {/* Spacer */}

                      <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="body2"
                          sx={{
                            textAlign: 'center',
                            minWidth: 80, // Adjust width as needed
                            padding: 1,
                            border: '1px solid #ccc',
                            borderRadius: 1,
                            fontWeight: 'bold',
                            marginBottom: '10px',
                            width: '-webkit-fill-available',
                          }}>
                          ${formatCustomPrice(Number(item.price))}
                        </Typography>
                        <Button
                          variant="contained"
                          color={threshold?.active ? 'success' : 'error'}
                          startIcon={threshold?.active ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                          onClick={() => toggleNotification()} // Function to toggle active state
                          sx={{
                            '& .MuiButton-startIcon': { marginRight: '0px', marginLeft: '0px' },
                            textTransform: 'none', // Keep the text case as is
                            padding: '8px 16px',
                            width: '-webkit-fill-available',
                          }}></Button>
                      </Box>

                      {/* Upper Limit Buttons */}
                      <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {[10, 20, 50].map(percent => (
                          <Button
                            disabled={threshold.active}
                            key={percent}
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              if (Number(item.price) < 0.00001) {
                                const adjustedPrice = (Number(item.price) * (1 + percent / 100)).toFixed(18); // Ensure 18 decimal precision
                                updateUpperThreshold(adjustedPrice, item); // Pass as a string to avoid scientific notation
                              } else {
                                const adjustedPrice = (Number(item.price) * (1 + percent / 100)).toFixed(4); // Ensure 18 decimal precision
                                updateUpperThreshold(adjustedPrice.toString(), item); // Pass as a string to avoid scientific notation
                              }
                            }}>
                            +{percent}%
                          </Button>
                        ))}
                      </Box>
                    </Box>

                    {alertMessage && (
                      <Box p={1} mb={2} border="1px solid" borderColor="error.main" borderRadius={2}>
                        <Typography variant="body2" color="error">
                          {alertMessage}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          <Box mt="auto" p={2} textAlign="center" borderTop="1px solid #ccc">
            <Button variant="contained" onClick={toggleModal}>
              Open Popup
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
