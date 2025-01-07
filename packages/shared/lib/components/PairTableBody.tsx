import { useEffect, useState, memo } from 'react';
import BodyPairRow from './BodyRow';
import BodyPriorityRow from './BodyPriorityRow';
import { Box, Skeleton, TableBody, TableCell, TableRow } from '@mui/material';
import { useDexScreener, useKucoin } from '../hooks';

interface PairTableBodyProps {
  temp: string;
  rowsPerPage: number;
  page: number;
  setDataLength: (length: number) => void;
}

const PairTableBody = memo(({ rowsPerPage, page, setDataLength, temp }: PairTableBodyProps) => {
  const [ticker, setTicker] = useState('');
  const { data: dexData, isLoading: isDexLoading } = useDexScreener(ticker);
  const { data: kucoinData, isLoading: isKucoinLoading } = useKucoin(ticker);

  const dataSliced = dexData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  useEffect(() => {
    setTicker(temp);
    setDataLength(dexData.length);
  }, [dexData.length, temp]);

  return (
    <TableBody>
      {isKucoinLoading ? (
        <BodySkeleton rows={1} heads={7} />
      ) : kucoinData.name != '' ? (
        <BodyPriorityRow key={kucoinData.symbol} row={kucoinData} />
      ) : null}
      {isDexLoading ? (
        <BodySkeleton rows={rowsPerPage} heads={7} />
      ) : (
        dataSliced.map(row => <BodyPairRow key={row.baseToken.address} row={row} />)
      )}
    </TableBody>
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
            <Skeleton />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
};

export default PairTableBody;
