import { useState } from 'react';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import { Paper, TableBody, TableCell, TableHead, TablePagination, TableRow } from '@mui/material';
import PairTableBody from './PairTableBody';

interface PairTableProps {
  ticker: string;
}
export default function PairTable({ ticker }: PairTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(0);
  const [dataLength, setDataLength] = useState(0);
  return (
    <Paper
      sx={{
        backgroundColor: 'background.default', // Theme-aware
        color: 'text.primary', // Theme-aware
      }}>
      <TableContainer>
        <Table
          sx={{
            minWidth: 600,
            '& td': {
              fontWeight: 700,
              color: 'text.primary', // Theme-aware
            },
          }}>
          <PairTableBody rowsPerPage={rowsPerPage} page={page} setDataLength={setDataLength} temp={ticker} />
        </Table>
      </TableContainer>
      {/* <TablePagination
        component={'div'}
        rowsPerPageOptions={[5, 10, 20]}
        rowsPerPage={5}
        count={dataLength}
        onRowsPerPageChange={e => {
          setRowsPerPage(parseInt(e.target.value));
          setPage(0);
        }}
        page={page}
        onPageChange={(e, newPage) => {
          setPage(newPage);
        }}
      /> */}
    </Paper>
  );
}
