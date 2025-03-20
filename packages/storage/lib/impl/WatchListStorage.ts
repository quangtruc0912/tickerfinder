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
  index: number;
};
const WATCHLIST_KEY = 'WATCH_LIST_EXT';
const THRESHOLD_KEY = 'THRESHOLD';

const defaultWatchlistItem: WatchlistItem = {
  guidID: '',
  name: '',
  address: '',
  symbol: '',
  url: '',
  dexId: '',
  chainId: '',
  changeRate24h: '0',
  changeRate5m: '0',
  changeRate1h: '0',
  changeRate6h: '0',
  price: '0',
  isPriority: false,
  imageUrl: '',
  index: -1, // Default to -1 to indicate it's unset
};

function ensureSetting(obj: Partial<WatchlistItem>): WatchlistItem {
  return {
    ...defaultWatchlistItem,
    ...obj,
  };
}

type IWatchListStorage = BaseStorage<WatchlistItem[]> & {
  addToWatchlist: (item: WatchlistItem) => Promise<void>;
  updateWatchlist: (item: WatchlistItem) => Promise<void>;
  removeFromWatchlist: (address: string) => Promise<void>;
  removePriorityFromWatchlist: (name: string) => Promise<void>;
  getWatchlist: () => Promise<WatchlistItem[]>;
  maxIndex: () => Promise<number>;
  ensureSetting: () => Promise<void>;
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
  maxIndex: async () => {
    const list = await watchListStorage.get();

    if (!list || list.length === 0) {
      return -1; // Return -1 if the list is empty or null
    }

    const maxIndex = list.reduce((max, watchList) => (watchList.index > max.index ? watchList : max), list[0]);

    return maxIndex.index;
  },
  ensureSetting: async () => {
    let list = await watchListStorage.get();
    list = list.map((item, i) => ({
      ...ensureSetting(item),
      index: i,
    }));
    chrome.storage.local.remove('WATCH_LIST_EXT', async () => {});

    chrome.storage.local.set({ WATCH_LIST_EXT: list });
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

[
  {
    address: '',
    chainId: '',
    changeRate1h: '0',
    changeRate24h: '-1.02',
    changeRate5m: '0',
    changeRate6h: '0',
    dexId: '',
    guidID: '120c043c-f719-4f15-872f-5326184e9afe',
    imageUrl: 'content/BTC.svg',
    isPriority: true,
    name: 'Bitcoin',
    price: '82524.8',
    symbol: 'BTC',
    url: '',
  },
  {
    address: '',
    chainId: '',
    changeRate1h: '0',
    changeRate24h: '-1.03',
    changeRate5m: '0',
    changeRate6h: '0',
    dexId: '',
    guidID: '4ea6bd60-7bf7-4814-ad28-65e7fff2cdf2',
    imageUrl: 'content/ETH.svg',
    isPriority: true,
    name: 'Ethereum',
    price: '1890.98',
    symbol: 'ETH',
    url: '',
  },
  {
    address: '',
    chainId: '',
    changeRate1h: '0',
    changeRate24h: '-4.4799999999999995',
    changeRate5m: '0',
    changeRate6h: '0',
    dexId: '',
    guidID: '3806935d-9991-42bd-a851-e920e8265a6a',
    imageUrl: 'content/SOL.svg',
    isPriority: true,
    name: 'Solana',
    price: '123.237',
    symbol: 'SOL',
    url: '',
  },
  {
    address: '',
    chainId: '',
    changeRate1h: '0',
    changeRate24h: '0.16',
    changeRate5m: '0',
    changeRate6h: '0',
    dexId: '',
    guidID: '225a573b-7787-48da-a1b9-086327bff69e',
    imageUrl: 'content/BNB.svg',
    isPriority: true,
    name: 'Binance Smart Chain',
    price: '631.158',
    symbol: 'BNB',
    url: '',
  },
  {
    address: '0x0d01dc56dcaaca66ad901c959b4011ec',
    chainId: 'hyperliquid',
    changeRate1h: -1.33,
    changeRate24h: -3.91,
    changeRate5m: -0.37,
    changeRate6h: 1.27,
    dexId: 'hyperliquid',
    guidID: '8e3a2850-4507-433f-89c7-632c89f67dfe',
    imageUrl: 'https://dd.dexscreener.com/ds-data/tokens/hyperliquid/0x0d01dc56dcaaca66ad901c959b4011ec.png?key=4ba426',
    isPriority: false,
    name: 'HYPE',
    price: '13.25',
    symbol: 'HYPE',
    url: 'https://dexscreener.com/hyperliquid/0x13ba5fea7078ab3798fbce53b4d0721c',
  },
  {
    address: '0xFeAc2Eae96899709a43E252B6B92971D32F9C0F9',
    chainId: 'ethereum',
    changeRate1h: -0.34,
    changeRate24h: -1.53,
    changeRate5m: -0.06,
    changeRate6h: -3.49,
    dexId: 'uniswap',
    guidID: 'ccc753d4-2e11-4206-9ef8-6131b17700cb',
    imageUrl:
      'https://dd.dexscreener.com/ds-data/tokens/ethereum/0xfeac2eae96899709a43e252b6b92971d32f9c0f9.png?key=7c0749',
    isPriority: false,
    name: 'ANyONe Protocol',
    price: '0.3184',
    symbol: 'ANYONE',
    url: 'https://dexscreener.com/ethereum/0xc593fe9193b745447e86b45ea0bf62565ee030cc',
  },
  {
    address: '0x86Bb94DdD16Efc8bc58e6b056e8df71D9e666429',
    chainId: 'bsc',
    changeRate1h: -2.09,
    changeRate24h: 3.97,
    changeRate5m: -0.06,
    changeRate6h: 10.16,
    dexId: 'pancakeswap',
    guidID: '784978a7-d136-4744-a1e5-7587f5aa2fa4',
    imageUrl: 'https://dd.dexscreener.com/ds-data/tokens/bsc/0x86bb94ddd16efc8bc58e6b056e8df71d9e666429.png?key=a3d266',
    isPriority: false,
    name: 'Test',
    price: '0.07514',
    symbol: 'TST',
    url: 'https://dexscreener.com/bsc/0xb36c81707e5ca2bd6f68cd6b71b3178d29c48a4b',
  },
];
