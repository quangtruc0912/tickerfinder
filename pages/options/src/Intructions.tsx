import { useStorage } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material';

export const Instructions = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 600,
        textAlign: 'left',
        padding: '1rem',
        color: isLight ? 'black' : 'white',
      }}>
      <Box sx={{ p: 2, bgcolor: '#fff3cd', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" fontWeight={600} color="warning.main" gutterBottom>
          Upcoming Permission Update (v0.2.0) (current version: v0.1.8)
        </Typography>
        <Typography variant="body1" color="textPrimary">
          In the next version of this extension, you will need to approve access to all websites (<code>all_urls</code>)
          for it to function properly. instead of the current <code>twitter.com</code> and <code>facebook.com</code>{' '}
          like before
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Basically i want the search function to work on all website, so i need to request permission to all website
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          When the update is released, Chrome may disable the extension until you approve the new permissions.
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          After the update is released, you can go to chrome extension setting and limit to <code>twitter.com</code> and{' '}
          <code>facebook.com</code> like before. If you want to xD
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          And for transparency. I public the github repo, you can check the code and see what i do with the extension.{' '}
          <a
            href="https://github.com/quangtruc0912/tickerfinder"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
            Github
          </a>
        </Typography>
      </Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        How to Use the Extension / Features.
      </Typography>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Or just watch this video:{' '}
        <a
          href="https://www.youtube.com/watch?v=DXxWNGOa_IU"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}>
          DEMO
        </a>
      </Typography>

      <List>
        {[
          { primary: '🔹 Search your favorite coin', secondary: 'Press [ Ctrl + / ] to open the Search box.' },
          {
            primary: '🔹 Open the Watch List coin everywhere',
            secondary: 'Press [ Ctrl + B ] to toggle the Watch List.',
          },
          {
            primary: '🔹 Wallet Watcher',
            secondary: 'Press [ Ctrl + B ] again to switch between Watchlist and Wallet.',
          },
          {
            primary: '🔹 Exclusively Ticker Detect on X/Twitter',
            secondary:
              'The extension auto detect coin symbol and hightlight it and you just need to hover for the Prices.',
          },
          {
            primary: '🔹 Alert Coin in Your Watchlist',
            secondary: 'Add or remove items to track your favorite assets.',
          },
          {
            primary: '🔹 Manage Your Wallet',
            secondary: 'View your wallet details and balance at a glance. (currently Support Eth L1 more type to come)',
          },
        ].map((item, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={item.primary}
              secondary={item.secondary}
              primaryTypographyProps={{ sx: { color: isLight ? 'grey.900' : 'grey.100' } }}
              secondaryTypographyProps={{ sx: { color: isLight ? 'grey.700' : 'grey.300' } }}
            />
          </ListItem>
        ))}
      </List>

      <Typography variant="body2" sx={{ color: isLight ? 'grey.700' : 'grey.300', marginTop: '1rem' }}>
        Need more help? Visit our{' '}
        <a href="https://x.com/crXptoExt" target="_blank" rel="noopener noreferrer">
          Support Page
        </a>
        .
      </Typography>
    </Box>
  );
};
