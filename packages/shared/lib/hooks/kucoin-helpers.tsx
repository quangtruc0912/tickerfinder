import { useState, useEffect, useMemo } from 'react';
import { PriorityPair } from '../models/ticker';
import { KuCoinStorage, KuCoinData, PRIORITYCHAINLIST } from '@extension/storage';

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
