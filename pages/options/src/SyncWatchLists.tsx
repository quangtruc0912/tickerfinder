import { useEffect, useState } from 'react';
import { useStorage } from '@extension/shared';
import { useWatchListStorage, exampleThemeStorage } from '@extension/storage';
import { Box, Typography, Paper, Button } from '@mui/material';

export const SyncWatchLists = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [watchList, setWatchList] = useState<any>(null);

  // Fetch data from chrome.storage.sync
  const fetchWatchList = () => {
    chrome.storage.sync.get(['cryptoWatchlist', 'lastUpdated'], syncResult => {
      setWatchList(syncResult.cryptoWatchlist);
    });
  };

  useEffect(() => {
    fetchWatchList();
  }, []);
  // Handle the button click to trigger sync in background
  const triggerSync = () => {
    // Send message to background script to trigger sync
    chrome.runtime.sendMessage(
      { type: 'TRIGGER_LOCALWATCHLIST_SYNC', cryptoWatchlist: watchList, lastUpdated: Date.now() },
      response => {
        console.log('Background sync triggered', response);
        fetchWatchList();
      },
    );
  };
  const triggerSyncToLocal = () => {
    // Send message to background script to sync to local storage
    chrome.runtime.sendMessage(
      { type: 'TRIGGER_SYNC_TO_LOCAL', cryptoWatchlist: watchList, lastUpdated: Date.now() },
      response => {
        console.log('Sync to local storage triggered', response);
        // Optionally reload watchlist or handle other operations after sync
      },
    );
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '600px',
        margin: 'auto',
        color: isLight ? 'black' : 'white',
      }}>
      <Typography variant="h5" sx={{ marginBottom: '1rem' }}>
        Sync Data Across Chrome Profiles. Press the button to sync local data to Chrome Sync.
      </Typography>
      <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
        On a new computer, Chrome should automatically sync this data when the same Profile logs in.(should be in 1 or
        2mins or just turn off browser and reopen it )
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '1rem', color: 'gray' }}>
        The following watchlist data will be synced across your Chrome profiles:
      </Typography>
      {/* Button to Trigger Sync */}
      <Button
        variant="contained"
        sx={{
          marginTop: '1rem',
          color: isLight ? 'white' : 'black',
          '&:hover': {
            backgroundColor: isLight ? 'primary.dark' : 'secondary.dark',
          },
        }}
        onClick={triggerSync}>
        LOCAL TO SYNC
      </Button>
      {/* Box for displaying raw JSON data */}
      <Paper
        elevation={3}
        sx={{
          padding: '1rem',
          textAlign: 'left',
          backgroundColor: isLight ? '#fff' : '#333',
          maxWidth: '100%',
          overflow: 'hidden',
          borderRadius: '8px',
        }}>
        <Box
          sx={{
            maxHeight: '500px', // Set a fixed height to prevent overflow
            overflowY: 'auto', // Enable scrolling if data is large
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace', // Makes it look like raw JSON data
            padding: '0.5rem',
            backgroundColor: isLight ? '#fff' : '#333',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}>
          <Typography variant="body2" component="pre" sx={{ color: isLight ? 'gray' : 'lightgray' }}>
            {JSON.stringify(watchList, null, 2)}
          </Typography>
        </Box>
      </Paper>

      {/* Button to Trigger Sync to Local Storage */}
      <Button
        variant="contained"
        sx={{
          marginTop: '1rem',
          color: isLight ? 'white' : 'black',
          '&:hover': {
            backgroundColor: isLight ? 'primary.dark' : 'secondary.dark',
          },
        }}
        onClick={triggerSyncToLocal}>
        Sync to Local
      </Button>

      <Typography variant="body1" sx={{ marginBottom: '1rem', color: 'gray' }}>
        Only press this button if there is data in the SyncBox
      </Typography>
    </Box>
  );
};
