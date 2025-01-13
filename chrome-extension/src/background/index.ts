import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {});

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.type === 'FETCH_KUCOIN') {
    const ticker = message.ticker;

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
