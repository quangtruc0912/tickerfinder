import { Fade, TableCell, TableRow, Box, Avatar } from '@mui/material';
import { SwitchTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Pair } from '../models';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';

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

export default function BodyPairRow({ row }: BodyRowProps) {
  const theme = useTheme();
  const USD = Number(row.priceUsd);
  const price = numberFormat(USD);
  const percent_change5m = Number(row.priceChange.m5).toFixed(2);
  const percent_change1h = Number(row.priceChange.h1).toFixed(2);
  const percent_change6h = Number(row.priceChange.h6).toFixed(2);
  const percent_change24h = Number(row.priceChange.h24).toFixed(2);

  const marketCap = numberFormat(row.marketCap, {
    notation: 'compact',
    compactDisplay: 'short',
  });
  const volume_24 = numberFormat(row.volume.h24);
  const liquid = numberFormat(row.liquidity.usd);
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
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    flexGrow: 1,
  }));
  return (
    <TableRow
      sx={{
        backgroundColor: 'background.default', // Theme-aware
        color: 'text.primary', // Theme-aware
      }}>
      <TableCell>BUTTON</TableCell>
      <TableCell
        style={{
          overflow: 'hidden', // Hide the overflowed text
          textOverflow: 'ellipsis', // Show ellipsis when the text overflows
          whiteSpace: 'nowrap', // Prevent text from wrapping
        }}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <Grid size={8}>
              <Item>{row.baseToken.name}</Item>
            </Grid>
            <Grid size={4}>
              <Item>/{row.baseToken.symbol}</Item>
            </Grid>
            <Grid size={6}>
              <Item>MktCap:{marketCap}</Item>
            </Grid>
            <Grid size={6}>
              <Item>Volume:{volume_24}</Item>
            </Grid>
          </Grid>
        </Box>
      </TableCell>

      <SwitchTransition>
        <Fade key={price}>
          <TableCell align="right">{price}</TableCell>
        </Fade>
      </SwitchTransition>
      <SwitchTransition>
        <Fade key={percent_change5m}>
          <TableCell align="right">{renderPercentage(Number(percent_change5m))}</TableCell>
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
    </TableRow>
  );
}

{
  /* <TableCell
title={row.baseToken.name} // The full text will appear when you hover over the cell
style={{
  maxWidth: "200px", // Set a max width for the cell
  overflow: "hidden", // Hide the overflowed text
  textOverflow: "ellipsis", // Show ellipsis when the text overflows
  whiteSpace: "nowrap", // Prevent text from wrapping
}}
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
    {/* {trimName(row.baseToken.name, 30)}&nbsp;{row.baseToken.symbol} */
}
//{row.baseToken.symbol}
//</span>
//</Box>
//</TableCell> */}
