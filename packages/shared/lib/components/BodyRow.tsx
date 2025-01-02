import { Fade, TableCell, TableRow, Box, Avatar } from '@mui/material';
import { SwitchTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Pair } from '../models';

function numberFormat(num: number, options?: any) {
  let temp = 2;
  if (num < 1 && num > 0.0001) {
    temp = 4;
  }
  if (num < 0.0001) {
    temp = 8;
  }
  let defaultOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: temp,
    minimumFractionDigits: 2,
    notation: 'standard',
    compactDisplay: 'long',
  };
  return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(num);
}

interface BodyRowProps {
  row: Pair; // Typing the `row` prop as RowData
}
export default function BodyRow({ row }: BodyRowProps) {
  const USD = Number(row.priceUsd);
  const price = numberFormat(USD);
  const percent_change1h = Number(row.priceChange.h1).toFixed(2);
  const percent_change6h = Number(row.priceChange.h6).toFixed(2);
  const percent_change24h = Number(row.priceChange.h24).toFixed(2);

  const marketCap = numberFormat(row.marketCap, {
    notation: 'compact',
    compactDisplay: 'short',
  });
  const volume_24 = numberFormat(row.volume.h24);
  const renderPercentage = (num: number) => {
    return num > 0 ? (
      <Box display="flex" justifyContent="flex-end" alignItems="center" color={'success.main'}>
        <ArrowDropUpIcon color={'success'} />
        <span>{num}%</span>
      </Box>
    ) : (
      <Box display={'flex'} justifyContent="flex-end" alignItems="center" color={'error.main'}>
        <ArrowDropDownIcon />
        <span> {num.toString().replace('-', '')}%</span>
      </Box>
    );
  };
  return (
    <TableRow sx={{ '& td': { width: 20 } }}>
      <TableCell
        sx={theme => ({
          [theme.breakpoints.down('md')]: {
            position: 'sticky',
            left: 0,
            zIndex: 10,
            backgroundColor: '#121212',
          },
        })}>
        {price}
      </TableCell>
      <TableCell
        padding="none"
        sx={theme => ({
          [theme.breakpoints.down('md')]: {
            position: 'sticky',
            left: 48,
            zIndex: 10,
            backgroundColor: '#121212',
          },
        })}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={row.info?.imageUrl}
            sx={{
              width: 25,
              height: 25,
              mr: 1,
            }}
          />
          <span>
            {row.baseToken.name}&nbsp;{row.baseToken.symbol}
          </span>
        </Box>
      </TableCell>
      <SwitchTransition>
        <Fade key={price}>
          <TableCell align="right">{price}</TableCell>
        </Fade>
      </SwitchTransition>
      <SwitchTransition>
        <Fade key={percent_change1h}>
          <TableCell align="right">{renderPercentage(Number(percent_change1h))}</TableCell>
        </Fade>
      </SwitchTransition>
      <SwitchTransition>
        <Fade key={percent_change6h}>
          <TableCell align="right">{renderPercentage(Number(percent_change6h))}</TableCell>
        </Fade>
      </SwitchTransition>
      <SwitchTransition>
        <Fade key={percent_change24h}>
          <TableCell align="right">{renderPercentage(Number(percent_change24h))}</TableCell>
        </Fade>
      </SwitchTransition>
      <TableCell align="right">{marketCap}</TableCell>

      <TableCell align="right">{volume_24}</TableCell>
    </TableRow>
  );
}
