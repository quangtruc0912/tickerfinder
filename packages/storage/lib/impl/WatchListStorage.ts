import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type Threshold = {
  id: string;
  active: boolean;
  upper: number | string;
  lower: number | string;
};

export type WatchlistItem = {
  id: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  dexId: string;
  chainId: string;
  changeRate24h: string;
  price: string;
  isPriority: boolean;
  imageUrl: string;
};
const WATCHLIST_KEY = 'watchlist';
const THRESHOLD_KEY = 'THRESHOLD';

//clear stuff
// chrome.storage.local.clear();

type IWatchListStorage = BaseStorage<WatchlistItem[]> & {
  addToWatchlist: (item: WatchlistItem) => Promise<void>;
  removeFromWatchlist: (address: string) => Promise<void>;
  removePriorityFromWatchlist: (name: string) => Promise<void>;
  getWatchlist: () => Promise<WatchlistItem[]>;
};

const watchListStorage = createStorage<WatchlistItem[]>(WATCHLIST_KEY, [], {
  liveUpdate: true, // Enable real-time updates
  serialization: {
    serialize: (data: WatchlistItem[]) => JSON.stringify(data), // Serialize to JSON
    deserialize: (data: string) => (data ? JSON.parse(data) : []), // Deserialize from JSON
  },
});

export const useWatchListStorage: IWatchListStorage = {
  ...watchListStorage,
  addToWatchlist: async item => {
    const currentList = await watchListStorage.get();
    const isAlreadyAdded = currentList.some(
      existingItem =>
        (existingItem.url === item.url && item.isPriority === false && item.url != '') ||
        (existingItem.name === item.name && item.isPriority === true),
    );

    if (!isAlreadyAdded) {
      await watchListStorage.set([...currentList, item]);
    }
  },
  removeFromWatchlist: async url => {
    const currentList = await watchListStorage.get();
    const updatedList = currentList.filter(item => item.url !== url);

    await watchListStorage.set(updatedList);
  },
  removePriorityFromWatchlist: async name => {
    const currentList = await watchListStorage.get();
    const updatedList = currentList.filter(item => item.name !== name && !item.isPriority);
    await watchListStorage.set(updatedList);
  },
  getWatchlist: async () => {
    const list = await watchListStorage.get();

    return list;
  },
};

type IThresholdStorage = BaseStorage<Threshold[]> & {
  addThreshold: (item: Threshold) => Promise<void>;
  removeThreshold: (address: string) => Promise<void>;
  getThreshold: () => Promise<Threshold[]>;
  updateThreshold: (item: Threshold) => Promise<void>;
};

const thresholdStorage = createStorage<Threshold[]>(THRESHOLD_KEY, [], {
  liveUpdate: true, // Enable real-time updates
  serialization: {
    serialize: (data: Threshold[]) => JSON.stringify(data), // Serialize to JSON
    deserialize: (data: string) => (data ? JSON.parse(data) : []), // Deserialize from JSON
  },
});

export const useThresholdStorage: IThresholdStorage = {
  ...thresholdStorage,
  addThreshold: async item => {
    const currentList = await thresholdStorage.get();
    const isAlreadyAdded = currentList.some(existingItem => existingItem.id === item.id);

    if (!isAlreadyAdded) {
      await thresholdStorage.set([...currentList, item]);
    }
  },
  removeThreshold: async id => {
    const currentList = await thresholdStorage.get();
    const updatedList = currentList.filter(item => item.id !== id);

    await thresholdStorage.set(updatedList);
  },
  getThreshold: async () => {
    const list = await thresholdStorage.get();

    return list;
  },
  updateThreshold: async item => {
    const list = await thresholdStorage.get();
    const updatedThresholds = list.map(threshold => (threshold.id === item.id ? { ...threshold, ...item } : threshold));
    await thresholdStorage.set(updatedThresholds);
  },
};
