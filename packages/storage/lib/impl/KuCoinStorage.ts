import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

export type KuCoinData = {
  symbol: string;
  name: string;
  image: string;
};

type IKuCoinStorage = BaseStorage<KuCoinData[]> & {
  setData: (data: KuCoinData[]) => Promise<void>;
  getAllData: () => Promise<KuCoinData[]>;
  getContractAddressBySymbol: (input: string) => Promise<KuCoinData | null>;
};

const storage = createStorage<KuCoinData[]>('KUCOINDATA', [], {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

let contractAddressIndex: { [key: string]: KuCoinData } = {};

const buildIndex = async () => {
  const result = await storage.get();
  contractAddressIndex = result.reduce(
    (acc, item) => {
      acc[item.symbol.toLowerCase()] = item;
      return acc;
    },
    {} as { [key: string]: KuCoinData },
  );
};

export const KuCoinStorage: IKuCoinStorage = {
  ...storage,

  setData: async (data: KuCoinData[]) => {
    await storage.set(data);
    await buildIndex(); // Rebuild the index after setting new data
  },

  getAllData: async () => {
    const result = await storage.get();
    return result;
  },

  getContractAddressBySymbol: async (input: string) => {
    if (Object.keys(contractAddressIndex).length === 0) {
      await buildIndex(); // Build the index if it hasn't been built yet
    }
    return contractAddressIndex[input.toLowerCase()] || null;
  },
};

// Initialize the index when the module is loaded
buildIndex();
