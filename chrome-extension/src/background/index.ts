import 'webextension-polyfill';
import { WatchlistItem, useWatchListStorage, Threshold, useThresholdStorage } from '@extension/storage';

const INTERVAL = 5000;
let watchlist: WatchlistItem[] = [];
const notificationUrls: Record<string, string> = {};

function formatCustomPrice(price: number): string {
  if (price === undefined || price === 0) {
    return '0';
  }

  // Ensure the price is represented as a fixed-point number string
  const priceString = price.toFixed(20); // Use a sufficiently large precision
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) {
    // If no decimal part, return as is
    return priceString;
  }

  const zerosCount = decimalPart.match(/^0+/)?.[0]?.length || 0;

  // Apply formatting only if there are more than 4 leading zeros
  if (zerosCount > 4 && integerPart == '0') {
    const significantDigits = decimalPart.slice(zerosCount).replace(/0+$/, ''); // Remove trailing zeros
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Otherwise, return the price as a normal decimal without trailing zeros
  return parseFloat(priceString).toString(); // Remove trailing zeros from normal decimals
}

const fetchPriorityCoin = async (symbol: string, watchlist: WatchlistItem) => {
  const res = await fetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${symbol}-USDT&timestamp=${Date.now()}`);
  const jsonData = await res.json();
  return {
    guidID: watchlist.guidID,
    address: watchlist.address,
    chainId: watchlist.chainId,
    dexId: watchlist.dexId,
    changeRate24h: (jsonData.data.changeRate * 100).toString(),
    price: jsonData.data.sell,
    name: watchlist.name,
    symbol: watchlist.symbol,
    url: watchlist.url,
    imageUrl: `content/${watchlist.symbol.toUpperCase()}.svg`,
    isPriority: true,
    changeRate5m: '0',
    changeRate1h: '0',
    changeRate6h: '0',
  } as WatchlistItem;
};
function getUniqueChains(items: WatchlistItem[], property: keyof WatchlistItem): string[] {
  const uniqueSet = new Set<string>();

  items.forEach(item => {
    const value = item[property];
    if (typeof value === 'string') {
      uniqueSet.add(value);
    }
  });

  return Array.from(uniqueSet);
}
const fetchCoinsData = async (watchlist: WatchlistItem[]) => {
  // const urlList = watchlist.map(item => item.url);
  const chainList = getUniqueChains(watchlist, 'chainId');
  const results = await Promise.all(
    chainList.map(async chain => {
      const tokenAddresses = watchlist
        .filter(item => item.chainId === chain)
        .map(item => item.address)
        .join(',');
      const url = `https://api.dexscreener.com/tokens/v1/${chain}/${encodeURIComponent(tokenAddresses)}`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${chain}: ${response.statusText}`);
        const data = await response.json();
        return data; // Return the chain name and the fetched data
      } catch (error) {
        console.error(`Error fetching data for ${chain}:`, error);
        return null; // Return null for failed requests
      }
    }),
  ).then(result => {
    const combined = result.flatMap(data => data);
    return combined;
  });

  const watchListDataList: WatchlistItem[] = results.map((item: any) => ({
    guidID: '',
    address: item.baseToken.address,
    chainId: item.chainId,
    dexId: item.dexId,
    changeRate24h: item.priceChange.h24 || 0,
    changeRate5m: item.priceChange.m5 || 0,
    changeRate1h: item.priceChange.h1 || 0,
    changeRate6h: item.priceChange.h6 || 0,
    price: item.priceUsd || 0,
    name: item.baseToken.name,
    symbol: item.baseToken.symbol,
    url: item.url,
    imageUrl: item.info?.imageUrl,
    isPriority: false,
  }));

  watchListDataList.forEach(item => {
    const matchingWatchlistItem = watchlist.find(watchlistItem => watchlistItem.url === item.url);

    if (matchingWatchlistItem) {
      item.imageUrl = matchingWatchlistItem.imageUrl;
      item.guidID = matchingWatchlistItem.guidID;
    }
  });

  return watchListDataList;
};

const fetchData = async () => {
  const storage = await useWatchListStorage.get();
  let updatedData: WatchlistItem[] = [];
  let prioritiesCoin = storage.filter(ele => ele.isPriority == true);
  let coins = storage.filter(ele => ele.isPriority == false);
  for (const coin of prioritiesCoin) {
    let priorityData: WatchlistItem;

    priorityData = await fetchPriorityCoin(coin.symbol, coin);
    if (priorityData !== null) {
      updatedData.push(priorityData);
    }
  }
  let data = await fetchCoinsData(coins);
  updatedData = updatedData.concat(data);
  useWatchListStorage.set(updatedData);
  watchlist = updatedData;
  checkAlarms(updatedData);
};

const checkAlarms = async (data: WatchlistItem[]) => {
  const triggered = (
    await Promise.all(
      data.map(async coin => {
        const threshold = await useThresholdStorage.getThresholdFirstOrDefault(coin.guidID);
        return threshold.active === true && (coin.price >= threshold.upper || coin.price <= threshold.lower)
          ? coin
          : null;
      }),
    )
  ).filter((coin): coin is WatchlistItem => coin !== null); // Type guard for non-null values

  if (triggered.length > 0) {
    notifyUser(triggered);
  }
};

const notifyUser = (triggered: WatchlistItem[]) => {
  triggered.forEach(
    coin => {
      const notificationId = `priceAlert_${Date.now()}`;
      const url = coin.isPriority ? `https://www.kucoin.com/trade/${coin.symbol}-USDT` : coin.url;
      notificationUrls[notificationId] = url;

      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon-34.png'),
        title: `${coin.name} (${coin.symbol}) hit $${formatCustomPrice(Number(coin.price))} 24H: ${Number(coin.changeRate24h) > 0 ? '+' : ''} ${Number(coin.changeRate24h).toFixed(2)}% `,
        message: `Click to redirect to DEX/CEX`,
      });
      useThresholdStorage.removeThreshold(coin.guidID);
    },
    (notificationId: any) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log(`Notification created with ID: ${notificationId}`);
      }
    },
  );
};

chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
  if (message.type === 'FETCH_KUCOIN') {
    const ticker = message.ticker;

    fetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${ticker}-USDT&timestamp=${Date.now()}`)
      .then(res => {
        return res.json();
      })
      .then(res => {
        senderResponse(res);
      });

    return true; // Keep the message channel open for asynchronous response
  } else if (message.type === 'GET_WATCHLIST') {
    senderResponse(watchlist);
    return true;
  } else if (message.type === 'GET_THRESHOLD') {
    const id = message.id;
    const result = useThresholdStorage
      .getThresholdFirstOrDefault(id)
      .then(res => {
        return res;
      })
      .then(res => {
        senderResponse(res);
      });
    return true;
  }
});

chrome.notifications.onClicked.addListener((notificationId: string) => {
  const url = notificationUrls[notificationId];
  if (url) {
    chrome.tabs.create({ url });
    delete notificationUrls[notificationId];
  } else {
    console.error(`No URL found for notification ID: ${notificationId}`);
  }
});

setInterval(fetchData, INTERVAL);
