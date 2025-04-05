import { useEffect, useState } from 'react';
import { useStorage } from '@extension/shared';
import { useWatchListStorage, exampleThemeStorage } from '@extension/storage';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';

export const SyncWatchLists = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const [syncWatchList, setSyncWatchList] = useState<any>(null);
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(true);
  const localWatchList = useStorage(useWatchListStorage);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch data from chrome.storage.sync
  const fetchSyncWatchList = () => {
    chrome.storage.sync.get(['cryptoWatchlist', 'lastUpdated'], syncResult => {
      setIsSyncLoading(false);
      if (chrome.runtime.lastError) {
        console.error('Error fetching sync data:', chrome.runtime.lastError);
        return;
      }
      setSyncWatchList(syncResult.cryptoWatchlist);
    });
  };

  useEffect(() => {
    fetchSyncWatchList();
  }, []);

  const triggerSync = async () => {
    setIsSyncLoading(true);
    console.log('Triggering ');
    try {
      chrome.runtime.sendMessage(
        {
          type: 'TRIGGER_LOCALWATCHLIST_SYNC',
          cryptoWatchlist: syncWatchList,
          lastUpdated: Date.now(),
        },
        response => {
          console.log('Background sync triggered', response);
          fetchSyncWatchList(); // this will call setIsSyncLoading(false) at the end
        },
      );
    } catch (error) {
      console.error('Error triggering sync:', error);
      setIsSyncLoading(false); // only here in case of error
    }
  };

  const triggerSyncToLocal = async () => {
    setIsSyncing(true);
    try {
      chrome.runtime.sendMessage(
        {
          type: 'TRIGGER_SYNC_TO_LOCAL',
          cryptoWatchlist: localWatchList,
          lastUpdated: Date.now(),
        },
        response => {
          console.log('Sync to local storage triggered', response);
          setIsSyncing(false); // ✅ Move this here, after we get a response
        },
      );
    } catch (error) {
      console.error('Error syncing to local storage:', error);
      setIsSyncing(false); // ✅ Also here for catch fallback
    }
  };

  const resolveConflict = (source: 'sync' | 'local') => {
    if (source === 'sync') {
      // Resolve by choosing sync data
      useWatchListStorage.set(syncWatchList);
    } else {
      // Resolve by choosing local data
      chrome.storage.sync.set({ cryptoWatchlist: localWatchList }, () => {
        console.log('Sync storage updated with local data');
      });
    }
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
        Sync Data Across Chrome Profiles. Choose the version to keep.
      </Typography>
      <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
        On a new computer, Chrome should automatically sync this data when the same Profile logs in (1-2 minutes or just
        turn off browser and reopen it).
      </Typography>

      {/* Display Sync Watchlist */}
      <Typography variant="h6" sx={{ marginBottom: '1rem' }}>
        Sync Watchlist:
      </Typography>

      <Box sx={{ position: 'relative' }}>
        {isSyncLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}>
            <CircularProgress />
          </Box>
        )}
        <Paper
          elevation={3}
          sx={{
            padding: '1rem',
            textAlign: 'left',
            backgroundColor: isLight ? '#fff' : '#333',
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: '8px',
            opacity: isSyncLoading ? 0.5 : 1,
            pointerEvents: isSyncLoading ? 'none' : 'auto',
          }}>
          <Box
            sx={{
              maxHeight: '300px',
              overflowY: 'auto',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              padding: '0.5rem',
              backgroundColor: isLight ? '#fff' : '#333',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}>
            <Typography variant="body2" component="pre" sx={{ color: isLight ? 'gray' : 'lightgray' }}>
              {JSON.stringify(syncWatchList, null, 2)}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Display Local Watchlist */}
      <Typography variant="h6" sx={{ marginTop: '2rem', marginBottom: '1rem' }}>
        Local Watchlist:
      </Typography>

      <Box sx={{ position: 'relative' }}>
        {isSyncing && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}>
            <CircularProgress />
          </Box>
        )}
        <Paper
          elevation={3}
          sx={{
            padding: '1rem',
            textAlign: 'left',
            backgroundColor: isLight ? '#fff' : '#333',
            maxWidth: '100%',
            overflow: 'hidden',
            borderRadius: '8px',
            opacity: isSyncing ? 0.5 : 1,
            pointerEvents: isSyncing ? 'none' : 'auto',
          }}>
          <Box
            sx={{
              maxHeight: '300px',
              overflowY: 'auto',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              padding: '0.5rem',
              backgroundColor: isLight ? '#fff' : '#333',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}>
            <Typography variant="body2" component="pre" sx={{ color: isLight ? 'gray' : 'lightgray' }}>
              {JSON.stringify(localWatchList, null, 2)}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Buttons to resolve conflict */}
      {/* <Box sx={{ marginTop: '2rem' }}>
        <Button
          variant="contained"
          sx={{
            marginTop: '1rem',
            color: isLight ? 'white' : 'black',
            '&:hover': {
              backgroundColor: isLight ? 'primary.dark' : 'secondary.dark',
            },
          }}
          onClick={() => resolveConflict('sync')}>
          Keep Sync Data
        </Button>

        <Button
          variant="contained"
          sx={{
            marginTop: '1rem',
            color: isLight ? 'white' : 'black',
            '&:hover': {
              backgroundColor: isLight ? 'primary.dark' : 'secondary.dark',
            },
          }}
          onClick={() => resolveConflict('local')}>
          Keep Local Data
        </Button>
      </Box> */}

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
        onClick={triggerSync}
        disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'LOCAL TO SYNC'}
      </Button>

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
        onClick={triggerSyncToLocal}
        disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync to Local'}
      </Button>
    </Box>
  );
};
