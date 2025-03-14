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
  guidID: string;
  name: string;
  address: string;
  symbol: string;
  url: string;
  dexId: string;
  chainId: string;
  changeRate24h: string;
  changeRate5m: string;
  changeRate1h: string;
  changeRate6h: string;
  price: string;
  isPriority: boolean;
  imageUrl: string;
};
const WATCHLIST_KEY = 'WATCH_LIST_EXT';
const THRESHOLD_KEY = 'THRESHOLD';

//clear stuff
// chrome.storage.local.clear();

type IWatchListStorage = BaseStorage<WatchlistItem[]> & {
  addToWatchlist: (item: WatchlistItem) => Promise<void>;
  updateWatchlist: (item: WatchlistItem) => Promise<void>;
  removeFromWatchlist: (address: string) => Promise<void>;
  removePriorityFromWatchlist: (name: string) => Promise<void>;
  getWatchlist: () => Promise<WatchlistItem[]>;
};

const watchListStorage = createStorage<WatchlistItem[]>(WATCHLIST_KEY, [], {
  liveUpdate: true, // Enable real-time updates
});

export const useWatchListStorage: IWatchListStorage = {
  ...watchListStorage,
  addToWatchlist: async item => {
    const currentList = await watchListStorage.get();

    const isAlreadyAdded = currentList?.some(
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
    const updatedList = currentList.filter(
      item => (item.name !== name && item.isPriority === true) || !item.isPriority,
    );
    await watchListStorage.set(updatedList);
  },
  getWatchlist: async () => {
    const list = await watchListStorage.get();

    return list;
  },
  updateWatchlist: async (item: WatchlistItem) => {
    const currentList = await watchListStorage.get();

    const updatedList = currentList.map(existingItem =>
      existingItem.guidID === item.guidID ? { ...existingItem, ...item } : existingItem,
    );

    await watchListStorage.set(updatedList);
  },
};

type IThresholdStorage = BaseStorage<Threshold[]> & {
  addThreshold: (item: Threshold) => Promise<void>;
  removeThreshold: (address: string) => Promise<void>;
  getThreshold: () => Promise<Threshold[]>;
  getThresholdFirstOrDefault: (id: string) => Promise<Threshold>;
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
  getThresholdFirstOrDefault: async (id: string) => {
    const currentList = await thresholdStorage.get();
    let threshold = currentList.find(item => item.id === id);
    if (threshold === undefined) {
      threshold = {
        id: id,
        active: false,
        lower: 0,
        upper: 0,
      } as Threshold;
    }
    return threshold;
  },
  updateThreshold: async item => {
    const list = await thresholdStorage.get();
    const itemExists = list.some(threshold => threshold.id === item.id);
    const updatedThresholds = itemExists
      ? list.map(threshold => (threshold.id === item.id ? { ...threshold, ...item } : threshold))
      : [...list, item];
    await thresholdStorage.set(updatedThresholds);
  },
};

export const PRIORITYCHAINLIST: readonly [string, string][] = [
  ['BTC', 'Bitcoin'],
  ['SOL', 'Solana'],
  ['ETH', 'Ethereum'],
  ['SUI', 'SUI'],
  ['BNB', 'Binance Smart Chain'],
  ['PLS', 'Pulse Chain'],
  ['XRP', 'XRPL'],
  ['TON', 'TON Chain'],
  ['S', 'SONIC'],
  ['AVAX', 'Avalanche'],
  ['ARB', 'Arbitrum'],
  ['MATIC', 'Polygon'],
  ['ZK', 'zkSync'],
  ['TRX', 'Tron'],
  ['CRO', 'Cronos'],
  ['APT', 'Aptos'],
  ['ICP', 'ICP'],
  ['OSMO', 'Osmosis'],
  ['FTM', 'Fantom'],
  ['HBAR', 'Hedera'],
  ['ALGO', 'Algorand'],
  ['NEAR', 'NEAR'],
  ['BLAST', 'BLAST'],
  ['OP', 'Optimism'],
  ['INJ', 'Injective'],
  ['APE', 'APE Chain'],
  ['EGLD', 'MultiversX'],
  ['MNT', 'Mantle'],
  ['STRK', 'Starknet'],
  ['VANA', 'VANA'],
  ['ADA', 'Cardano'],
  ['WLD', 'World Chain'],
  ['SEI', 'SEI Chain'],
  ['DOGE', 'Dogechain'],
  ['SCR', 'Scroll'],
  ['BONE', 'Bone Shiba Swap'],
  ['ROSE', 'Oasis Sapphire'],
  ['DOT', 'Polkadot'],
  ['KAVA', 'KAVA'],
  ['GLMR', 'Moonbeam'],
  ['FLR', 'Flare'],
  ['ETHW', 'Ethereum PoW'],
  ['NRG', 'Energi'],
  ['CANTO', 'CANTO'],
  ['CELO', 'CELO'],
  ['ETC', 'Ethereum Classic'],
  ['FRAX', 'Frax Ether'],
  ['BB', 'BounceBit'],
  ['VENOM', 'Venom'],
  ['EVMOS', 'EVMOS'],
  ['DAI', 'Gnosis Chain'],
  ['MOVR', 'Moonriver'],
  ['ASTR', 'Astar Network'],
  ['KCS', 'KCS'],
  ['BOBA', 'BOBA NetWork'],
  ['WAN', 'WAN Chain'],
  ['ZETA', 'ZETA Chain'],
  ['TT', 'ThunderCore (TT)'],
];
