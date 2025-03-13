import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Box, Divider, Typography } from '@mui/material';

export const ChangeLog = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  const logs = [
    {
      version: '0.1.4',
      date: 'Feb 08, 2025',
      changes: ['🚀 Display contract verified by Coingecko.', '🎨 Add change log on options.', '🔄 Update dex icon'],
      devComments:
        'Dexscreener query might have alots of token that have the same ticker, and sometime scam token. Add another dex that can verify contract address could reduce amount of scam token.',
    },
    {
      version: '0.1.5',
      date: 'Feb 13, 2025',
      changes: [
        '🔥 Add search ticker modal (can search by CA and Ticker).',
        '✨ Ctrl + / to OPEN modal search ',
        '🔄 Open search button on side panel',
        '🌌 Fix Valid text on Threshold notification',
      ],
      devComments:
        'The Chrome extension automatically detects tickers and displays price/data when users hover over them. However, it only works for elements that already exist on the screen. Adding the ability for users to search for any ticker or contract address would provide more freedom.',
    },
    {
      version: '0.1.6',
      date: 'Feb 18, 2025',
      changes: [
        '🚀 Add chain filter for price display.',
        '✨ Small Chart Buys/Sells to display buy sell presssure',
        '🔄 Paging for sidepanel',
      ],
      devComments: 'None',
    },
    {
      version: '0.1.8',
      date: 'March 13, 2025',
      changes: ['🔥 Add Wallet tracking.', '✨ Intructions / Demo video for new user'],
      devComments: 'None',
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: isLight ? '#fff' : '#333',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: 3,
        marginTop: '1rem',
      }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: '1rem', color: isLight ? 'black' : 'white' }}>
        Change Log
      </Typography>
      <Divider sx={{ marginBottom: '1rem' }} />

      {logs.map((log, index) => (
        <Box
          key={index}
          sx={{
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: index !== logs.length - 1 ? '1px solid gray' : 'none',
          }}>
          <Typography variant="h6" sx={{ color: isLight ? 'black' : 'white' }}>
            {log.version} - {log.date}
          </Typography>
          <ul style={{ paddingLeft: '1rem', color: isLight ? 'black' : 'white' }}>
            {log.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
          <Typography
            variant="body2"
            sx={{ marginTop: '0.5rem', fontStyle: 'italic', color: isLight ? 'gray' : 'lightgray' }}>
            📝 Dev Comments: {log.devComments}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
