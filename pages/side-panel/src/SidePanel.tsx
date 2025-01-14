import '@src/SidePanel.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { useWatchListStorage, WatchlistItem } from '@extension/storage';
import React, { useState, useEffect } from 'react';
import {} from '@extension/shared';
import { Drawer, List, ListItem, ListItemText, IconButton, Typography, Box, Divider } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

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

  return (
    <Drawer
      anchor="left"
      open={true}
      variant="persistent"
      sx={{
        width: 360,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 360,
          boxSizing: 'border-box',
          backgroundColor: 'background.default',
          color: 'text.primary',
        },
      }}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Crypto Watchlist
        </Typography>
        <Divider />
        <List>
          {watchlist.map(item => (
            <ListItem
              key={item.address}
              divider
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <ListItemText
                primary={item.name}
                secondary={`(${item.symbol})`}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              />
              <IconButton edge="end" aria-label="delete" onClick={() => removeCoin(item.url)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <div> Loading ... </div>), <div> Error Occur </div>);
