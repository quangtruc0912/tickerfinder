import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, settingStorage } from '@extension/storage';
import { useState } from 'react';
import { Container, Typography, Switch, TextField, Button, Box, Divider } from '@mui/material';
import type { ComponentPropsWithoutRef } from 'react';
const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const setting = useStorage(settingStorage);
  const isLight = theme === 'light';

  return (
    <Container
      maxWidth={false}
      className={`${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}
      sx={{
        display: 'flex',
        color: 'text.primary',
        minHeight: '100vh',
        padding: '2rem',
      }}>
      {/* Left Side - Settings Form */}
      <Box
        sx={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: '2rem',
          backgroundColor: isLight ? '#fff' : '#333',
          borderRadius: '8px',
          boxShadow: 3, // Slight shadow for the form
          marginRight: '2rem', // Space between left and right side
        }}>
        <Typography
          variant="h4"
          sx={{
            color: isLight ? 'black' : 'white',
            marginBottom: '1rem',
            fontWeight: 'bold',
          }}>
          Settings
        </Typography>
        <ToggleButton>Toggle DARK / LIGHT Theme</ToggleButton>
        <Divider sx={{ width: '100%', margin: '1.5rem 0' }} /> {/* Divider between sections */}
        <Box sx={{ padding: '2rem' }}>
          {/* Text and Color Picker in Same Line */}
          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Typography variant="h6" sx={{ color: isLight ? 'black' : 'white', marginRight: '1rem' }}>
              Select Ticker Background Color:
            </Typography>
            <TextField
              type="color"
              variant="outlined"
              sx={{ width: '150px', marginRight: '1rem' }} // Space between color picker and text box
              value={setting.tickerBackgroundColor}
              onChange={e => settingStorage.changeTickerBackgroundColor(e.target.value)}
            />

            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body1">
                <a
                  href="#"
                  style={{
                    backgroundColor: setting.tickerBackgroundColor,
                    color: 'rgb(29, 155, 240)', // Set text color
                    textDecoration: 'none', // Remove underline
                    padding: '5px 10px', // Add padding for better visibility
                    borderRadius: '4px', // Optional: Rounded corners
                  }}>
                  $BTC
                </a>
              </Typography>

              {/* Text Box to Display HEX Color Value */}
              <TextField
                type="text"
                value={setting.tickerBackgroundColor}
                onChange={e => settingStorage.changeTickerBackgroundColor(e.target.value)}
                sx={{
                  width: '150px',
                  backgroundColor: 'transparent',
                  border: '1px solid',
                  borderColor: isLight ? 'black' : 'white',
                  color: 'rgb(29, 155, 240)',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  '& .MuiInputBase-input': {
                    color: isLight ? 'black' : 'white',
                  },
                }}
                inputProps={{ maxLength: 7 }} // Limit to 7 characters
              />
            </Box>
          </Box>

          {/* You can add any other content below */}
        </Box>
      </Box>

      {/* Right Side - Empty or additional sections */}
      <Box
        sx={{
          width: '50%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {/* Placeholder for any other settings */}
        <Box
          sx={{
            width: '50%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <ChangeLog />
        </Box>
      </Box>
    </Container>
  );
};

const ToggleButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={exampleThemeStorage.toggle}>
      {props.children}
    </button>
  );
};

const ChangeLog = () => {
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

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
