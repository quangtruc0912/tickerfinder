import { useEffect, useState, memo, useMemo, useRef } from 'react';
import BodyPairRow from './BodyRow';
import BodyPriorityRow from './BodyPriorityRow';
import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useDexScreener, useKucoin } from '../hooks';
import { coinGeckoStorage, CoinGeckoContractAddress } from '@extension/storage';
interface PairTableBodyProps {
  temp: string;
}

const PairTableBody = memo(({ temp }: PairTableBodyProps) => {
  const [ticker, setTicker] = useState('');
  const { data: dexData, isLoading: isDexLoading } = useDexScreener(ticker);
  const { data: kucoinData, isLoading: isKucoinLoading } = useKucoin(ticker);
  const kucoinDataMemo = useMemo(() => kucoinData, [kucoinData]);
  const [coinGeckoAddresses, setCoinGeckoAddresses] = useState<CoinGeckoContractAddress[]>([]);

  useEffect(() => {
    const fetchContractAddresses = async () => {
      const storedContracts = await coinGeckoStorage.getAllContractAddress();
      setCoinGeckoAddresses(storedContracts);
    };
    fetchContractAddresses();
  }, []);

  const memoizedContractAddresses = useMemo(() => coinGeckoAddresses, [coinGeckoAddresses]);

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

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ width: '150px', padding: '10px' }}>
        <FormGroup>
          {uniqueChainIds.length > 0 && (
            <FormControlLabel
              control={<Checkbox checked={allSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} />}
              label="All"
            />
          )}

          {uniqueChainIds.map(chainId => (
            <FormControlLabel
              key={chainId}
              control={
                <Checkbox checked={selectedChainIds.includes(chainId)} onChange={() => handleCheckboxChange(chainId)} />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={`https://dd.dexscreener.com/ds-data/chains/${chainId}.png`}
                    alt={`Chain ${chainId}`}
                    width={20}
                    height={20}
                    style={{ marginRight: '8px' }}
                  />
                  {`${chainId}`}
                </Box>
              }
            />
          ))}
        </FormGroup>
      </Box>

      <TableContainer sx={{ flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
        <Table>
          <TableBody>
            {isKucoinLoading ? (
              <BodySkeleton rows={1} heads={8} />
            ) : kucoinData.name !== '' ? (
              <BodyPriorityRow
                key={kucoinDataMemo.time}
                row={kucoinDataMemo}
                memoizedContractAddresses={memoizedContractAddresses}
              />
            ) : null}
            {isDexLoading ? (
              <BodySkeleton rows={3} heads={8} />
            ) : filteredDexData.length > 0 ? (
              filteredDexData.map(row => (
                <BodyPairRow key={row.pairAddress} row={row} memoizedContractAddresses={memoizedContractAddresses} />
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
