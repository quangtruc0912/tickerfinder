import '@src/Options.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage, settingStorage } from '@extension/storage';
import { useState } from 'react';
import { Container, Typography, Tabs, Tab, TextField, Button, Box, Divider } from '@mui/material';
import type { ComponentPropsWithoutRef, SetStateAction } from 'react';
import { ChangeLog } from './ChangeLog';
import { Instructions } from './Intructions';
const Options = () => {
  const theme = useStorage(exampleThemeStorage);
  const setting = useStorage(settingStorage);
  const isLight = theme === 'light';
  const [tabIndex, setTabIndex] = useState(0);

  const handleChange = (_event: any, newIndex: SetStateAction<number>) => {
    setTabIndex(newIndex);
  };
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
          Settings CrXpto Extension
        </Typography>
        <ToggleThemeButton>Toggle DARK / LIGHT Theme</ToggleThemeButton>
        <Divider sx={{ width: '100%', margin: '1.5rem 0' }} /> {/* Divider between sections */}
        <Box sx={{ padding: '2rem' }}>
          {/* Toggle Change Rate Button */}
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
            <Typography variant="h6" sx={{ color: isLight ? 'black' : 'white', marginRight: '1rem' }}>
              Change Rate:
            </Typography>
            <Button
              variant="contained"
              onClick={() => settingStorage.toggleChangeRate()}
              sx={{
                backgroundColor: setting.changeRate ? 'green' : 'red',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: setting.changeRate ? 'darkgreen' : 'darkred',
                },
              }}>
              {setting.changeRate ? 'ON' : 'OFF'}
            </Button>
          </Box>

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
          {/* ERC-20 Address Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
            <Typography variant="h6" sx={{ color: isLight ? 'black' : 'white', marginRight: '1rem' }}>
              ERC-20 Address:
            </Typography>
            <TextField
              type="text"
              variant="outlined"
              placeholder="Enter ERC-20 contract address"
              value={setting.address}
              onChange={e => {
                const newAddress = e.target.value;
                settingStorage.setAddress(newAddress);

                // Send message to background script
                chrome.runtime.sendMessage({ type: 'UPDATE_ADDRESS', address: newAddress }, response => {
                  console.log('Background Response:', response);
                });
              }}
              sx={{
                flex: 1, // Makes the input take available space
                minWidth: '250px', // Ensures proper width
                backgroundColor: 'transparent',
                border: '1px solid',
                borderColor: isLight ? 'black' : 'white',
                '& .MuiInputBase-input': {
                  color: isLight ? 'black' : 'white',
                },
              }}
            />
          </Box>
          {/* You can add any other content below */}
        </Box>
      </Box>

      {/* Right Side - Empty or additional sections */}
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
        {/* Placeholder for any other settings */}
        <Tabs
          value={tabIndex}
          onChange={handleChange}
          textColor="primary"
          indicatorColor="primary"
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: 2,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              minHeight: 48,
              color: 'grey.500', // Inactive tabs are gray
              '&.Mui-selected': {
                color: 'primary.main', // Active tab is primary
              },
              '&:hover': {
                color: 'grey.700', // Darker gray on hover
              },
            },
          }}>
          <Tab label="Instructions" />
          <Tab label="Change Logs" />
        </Tabs>

        {/* Tabs Content */}
        <Box
          sx={{
            width: '100%',
            height: 'calc(100vh - 120px)', // Adjust to fit well
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {tabIndex === 0 && <Instructions />}
          {tabIndex === 1 && <ChangeLog />}
        </Box>
      </Box>
    </Container>
  );
};

const ToggleThemeButton = (props: ComponentPropsWithoutRef<'button'>) => {
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

export default withErrorBoundary(withSuspense(Options, <div> Loading ... </div>), <div> Error Occur </div>);
