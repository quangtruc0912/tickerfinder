import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type CoinGeckoContractAddress = {
  id: string;
  symbol: string;
  name: string;
  contracts: string[];
};

type ICoinGeckoStorage = BaseStorage<CoinGeckoContractAddress[]> & {
  setContractAddress: (data: CoinGeckoContractAddress[]) => Promise<void>;
  getAllContractAddress: () => Promise<CoinGeckoContractAddress[]>;
  getContractAddressByTicker: (input: string) => Promise<CoinGeckoContractAddress | null>;
};

const storage = createStorage<CoinGeckoContractAddress[]>('COINGECKOCA', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

let contractAddressIndex: { [key: string]: CoinGeckoContractAddress } = {};

const buildIndex = async () => {
  const result = await storage.get();
  contractAddressIndex = result.reduce(
    (acc, item) => {
      acc[item.symbol.toLowerCase()] = item;
      return acc;
    },
    {} as { [key: string]: CoinGeckoContractAddress },
  );
};

export const coinGeckoStorage: ICoinGeckoStorage = {
  ...storage,

  setContractAddress: async (data: CoinGeckoContractAddress[]) => {
    await storage.set(data);
    await buildIndex(); // Rebuild the index after setting new data
  },

  getAllContractAddress: async () => {
    const result = await storage.get();
    return result;
  },

  getContractAddressByTicker: async (input: string) => {
    if (Object.keys(contractAddressIndex).length === 0) {
      await buildIndex(); // Build the index if it hasn't been built yet
    }
    return contractAddressIndex[input.toLowerCase()] || null;
  },
};

// Initialize the index when the module is loaded
buildIndex();
