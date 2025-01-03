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
  const rowStyle: React.CSSProperties = {
    padding: '5px 10px', // Reduced padding for the row
  };

  const cellStyle: React.CSSProperties = {
    padding: '5px 10px', // Reduced padding for individual cells in the row
  };

  return (
    <Paper>
      <TableContainer>
        <Table sx={{ minWidth: 800, '& td': { fontWeight: 700 } }}>
          <TableHead>
            <TableRow style={rowStyle}>
              <TableCell style={cellStyle}>#</TableCell>
              <TableCell style={cellStyle}>name</TableCell>
              <TableCell style={cellStyle} align="right">
                Price
              </TableCell>
              <TableCell style={cellStyle} align="right">
                5M %
              </TableCell>
              <TableCell style={cellStyle} align="right">
                1H %
              </TableCell>
              <TableCell style={cellStyle} align="right">
                6H %
              </TableCell>
              <TableCell style={cellStyle} align="right">
                24H %
              </TableCell>
            </TableRow>
          </TableHead>

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
