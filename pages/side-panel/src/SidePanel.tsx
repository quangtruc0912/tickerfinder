import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense, useStorage } from '@extension/shared';
import {
  Threshold,
  useWatchListStorage,
  WatchlistItem,
  useThresholdStorage,
  settingStorage,
  tokenBalanceStorage,
} from '@extension/storage';
import React, { useState, useEffect } from 'react';
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
  Tabs,
  Tab,
  Pagination,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ChangeRateCard from './ChangeRateCard';
import CoinBalanceList from './CoinBalanceList';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const commonStyles = {
  flexCenter: { display: 'flex', alignItems: 'center' },
  flexBetween: { display: 'flex', justifyContent: 'space-between' },
  ellipsisText: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};

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

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}
function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {value === index && <div>{children}</div>}
    </div>
  );
}

const SidePanel = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [thresholdList, setThresholdList] = useState<Threshold[]>([]);
  const [threshold, setThreshold] = useState<Threshold>({ active: false, id: '', lower: 0, upper: 0 });
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [value, setValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tokenBalance = useStorage(tokenBalanceStorage);
  const setting = useStorage(settingStorage);

  useEffect(() => {
    const fetchWatchlist = async () => setWatchlist(await useWatchListStorage.getWatchlist());
    const fetchThreshold = async () => setThresholdList(await useThresholdStorage.getThreshold());

    fetchWatchlist();
    fetchThreshold();

    const unsubscribeWatchList = useWatchListStorage.subscribe(() =>
      setWatchlist(useWatchListStorage.getSnapshot() || []),
    );
    const unsubscribeThresholdList = useThresholdStorage.subscribe(() =>
      setThresholdList(useThresholdStorage.getSnapshot() || []),
    );

    return () => {
      unsubscribeWatchList();
      unsubscribeThresholdList();
    };
  }, []);

  const removeCoin = async (url: string, name: string, isPriority: boolean) => {
    if (!isPriority) {
      chrome.runtime.sendMessage({ type: 'REMOVE_FROM_WATCHLIST', id: url }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error removing from watchlist:", chrome.runtime.lastError);
        // } else {
        //   console.log("Removed from watchlist:", response);
        // }
      });
    } else {
      chrome.runtime.sendMessage({ type: 'REMOVE_PRIORITY_FROM_WATCHLIST', name: name }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error removing priority coin:", chrome.runtime.lastError);
        // } else {
        //   console.log("Removed priority coin from watchlist:", response);
        // }
      });
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
    setThreshold(prev => ({ ...prev, upper: price }));
  };

  const updateLowerThreshold = (price: string, item: WatchlistItem) => {
    setThreshold(prev => ({ ...prev, lower: price }));
  };

  const checkForAlerts = (item: WatchlistItem, price: string | number, thresholdType: string) => {
    const numPrice = Number(price);
    const itemPrice = Number(item.price);
    if (numPrice < itemPrice && numPrice !== 0 && thresholdType === 'upper') {
      setAlertMessage('Alert: Notification Upper threshold can’t be lower than the actual Price.');
    } else if (numPrice > itemPrice && numPrice !== 0 && thresholdType === 'lower') {
      setAlertMessage('Alert: Notification Lower threshold can’t be higher than the actual Price.');
    } else {
      setAlertMessage(null);
    }
  };

  const handleRedirect = (item: WatchlistItem) => {
    window.open(item?.url || `https://www.kucoin.com/trade/${item.symbol}-USDT`, '_blank');
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

  useEffect(() => {
    if (currentPage > Math.ceil(watchlist.length / itemsPerPage)) setCurrentPage(1);
  }, [watchlist]);

  useEffect(() => {
    chrome.storage.local.get(['selectedTab'], result => {
      if (result.selectedTab !== undefined) setValue(result.selectedTab);
    });

    const handleMessage = (message: { tab?: number }) => {
      if (message.tab !== undefined) setValue(message.tab);
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    chrome.storage.local.set({ selectedTab: newValue });
  };

  const paginatedWatchlist = watchlist.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(watchlist.length / itemsPerPage);
  const lastFetchTime = setting.lastFetchWatchList ? new Date(setting.lastFetchWatchList).toLocaleString() : 'Never';

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
            width: 400,
            maxWidth: '100vw',
            height: '100vh',
            boxSizing: 'border-box',
            backgroundColor: 'background.default',
            color: 'text.primary',
          },
        }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTabs-indicator': { height: 4, borderRadius: 2 },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  minHeight: 48,
                  color: 'grey.500',
                  '&.Mui-selected': { color: 'primary.main' },
                  '&:hover': { color: 'grey.700' },
                },
              }}>
              <Tab label="Watch List" {...a11yProps(0)} />
              <Tab label={`Wallet (${setting.address?.slice(-4) || '----'})`} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <Divider />
          <CustomTabPanel value={value} index={0}>
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Typography variant="body2" color="gray">
                Last Fetched: {lastFetchTime}
              </Typography>
            </Box>
            <List>
              {paginatedWatchlist.map(item => (
                <React.Fragment key={item.guidID}>
                  <ListItem onClick={() => toggleExpandItem(item.guidID)} sx={{ display: 'block', p: 0 }}>
                    <Box sx={{ ...commonStyles.flexBetween, width: '100%' }}>
                      <Box sx={commonStyles.flexCenter}>
                        <ListItemAvatar sx={{ position: 'relative', minWidth: 40 }}>
                          <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar
                              src={
                                item.isPriority
                                  ? item.imageUrl.startsWith('https')
                                    ? item.imageUrl
                                    : chrome.runtime.getURL(item.imageUrl)
                                  : item.imageUrl
                              }
                              alt={item.symbol}
                              sx={{ width: 40, height: 40 }}
                            />
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                handleRedirect(item);
                              }}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                bgcolor: 'white',
                                p: 0.5,
                                boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                              }}>
                              <OpenInNewIcon fontSize="small" sx={{ fontSize: 10 }} />
                            </IconButton>
                          </Box>
                        </ListItemAvatar>
                        <Box sx={{ ml: 1 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight="500" sx={commonStyles.ellipsisText}>
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
                      <Box sx={{ ...commonStyles.flexCenter, gap: 1.5 }}>
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <IconButton
                            onClick={() => removeCoin(item.url, item.name, item.isPriority)}
                            sx={{ transform: 'scale(0.9)' }}>
                            <DeleteIcon />
                          </IconButton>
                          <IconButton
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
                      <ChangeRateCard
                        changeRate24h={item.changeRate24h}
                        changeRate5m={item.changeRate5m}
                        changeRate1h={item.changeRate1h}
                        changeRate6h={item.changeRate6h}
                      />
                    )}
                  </ListItem>
                  <Collapse in={expandedItem === item.guidID} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2, borderRadius: 1, m: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Notification Threshold for {item.name.length > 10 ? `${item.name.slice(0, 10)}...` : item.name}
                      </Typography>
                      <Box sx={{ ...commonStyles.flexCenter, gap: 1, mb: 2 }}>
                        <TextField
                          disabled={threshold.active}
                          label="Lower Limit"
                          type="text"
                          fullWidth
                          value={threshold?.lower?.toString() || ''}
                          size="small"
                          sx={{
                            flex: 1,
                            '& .MuiInputBase-input': { textAlign: 'left' },
                            '& .MuiInputLabel-root': { color: 'primary.main' },
                            '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'primary.main' } },
                            '& .MuiInputLabel-root.Mui-disabled': { color: 'grey.400' },
                            '& .MuiInputBase-input.Mui-disabled': { color: 'grey.500' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.300' },
                          }}
                          onChange={e => {
                            const newValue = e.target.value;
                            updateLowerThreshold(newValue, item);
                            checkForAlerts(item, newValue, 'lower');
                          }}
                        />
                        <TextField
                          disabled={threshold.active}
                          label="Upper Limit"
                          type="text"
                          value={threshold?.upper?.toString() || ''}
                          fullWidth
                          size="small"
                          sx={{
                            flex: 1,
                            '& .MuiInputBase-input': { textAlign: 'right' },
                            '& .MuiInputLabel-root': { color: 'primary.main' },
                            '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'primary.main' } },
                            '& .MuiInputLabel-root.Mui-disabled': { color: 'grey.400' },
                          }}
                          onChange={e => {
                            const newValue = e.target.value;
                            updateUpperThreshold(newValue, item);
                            checkForAlerts(item, newValue, 'upper');
                          }}
                        />
                      </Box>
                      <Box sx={{ ...commonStyles.flexCenter, gap: 2 }}>
                        <Box sx={{ flex: 1, ...commonStyles.flexCenter, gap: 1, flexWrap: 'wrap' }}>
                          {[10, 20, 50].map(percent => (
                            <Button
                              disabled={threshold.active}
                              key={percent}
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const adjustedPrice =
                                  Number(item.price) < 0.00001
                                    ? (Number(item.price) * (1 - percent / 100)).toFixed(18)
                                    : (Number(item.price) * (1 - percent / 100)).toFixed(4);
                                updateLowerThreshold(adjustedPrice, item);
                              }}>
                              -{percent}%
                            </Button>
                          ))}
                        </Box>
                        <Box sx={{ flex: 1, ...commonStyles.flexCenter, flexDirection: 'column', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              textAlign: 'center',
                              minWidth: 80,
                              p: 1,
                              border: 1,
                              borderColor: 'grey.300',
                              borderRadius: 1,
                              fontWeight: 'bold',
                              width: '100%',
                            }}>
                            ${formatCustomPrice(Number(item.price))}
                          </Typography>
                          <Button
                            variant="contained"
                            color={threshold?.active ? 'success' : 'error'}
                            startIcon={threshold?.active ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
                            onClick={toggleNotification}
                            sx={{ textTransform: 'none', width: '100%', '& .MuiButton-startIcon': { mr: 0, ml: 0 } }}
                          />
                        </Box>
                        <Box
                          sx={{
                            flex: 1,
                            ...commonStyles.flexCenter,
                            gap: 1,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                          }}>
                          {[10, 20, 50].map(percent => (
                            <Button
                              disabled={threshold.active}
                              key={percent}
                              variant="outlined"
                              size="small"
                              onClick={() => {
                                const adjustedPrice =
                                  Number(item.price) < 0.00001
                                    ? (Number(item.price) * (1 + percent / 100)).toFixed(18)
                                    : (Number(item.price) * (1 + percent / 100)).toFixed(4);
                                updateUpperThreshold(adjustedPrice, item);
                              }}>
                              +{percent}%
                            </Button>
                          ))}
                        </Box>
                      </Box>
                      {alertMessage && (
                        <Box sx={{ p: 1, mb: 2, border: 1, borderColor: 'error.main', borderRadius: 2 }}>
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
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  shape="rounded"
                />
              </Box>
            )}
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <CoinBalanceList tokenBalance={tokenBalance} />
          </CustomTabPanel>
          <Box sx={{ mt: 'auto', p: 2, textAlign: 'center', borderTop: 1, borderColor: 'grey.300' }}>
            <Button variant="contained" onClick={toggleModal}>
              Open Search | Ctrl + /
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
