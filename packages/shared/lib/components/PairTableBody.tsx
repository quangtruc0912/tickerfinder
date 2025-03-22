import { useEffect, useState, memo, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import BodyPairRow from './BodyRow';
import BodyPriorityRow from './BodyPriorityRow';
import { Box, Skeleton, Table, TableBody, TableCell, TableRow, TableContainer } from '@mui/material';
import { useDexScreener, useKucoin } from '../hooks';
import {
  coinGeckoStorage,
  CoinGeckoContractAddress,
  KuCoinData,
  KuCoinStorage,
  useWatchListStorage,
  WatchlistItem,
  WATCHLIST_KEY,
} from '@extension/storage';

interface PairTableBodyProps {
  temp: string;
}

const PairTableBody = memo(({ temp }: PairTableBodyProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [ticker, setTicker] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const { data: dexData, isLoading: isDexLoading } = useDexScreener(ticker);
  const { data: kucoinData, isLoading: isKucoinLoading } = useKucoin(ticker);

  const kucoinDataMemo = useMemo(() => {
    return kucoinData.name !== '' ? { ...kucoinData } : null;
  }, [kucoinData.name, kucoinData.time]);

  const [coinGeckoAddresses, setCoinGeckoAddresses] = useState<CoinGeckoContractAddress[]>([]);
  const [KucoinData, setKucoinData] = useState<KuCoinData[]>([]);

  const shadowHostRef = useRef<HTMLDivElement>(null);

  const toggleExpandItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  useEffect(() => {
    const fetchContractAddresses = async () => {
      const storedContracts = await coinGeckoStorage.getAllContractAddress();
      setCoinGeckoAddresses(storedContracts);
    };
    const fetchAllKucoinData = async () => {
      const result = await KuCoinStorage.getAllData();
      setKucoinData(result);
    };
    fetchAllKucoinData();
    fetchContractAddresses();
  }, []);

  const memoizedContractAddresses = useMemo(() => coinGeckoAddresses, [coinGeckoAddresses]);
  const memoizedKuCoinData = useMemo(() => KucoinData, [KucoinData]);

  const uniqueChainIds = useMemo(() => {
    if (!dexData || !Array.isArray(dexData)) return [];
    return Array.from(new Set(dexData.map(pair => pair.chainId)));
  }, [dexData]);

  const prevChainIdsRef = useRef<string[]>([]);
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>(uniqueChainIds);

  useEffect(() => {
    const prevChainIds = prevChainIdsRef.current;
    const hasChanged = JSON.stringify(prevChainIds) !== JSON.stringify(uniqueChainIds);

    if (hasChanged) {
      setSelectedChainIds(uniqueChainIds);
      prevChainIdsRef.current = uniqueChainIds;
    }
  }, [uniqueChainIds]);

  const allSelected = selectedChainIds.length === uniqueChainIds.length && uniqueChainIds.length > 0;
  const isIndeterminate = selectedChainIds.length > 0 && selectedChainIds.length < uniqueChainIds.length;

  const handleSelectAll = () => {
    setSelectedChainIds(allSelected ? [] : uniqueChainIds);
  };

  const handleCheckboxChange = (chainId: string) => {
    setSelectedChainIds(prev => {
      const newSelected = prev.includes(chainId) ? prev.filter(id => id !== chainId) : [...prev, chainId];
      return newSelected.length === uniqueChainIds.length ? uniqueChainIds : newSelected;
    });
  };

  const filteredDexData = useMemo(() => {
    return selectedChainIds.length > 0 ? dexData.filter(pair => selectedChainIds.includes(pair.chainId)) : [];
  }, [dexData, selectedChainIds]);

  useEffect(() => {
    setTicker(temp);
  }, [temp]);

  useEffect(() => {
    if (shadowHostRef.current && !shadowHostRef.current.shadowRoot) {
      const shadowRoot = shadowHostRef.current.attachShadow({ mode: 'open' });
      const container = document.createElement('div');

      const style = document.createElement('style');
      style.textContent = `
        .form-group {
          padding: 8px;
          font-family: Arial, sans-serif;
        }
        .form-control-label {
          display: flex;
          align-items: center;
          margin: 4px 0;
        }
        .checkbox {
          margin-right: 8px;
        }
        .chain-checkbox {
          display: flex;
          align-items: center;
        }
        .chain-image {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
      `;

      shadowRoot.appendChild(style);
      shadowRoot.appendChild(container);
    }
  }, []);

  const ChainSelector = (
    <div className="form-group">
      {uniqueChainIds.length > 0 && (
        <label className="form-control-label">
          <input type="checkbox" className="checkbox" checked={allSelected} onChange={handleSelectAll} />
          All
        </label>
      )}
      {uniqueChainIds.map(chainId => (
        <label className="form-control-label" key={chainId}>
          <input
            type="checkbox"
            className="checkbox"
            checked={selectedChainIds.includes(chainId)}
            onChange={() => handleCheckboxChange(chainId)}
          />
          <span className="chain-checkbox">
            <img
              src={`https://dd.dexscreener.com/ds-data/chains/${chainId}.png`}
              alt={`Chain ${chainId}`}
              className="chain-image"
            />
            {chainId}
          </span>
        </label>
      ))}
    </div>
  );

  useEffect(() => {
    const fetchWatchlist = async () => {
      const list = await useWatchListStorage.getWatchlist();
      setWatchlist(list);
    };
    fetchWatchlist();
  }, []);
  useEffect(() => {
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes[WATCHLIST_KEY]) {
        const fetchWatchlist = async () => {
          const list = await useWatchListStorage.getWatchlist();
          setWatchlist(list);
        };
        fetchWatchlist();
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ width: '150px', padding: '10px' }}>
        <div ref={shadowHostRef}>
          {shadowHostRef.current?.shadowRoot?.querySelector('div') &&
            ReactDOM.createPortal(ChainSelector, shadowHostRef.current.shadowRoot.querySelector('div')!)}
        </div>
      </Box>

      <TableContainer sx={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
        <Table>
          <TableBody>
            {isKucoinLoading ? (
              <BodySkeleton rows={1} heads={8} />
            ) : kucoinDataMemo ? (
              <BodyPriorityRow row={kucoinDataMemo} memoizedKucoinData={memoizedKuCoinData} watchList={watchlist} />
            ) : null}
            {isDexLoading ? (
              <BodySkeleton rows={3} heads={8} />
            ) : filteredDexData.length > 0 ? (
              filteredDexData.map(row => (
                <BodyPairRow
                  key={row.pairAddress}
                  row={row}
                  memoizedContractAddresses={memoizedContractAddresses}
                  expandedItem={expandedItem}
                  watchList={watchlist}
                  toggleExpandItem={toggleExpandItem}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No data matching selected Chain IDs.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

interface BodySkeletonProps {
  rows: number;
  heads: number;
}

const BodySkeleton = ({ rows, heads }: BodySkeletonProps) => {
  const rowArray = Array(rows).fill(null);
  const cellArray = Array(heads).fill(null);
  return rowArray.map((_, index) => (
    <TableRow key={index}>
      {cellArray.map((_, index) => (
        <TableCell key={index} align={index === 1 ? 'left' : 'right'}>
          {index === 1 ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Skeleton variant="circular" width={25} height={25} sx={{ mr: 1 }} />
              <Skeleton width={100} />
            </Box>
          ) : (
            <Skeleton width={50} />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
};

export default PairTableBody;
