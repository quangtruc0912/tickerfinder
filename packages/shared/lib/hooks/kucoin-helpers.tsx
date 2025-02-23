import { useState, useEffect, useMemo } from 'react';
import { PriorityPair } from '../models/ticker';
import { KuCoinStorage, KuCoinData } from '@extension/storage';

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

export function findInPriorityChainList(search: string): [string, string] | null {
  const result = PRIORITYCHAINLIST.find(([key, value]) => key === search || value === search);
  return result || null; // Return null if not found
}

export function useKucoin(ticker: string) {
  const [state, setState] = useState<{ data: PriorityPair; isLoading: boolean }>({
    data: {
      ticker: '',
      name: '',
      time: 0,
      symbol: '',
      buy: '',
      sell: '',
      changeRate: '',
      changePrice: '',
      high: '',
      low: '',
      vol: '',
      volValue: '',
      last: '',
      averagePrice: '',
      takerFeeRate: '',
      makerFeeRate: '',
      takerCoefficient: '',
      makerCoefficient: '',
    },
    isLoading: true,
  });

  const updateState = (data: PriorityPair | null) => {
    setState(state => ({
      data: data ? data : state.data,
      isLoading: false,
    }));
  };

  const [allKucoinData, setAllKucoinData] = useState<KuCoinData[]>([]);
  useEffect(() => {
    const fetchAllKucoinData = async () => {
      const result = await KuCoinStorage.getAllData();
      setAllKucoinData(result);
    };

    fetchAllKucoinData();
  }, []);

  const memoizedContractAddresses = useMemo(() => allKucoinData, [allKucoinData]);
  const memoizedTicker = useMemo(() => ticker.toUpperCase(), [ticker]);

  async function init() {
    try {
      ticker = ticker.toUpperCase();
      const findResult = findInPriorityChainList(ticker);
      const data = memoizedContractAddresses.find(item => item.symbol.toLowerCase() === ticker.toLowerCase());
      if (findResult || data != null) {
        chrome.runtime.sendMessage({ type: 'FETCH_KUCOIN', ticker }, response => {
          if (response.data) {
            if (response.data.buy != null) {
              response.data.ticker = findResult ? findResult[0] : data?.symbol;
              response.data.name = findResult ? findResult[1] : data?.name;
              updateState(response.data);
            } else {
              updateState(null);
            }
          } else {
            console.error('Error:', response.error);
          }
        });
      } else {
        updateState(null);
      }
    } catch (err) {
      console.log(err);
    }
  }
  // interval to update the data
  useEffect(() => {
    init();
    const id = setInterval(
      () => {
        init();
      },
      1 * 5 * 1000,
    ); //
    return () => clearInterval(id);
  }, [memoizedTicker, memoizedContractAddresses]);
  return state;
}
