import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import type { ComponentPropsWithoutRef } from 'react';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const notificationOptions = {
  type: 'basic',
  iconUrl: chrome.runtime.getURL('icon-34.png'),
  title: 'Injecting content script error',
  message: 'You cannot inject script here!',
} as const;

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const logo = isLight ? 'popup/logo_vertical.svg' : 'popup/logo_vertical_dark.svg';
  const goGithubSite = () => chrome.tabs.create({ url: 'https://google.com' });

  // const injectContentScript = async () => {
  //   const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

  //   if (tab.url!.startsWith('about:') || tab.url!.startsWith('chrome:')) {
  //     chrome.notifications.create('inject-error', notificationOptions);
  //   }

  //   await chrome.scripting
  //     .executeScript({
  //       target: { tabId: tab.id! },
  //       files: ['/content-runtime/index.iife.js'],
  //     })
  //     .catch(err => {
  //       // Handling errors related to other paths
  //       if (err.message.includes('Cannot access a chrome:// URL')) {
  //         chrome.notifications.create('inject-error', notificationOptions);
  //       }
  //     });
  // };

  return (
    <div className={`App ${isLight ? 'bg-slate-50' : 'bg-gray-800'}`}>
      <header className={`App-header ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
        <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />

        <Stack sx={{ width: '100%' }} spacing={1}>
          <Alert severity="info">Most of the data fetch directly from Dexscreener.</Alert>
          <Alert severity="info">
            Top coin(BTC,ETH,SOL,....) will prioritize fetch from CEX(currently Kucoin) and be able to have price
            indicator.
          </Alert>
        </Stack>
        {/* <p>
          Edit <code>pages/popup/src/Popup.tsx</code>
        </p> */}
        {/* <button
          className={
            'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
            (isLight ? 'bg-blue-200 text-black' : 'bg-gray-700 text-white')
          }
          onClick={injectContentScript}>
          Click to inject Content Script
        </button> */}
        <ToggleButton>Toggle theme</ToggleButton>
        <SidepanelButton>Side panel</SidepanelButton>
      </header>
    </div>
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
const SidepanelButton = (props: ComponentPropsWithoutRef<'button'>) => {
  const theme = useStorage(exampleThemeStorage);
  return (
    <button
      className={
        props.className +
        ' ' +
        'font-bold mt-4 py-1 px-4 rounded shadow hover:scale-105 ' +
        (theme === 'light' ? 'bg-white text-black shadow-black' : 'bg-black text-white')
      }
      onClick={async (event: any) => {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        chrome.runtime.sendMessage({ type: 'open_side_panel', tab });
      }}>
      {props.children}
    </button>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
