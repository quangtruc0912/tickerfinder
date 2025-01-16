import { useState, useEffect } from 'react';
import { Pair } from '@extension/shared';
import { WatchlistItem } from '@extension/storage';

interface SidePanelData {
  name: string;
  address: string;
  symbol: string;
  url: string;
  dexId: string;
  chainId: string;
  changeRate24h: number;
  price: number;
  isPriority: boolean;
  imageUrl: string;
}

const fetchPriorityCoin = async (symbol: string, watchlist: WatchlistItem): Promise<SidePanelData> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'FETCH_KUCOIN', ticker: symbol }, response => {
      if (response?.data) {
        const data: SidePanelData = {
          address: watchlist.address,
          chainId: watchlist.chainId,
          dexId: watchlist.dexId,
          changeRate24h: response.data.changeRate,
          price: response.data.sell,
          name: watchlist.name,
          symbol: watchlist.symbol,
          url: watchlist.url,
          imageUrl: `content/${watchlist.ticker.toUpperCase()}.svg`,
          isPriority: true,
        };
        resolve(data);
      } else {
        console.error('Error:', response?.error || 'Unknown error');
        reject(new Error(response?.error || 'Failed to fetch data'));
      }
    });
  });
};

const fetchCoinsData = async (watchlist: WatchlistItem[]) => {
  const tokenAddresses = watchlist.map(item => item.address).join(',');
  const urlList = watchlist.map(item => item.url);
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(tokenAddresses)}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
  });

  const data = await res.json();

  const updatedPairs = data.pairs.filter((item: any) => urlList.includes(item.url));

  const sidePanelDataList: SidePanelData[] = updatedPairs.map((item: any) => ({
    address: item.baseToken.address,
    chainId: item.chainId,
    dexId: item.dexId,
    changeRate24h: item.priceChange.h24 || 0,
    price: item.priceUsd || 0,
    name: item.baseToken.name,
    symbol: item.baseToken.symbol,
    url: item.url,
    imageUrl: item.info?.imageUrl,
    isPriority: false,
  }));

  sidePanelDataList.forEach(item => {
    const matchingWatchlistItem = watchlist.find(watchlistItem => watchlistItem.url === item.url);

    if (matchingWatchlistItem) {
      item.imageUrl = matchingWatchlistItem.imageUrl;
    }
  });

  return sidePanelDataList;
};

export const useCoinData = (watchlist: WatchlistItem[]) => {
  const [coinData, setCoinData] = useState<SidePanelData[]>([]);

  useEffect(() => {
    if (watchlist.length === 0) return;

    const fetchData = async () => {
      let updatedData: SidePanelData[] = [];
      let prioritiesCoin = watchlist.filter(ele => ele.isPriority == true);
      let coins = watchlist.filter(ele => ele.isPriority == false);
      for (const coin of prioritiesCoin) {
        let priorityData: SidePanelData;

        priorityData = await fetchPriorityCoin(coin.ticker, coin);
        if (priorityData !== null) {
          updatedData.push(priorityData);
        }
      }
      let data = await fetchCoinsData(coins);

      updatedData = updatedData.concat(data);

      setCoinData(updatedData);
    };

    // Fetch data immediately and then every 5 seconds
    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [watchlist]);

  return coinData;
};
