import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

type Threshold = {
  upper: number;
  lower: number;
};

export type WatchlistItem = {
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
  thresholds: Threshold;
};
const WATCHLIST_KEY = 'watchlist';

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
