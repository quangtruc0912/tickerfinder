import 'webextension-polyfill';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { WatchlistItem, useWatchListStorage } from '@extension/storage';

const INTERVAL = 5000;
let watchlist: WatchlistItem[] = [];

const fetchPriorityCoin = async (symbol: string, watchlist: WatchlistItem) => {
  const res = await fetch(`https://api.kucoin.com/api/v1/market/stats?symbol=${symbol}-USDT`);
  const jsonData = await res.json();
  return {
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
    thresholds: { lower: 0, upper: 0 },
  } as WatchlistItem;
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

  const watchListlDataList: WatchlistItem[] = updatedPairs.map((item: any) => ({
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
    thresholds: { lower: 0, upper: 0 },
  }));

  watchListlDataList.forEach(item => {
    const matchingWatchlistItem = watchlist.find(watchlistItem => watchlistItem.url === item.url);

    if (matchingWatchlistItem) {
      item.imageUrl = matchingWatchlistItem.imageUrl;
    }
  });

  return watchListlDataList;
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
};

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
  } else if (message.type === 'GET_WATCHLIST') {
    senderResponse(watchlist);
    return true;
  }
});

setInterval(fetchData, INTERVAL);
