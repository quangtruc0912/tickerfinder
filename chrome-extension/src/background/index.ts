import 'webextension-polyfill';
import {
  WatchlistItem,
  useWatchListStorage,
  Threshold,
  useThresholdStorage,
  coinGeckoStorage,
  CoinGeckoContractAddress,
  KuCoinData,
  KuCoinStorage,
  settingStorage,
  tokenBalanceStorage,
  TokenBalanceData,
  PRIORITYCHAINLIST,
  WATCHLIST_KEY,
} from '@extension/storage';

let isSidePanelOpen = false; // Track whether the side panel is open
const INIT = ['BTC', 'SOL', 'ETH'];

const INTERVAL = 5000;

const BLOCKSCOUTINTERVAL = 10000; // 10sec
const COINGECKOINTERVAL = 3600000; // 1 HOUR
const SYNCINTERVAL = 300000; // 1 HOUR

let watchlist: WatchlistItem[] = [];
let tokensBalance: TokenBalanceData[] = [];

let isFetching = false;
let isPendingUpdate = false;
let pendingAdditions: WatchlistItem[] = [];
let pendingUpdateIndexes: WatchlistItem[] = [];
let pendingDeletions: string[] = [];
let pendingPriorityDeletions: string[] = [];

let pendingSyncData: WatchlistSyncData | null = null;

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
    imageUrl: watchlist.imageUrl,
    isPriority: true,
    changeRate5m: '0',
    changeRate1h: '0',
    changeRate6h: '0',
    index: watchlist.index,
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
    address: item?.baseToken?.address,
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
    index: item?.index,
  }));

  watchListDataList.forEach(item => {
    const matchingWatchlistItem = watchlist.find(watchlistItem => watchlistItem.url === item.url);

    if (matchingWatchlistItem) {
      item.imageUrl = matchingWatchlistItem.imageUrl;
      item.guidID = matchingWatchlistItem.guidID;
      item.index = matchingWatchlistItem.index;
    }
  });

  return watchListDataList;
};

const fetchData = async () => {
  if (isFetching) {
    isPendingUpdate = false; // Mark that we need to re-run fetchData
    return;
  }

  isFetching = true;
  isPendingUpdate = false; // Reset pending update flag
  try {
    let storage = await useWatchListStorage.get();

    if (pendingDeletions.length > 0) {
      storage = storage.filter(item => !pendingDeletions.includes(item.url));
    }

    if (pendingPriorityDeletions.length > 0) {
      storage = storage.filter(item => !(pendingPriorityDeletions.includes(item.name) && item.isPriority));
    }

    if (pendingAdditions.length > 0) {
      const maxIndex = storage.length > 0 ? Math.max(...storage.map(item => item.index || 0)) : -1;
      pendingAdditions.forEach((item, i) => {
        item.index = maxIndex + 1 + i;
      });
      storage = storage.concat(pendingAdditions);
    }

    if (pendingUpdateIndexes.length > 0) {
      // Replace storage with the latest full list from pendingUpdates
      const latestUpdate = pendingUpdateIndexes.slice(-storage.length); // Take the last full list
      if (latestUpdate.length === storage.length) {
        storage = latestUpdate.map(item => ({ ...item })); // Use the full list
      } else {
        // Handle partial updates if any
        pendingUpdateIndexes.forEach(update => {
          const currentIdx = storage.findIndex(item => item.guidID === update.guidID);
          if (currentIdx !== -1 && update.index !== undefined) {
            const newIndex = Math.max(0, Math.min(update.index, storage.length - 1));
            storage[currentIdx].index = newIndex;
            const [movedItem] = storage.splice(currentIdx, 1);
            storage.splice(newIndex, 0, movedItem);
            storage.forEach((item, i) => {
              item.index = i;
            });
          }
        });
      }
    }

    if (
      pendingAdditions.length > 0 ||
      pendingDeletions.length > 0 ||
      pendingPriorityDeletions.length > 0 ||
      pendingUpdateIndexes.length > 0
    ) {
      throttleSaveWatchlist({ cryptoWatchlist: storage, lastUpdated: Date.now() });
      pendingDeletions = [];
      pendingPriorityDeletions = [];
      pendingAdditions = [];
      pendingUpdateIndexes = [];
    }

    storage.sort((a, b) => (a.index || 0) - (b.index || 0));

    let updatedData: WatchlistItem[] = [];
    let prioritiesCoin = storage.filter(ele => ele.isPriority);
    let coins = storage.filter(ele => !ele.isPriority);

    for (const coin of prioritiesCoin) {
      let priorityData = await fetchPriorityCoin(coin.symbol, coin);
      if (priorityData !== null) {
        updatedData.push({ ...coin, ...priorityData, price: String(priorityData.price) });
      }
    }

    let data = await fetchCoinsData(coins);
    updatedData = updatedData.concat(data.map(item => ({ ...item, price: String(item.price) })));

    updatedData.sort((a, b) => (a.index || 0) - (b.index || 0));

    await useWatchListStorage.set(updatedData);
    watchlist = updatedData;
    checkAlarms(updatedData);
    settingStorage.setLastFetchWatchList(Date.now());
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isFetching = false;
    if (
      isPendingUpdate ||
      pendingUpdateIndexes.length > 0 ||
      pendingAdditions.length > 0 ||
      pendingDeletions.length > 0 ||
      pendingPriorityDeletions.length > 0
    ) {
      fetchData();
    }
  }
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

chrome.runtime.onMessage.addListener(
  (
    message: {
      type: string;
      ticker?: string;
      id?: string;
      name?: string;
      item?: WatchlistItem;
      items?: WatchlistItem[];
    },
    _sender,
    senderResponse: (response: any) => void,
  ) => {
    const { type, ticker, id, name, item, items } = message;

    switch (type) {
      case 'FETCH_KUCOIN':
        fetchKucoinData(ticker!, senderResponse);
        return true;

      case 'GET_WATCHLIST':
        senderResponse(watchlist);
        return true;

      case 'GET_THRESHOLD':
        fetchThreshold(id!, senderResponse);
        return true;

      case 'btn_side_panel':
        openSidePanel();
        return true;

      case 'open_options':
        chrome.runtime.openOptionsPage();
        return true;

      case 'COINGECKO_IMAGE':
        fetchCoingeckoImage(id!, senderResponse);
        return true;

      case 'UPDATE_ADDRESS':
        forceUpdate(senderResponse);
        return true;

      // New cases added below:
      case 'ADD_TO_WATCHLIST':
        if (item) {
          addToWatchlist(item);
        }
        return true;

      case 'REMOVE_FROM_WATCHLIST':
        if (id) {
          removeFromWatchlist(id);
        }
        return true;

      case 'REMOVE_PRIORITY_FROM_WATCHLIST':
        if (name) {
          removePriorityFromWatchlist(name);
        }
        return true;
      case 'UPDATE_INDEX_WATCHLIST':
        if (items) {
          updateIndexWatchList(items); // Pass the full array
          senderResponse({ success: true });
        }
        return true;

      default:
        return true;
    }
  },
);
const updateIndexWatchList = async (items: WatchlistItem[]) => {
  if (isFetching) {
    pendingUpdateIndexes.push(...items.map(item => ({ ...item })));
  } else {
    await useWatchListStorage.set(items);
  }
};

const addToWatchlist = async (item: WatchlistItem) => {
  if (isFetching) {
    pendingAdditions.push(item);
  } else {
    await useWatchListStorage.addToWatchlist(item);
  }
};

const removeFromWatchlist = async (address: string) => {
  if (isFetching) {
    pendingDeletions.push(address);
  } else {
    await useWatchListStorage.removeFromWatchlist(address);
  }
};

const removePriorityFromWatchlist = async (name: string) => {
  if (isFetching) {
    pendingPriorityDeletions.push(name);
  } else {
    await useWatchListStorage.removePriorityFromWatchlist(name);
  }
};

async function forceUpdate(senderResponse: (response: any) => void) {
  fetchBlockScoutData();
  senderResponse({ message: 'Forced update' });
}
function openSidePanel() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.storage.local.set({ selectedTab: 0 });
    if (isSidePanelOpen) {
      chrome.sidePanel.setOptions({
        enabled: false, // Disables the side panel
      });
      isSidePanelOpen = false;
    } else {
      chrome.sidePanel.setOptions({
        enabled: true, // Disables the side panel
      });
      chrome.sidePanel.open({ windowId: tab.windowId });
      isSidePanelOpen = true;
    }
  });
}

async function fetchKucoinData(ticker: string, senderResponse: (response: any) => void) {
  try {
    const response = await fetch(
      `https://api.kucoin.com/api/v1/market/stats?symbol=${ticker}-USDT&timestamp=${Date.now()}`,
    );

    const data = await response.json();
    senderResponse(data);
  } catch (error) {
    senderResponse({ error: 'Failed to fetch KuCoin data' });
  }
  return true; // Keep the message channel open for async response
}

// Fetch Threshold from storage
async function fetchThreshold(id: string, senderResponse: (response: any) => void) {
  try {
    const result = await useThresholdStorage.getThresholdFirstOrDefault(id);
    senderResponse(result);
  } catch (error) {
    senderResponse({ error: 'Failed to fetch threshold' });
  }
  return true;
}

// Fetch Coingecko Image Data
async function fetchCoingeckoImage(id: string, senderResponse: (response: any) => void) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
    );
    const data = await response.json();
    senderResponse(data);
  } catch (error) {
    senderResponse({ error: 'Failed to fetch Coingecko image' });
  }
  return true;
}

chrome.notifications.onClicked.addListener((notificationId: string) => {
  const url = notificationUrls[notificationId];
  if (url) {
    chrome.tabs.create({ url });
    delete notificationUrls[notificationId];
  } else {
    console.error(`No URL found for notification ID: ${notificationId}`);
  }
});

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function findInPriorityChainList(search: string): [string, string] | null {
  const result = PRIORITYCHAINLIST.find(([key, value]) => key === search || value === search);
  return result || null; // Return null if not found
}
chrome.runtime.onInstalled.addListener(async details => {
  chrome.contextMenus.create({
    id: 'rightClickAlert',
    title: 'Display Price',
    contexts: ['selection'],
  });
  console.log('Extension installed for the first time!');
  if (details.reason === 'install') {
    for (const coin of INIT) {
      let index = 0;
      const findResult = findInPriorityChainList(coin);
      let uuid = generateUUID();
      if (findResult) {
        await useWatchListStorage.addToWatchlist({
          guidID: uuid,
          address: '',
          isPriority: true,
          name: findResult[1],
          symbol: findResult[0],
          url: '',
          dexId: '',
          chainId: '',
          changeRate24h: '0',
          price: '0',
          imageUrl: `content/${coin.toUpperCase()}.svg`,
          changeRate5m: '0',
          changeRate1h: '0',
          changeRate6h: '0',
          index: index,
        });
        index++;
      }
    }
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    chrome.storage.local.remove('COINGECKOCA', () => {
      console.log('Key COINGECKOCA removed from local storage.');
    });
    chrome.storage.local.remove('KUCOINDATA', () => {
      console.log('Key KUCOINDATA removed from local storage.');
    });
    const fileResponse = await fetch(chrome.runtime.getURL('content/kucoin_coingecko_resolved.json'));
    const combinedData: KuCoinData[] = await fileResponse.json();
    KuCoinStorage.setData(combinedData);
    settingStorage.ensureSetting();
    chrome.storage.local.set({ selectedTab: 1 });
    await DataCorrection();
  }
});

const DataCorrection = async (): Promise<void> => {
  await useWatchListStorage.ensureSetting();
};
chrome.commands.onCommand.addListener(async command => {
  if (command === 'toggle_side_panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (isSidePanelOpen) {
        chrome.storage.local.get(['selectedTab'], result => {
          if (result.selectedTab === 0) {
            chrome.storage.local.set({ selectedTab: 1 });
            chrome.runtime.sendMessage({ tab: 1 });
          } else {
            chrome.sidePanel.setOptions({
              enabled: false, // Disables the side panel
            });
            isSidePanelOpen = false;
          }
        });
      } else {
        chrome.sidePanel.setOptions({
          enabled: true,
        });
        chrome.sidePanel.open({ windowId: tab.windowId });
        isSidePanelOpen = true;
        chrome.storage.local.set({ selectedTab: 0 });
        chrome.runtime.sendMessage({ tab: 0 });
      }
    });
  }
});

chrome.tabs.onCreated.addListener(tab => {
  if (tab.pendingUrl === 'chrome://newtab/' || tab.url === 'chrome://newtab/') {
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rightClickAlert' && tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: highlightSelection,
    });
  }
});

function highlightSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  const span = document.createElement('span');
  span.style.backgroundColor = '#add8e6';
  const text = '$' + selection.toString();
  span.dataset.popupText = text ?? undefined;
  span.dataset['__TICKER_PROCESSED'] = '1';
  span.textContent = text;

  range.deleteContents();
  range.insertNode(span);
}

const processAssets = (assets: any[]): CoinGeckoContractAddress[] => {
  return assets.map(asset => {
    const uniqueContracts = Array.from(
      new Set(Object.values(asset.platforms).map(contract => (contract as string).toLowerCase())),
    );

    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      contracts: uniqueContracts,
    };
  });
};

const fetchCoinGeckoData = async () => {
  const url = `https://api.coingecko.com//api/v3/coins/list?include_platform=true`;
  const response = await fetch(url);
  let data = await response.json();
  const contractAddresses = processAssets(data);
  coinGeckoStorage.setContractAddress(contractAddresses);
};

const fetchBlockScoutData = async () => {
  const setting = await settingStorage.getSetting();
  if (setting.address === '') {
    tokenBalanceStorage.removeAllTokenBalance();
    return;
  }
  const url = `https://eth.blockscout.com/api/v2/addresses/${setting.address}/token-balances`;
  let response = await fetch(url);

  let data = (await response.json()) as TokenBalanceData[];
  const nativeUrl = `https://eth.blockscout.com/api/v2/addresses/${setting.address}`;
  let tokenNativeResponse = await fetch(nativeUrl);
  let nativeTokenData = (await tokenNativeResponse.json()) as any;

  let nativeTokenBalance = await mapTokenBalance(nativeTokenData);

  let updatedList = filterTokensBalance(data);
  updatedList.push(nativeTokenBalance);
  tokensBalance = updatedList;

  tokenBalanceStorage.updateTokensBalance(tokensBalance);
  settingStorage.setLastFetchCoinBalance(Date.now());
};

const mapTokenBalance = async (data: any) => {
  const watchListNative = watchlist.find(item => item.symbol === 'ETH' && item.name === 'Ethereum');
  let changeRate = 0;
  if (watchListNative === undefined) {
    const url = `https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT&timestamp=${Date.now()}`;
    let response = await fetch(url);
    let responseData = (await response.json()) as any;
    changeRate = responseData.data.changeRate * 100;
  }
  return {
    token: {
      address: '1',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: '18',
      exchange_rate: data.exchange_rate,
      icon_url: chrome.runtime.getURL('content/ETH.svg'),
    },
    value: data.coin_balance,
    token_cex: {
      exchange_rate: data.exchange_rate,
      change_24h: watchListNative ? watchListNative.changeRate24h : changeRate,
    },
  } as TokenBalanceData;
};

const filterTokensBalance = (data: TokenBalanceData[]) => {
  // Filter out tokens where exchangeRate is null
  const filteredItems = data.filter(token => token.token.exchange_rate !== null);

  const newTokenAddresses = new Set(filteredItems.map(token => token.token.address));

  const currentMap = new Map(tokensBalance.map(token => [token.token.address, token]));

  for (const newToken of filteredItems) {
    const tokenAddress = newToken.token.address;

    if (currentMap.has(tokenAddress)) {
      currentMap.get(tokenAddress)!.value = newToken.value;
    } else {
      currentMap.set(tokenAddress, newToken);
    }
  }

  for (const storedTokenAddress of currentMap.keys()) {
    if (!newTokenAddresses.has(storedTokenAddress)) {
      currentMap.delete(storedTokenAddress);
    }
  }

  const updatedList = Array.from(currentMap.values());
  return updatedList;
};

const fetchTokenBalance = async () => {
  tokensBalance = await tokenBalanceStorage.get();
};

interface WatchlistSyncData {
  cryptoWatchlist: WatchlistItem[];
  lastUpdated: number | null; // null if no data yet
}

// Save with sync fallback
function saveWatchlist(data: WatchlistSyncData): void {
  chrome.storage.sync.set(data, () => {
    if (chrome.runtime.lastError) {
      console.warn('Sync failed:', chrome.runtime.lastError.message);
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.error('Local save failed:', chrome.runtime.lastError.message);
        } else {
          console.log('Saved to local as fallback:', data);
        }
      });
    } else {
      console.log('Saved to sync:', data);
    }
  });
}

function loadWatchlist(callback: (result: WatchlistSyncData) => void): void {
  chrome.storage.sync.get(['cryptoWatchlist', 'lastUpdated'], (syncResult: Partial<WatchlistSyncData>) => {
    if (chrome.runtime.lastError || !syncResult.cryptoWatchlist) {
      console.warn('Sync unavailable or empty:', chrome.runtime.lastError?.message);
      chrome.storage.local.get(['cryptoWatchlist', 'lastUpdated'], (localResult: Partial<WatchlistSyncData>) => {
        if (localResult.cryptoWatchlist) {
          console.log('Loaded from local:', localResult);
          callback({
            cryptoWatchlist: localResult.cryptoWatchlist,
            lastUpdated: localResult.lastUpdated || null,
          });
        } else {
          console.log('No watchlist found.');
          callback({ cryptoWatchlist: [], lastUpdated: null });
        }
      });
    } else {
      console.log('Loaded from sync:', syncResult);
      callback({
        cryptoWatchlist: syncResult.cryptoWatchlist,
        lastUpdated: syncResult.lastUpdated || null,
      });
    }
  });
}

interface WatchlistDataWithTrigger extends WatchlistSyncData {
  syncTrigger?: number; // Optional trigger field
}

function triggerManualSync(data: WatchlistSyncData): void {
  const dataWithTrigger: WatchlistDataWithTrigger = {
    ...data,
    syncTrigger: Date.now(), // New timestamp to force a change
  };
  chrome.storage.sync.set(dataWithTrigger, () => {
    console.log('Manual sync triggered with timestamp:', dataWithTrigger);
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && 'cryptoWatchlist' in changes) {
    const newData = changes.cryptoWatchlist.newValue as WatchlistItem[];
    const trigger = (changes.syncTrigger?.newValue as number) || 0;
    console.log('Sync detected, trigger time:', new Date(trigger), 'data:', newData);
  }
});

function throttleSaveWatchlist(data: WatchlistSyncData) {
  pendingSyncData = data;
}

// saveWatchlist({ cryptoWatchlist: watchlist, lastUpdated: Date.now() });
// loadWatchlist((result: WatchlistData) => {
//   console.log("Current watchlist:", result.cryptoWatchlist);
//   console.log("Last updated:", result.lastUpdated ? new Date(result.lastUpdated) : "Never");
// });

fetchTokenBalance();
fetchCoinGeckoData();

setInterval(fetchData, INTERVAL);
setInterval(fetchCoinGeckoData, COINGECKOINTERVAL);
setInterval(fetchBlockScoutData, BLOCKSCOUTINTERVAL);
setInterval(() => {
  if (pendingSyncData) {
    saveWatchlist(pendingSyncData);
    pendingSyncData = null; // Clear after saving
  }
}, SYNCINTERVAL); // Save every 5 minutes
