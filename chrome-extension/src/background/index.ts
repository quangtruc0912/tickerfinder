import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  console.log('abc', message);
  if (message.type === 'FETCH_KUCOIN') {
    console.log('abc', message);
    const ticker = message.ticker;
    console.log('Received request to fetch:', ticker);

    fetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${ticker}-USDT`)
      .then(res => {
        return res.json();
      })
      .then(res => {
        senderResponse(res);
      });

    return true; // Keep the message channel open for asynchronous response
  }
});

console.log('background loaded');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");
