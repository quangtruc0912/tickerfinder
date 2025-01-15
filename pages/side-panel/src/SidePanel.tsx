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

  const removeCoin = async (url: string) => {
    await useWatchListStorage.removeFromWatchlist(url);
  };

  const removePriorityCoin = async (name: string) => {
    await useWatchListStorage.removePriorityFromWatchlist(name);
  };

  const coinData = useCoinData(watchlist);
  console.log(coinData);

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
          borderRadius: '12px 0 0 12px', // Rounded corners on the left side
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)', // Soft shadow for elevation
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
          {watchlist.map(item => (
            <React.Fragment key={item.address}>
              <ListItem alignItems="center" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemAvatar>
                    <Avatar
                      src={
                        'https://dd.dexscreener.com/ds-data/tokens/ethereum/0x38e68a37e401f7271568cecaac63c6b1e19130b4.png?size=lg&key=3f84d5'
                      }
                      alt={item.symbol}
                    />
                  </ListItemAvatar>
                  <Box sx={{ marginLeft: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body1" fontWeight="500">
                          {item.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
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
                      ${10} {/* Example: Replace with actual price */}
                    </Typography>
                    <Typography variant="caption" color={Math.random() > 0 ? 'success.main' : 'error.main'}>
                      {10 > 0 ? '+' : ''}
                      {Math.random().toFixed(2)}%
                    </Typography>
                  </Box>

                  <IconButton edge="end" onClick={() => removeCoin(item.address)}>
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
