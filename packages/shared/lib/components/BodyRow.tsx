import { Fade, TableCell, TableRow, Box, Avatar, IconButton } from '@mui/material';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Pair } from '../models';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import { useWatchListStorage } from '@extension/storage';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { useState, useEffect } from 'react';
import { generateUUID } from '../utils/index';

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
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const theme = useTheme();
  const USD = Number(row.priceUsd);
  const price = numberFormat(USD);
  const percent_change5m = Number(row.priceChange.m5).toFixed(2);
  const percent_change1h = Number(row.priceChange.h1).toFixed(2);
  const percent_change6h = Number(row.priceChange.h6).toFixed(2);
  const percent_change24h = Number(row.priceChange.h24).toFixed(2);
  const uuid = generateUUID();

  const marketCap = numberFormat(row.marketCap, {
    notation: 'compact',
    compactDisplay: 'short',
  });
  const volume_24 = numberFormat(row.volume.h24);

  const renderPercentage = (num: number) => {
    if (num > 0) {
      return (
        <Box display="flex" justifyContent="flex-end" alignItems="center" color={'success.main'}>
          <ArrowDropUpIcon color={'success'} />
          <span>{num}%</span>
        </Box>
      );
    }
    if (num < 0) {
      return (
        <Box display={'flex'} justifyContent="flex-end" alignItems="center" color={'error.main'}>
          <ArrowDropDownIcon />
          <span> {num.toString().replace('-', '')}%</span>
        </Box>
      );
    }
    return (
      <Box display={'flex'} justifyContent="flex-end" alignItems="center" color={'gray'}>
        <span> {num.toString().replace('-', '')}</span>
      </Box>
    );
  };
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    ...theme.typography.body2,
    padding: theme.spacing(0.5),
    textAlign: 'center',
    flexGrow: 1,
    border: `2px solid ${theme.palette.divider}`, // Thicker and more visible border
    borderRadius: theme.shape.borderRadius, // Optional: keep border rounded for better visuals
  }));

  useEffect(() => {
    const checkWatchlist = async () => {
      const watchlist = await useWatchListStorage.getWatchlist();
      const isAdded = watchlist.some(listItem => listItem.url === row.url);
      setIsInWatchlist(isAdded);
    };

    checkWatchlist();
  }, [row]);

  const handleToggle = async () => {
    if (isInWatchlist) {
      await useWatchListStorage.removeFromWatchlist(row.url);
    } else {
      await useWatchListStorage.addToWatchlist({
        guidID: uuid,
        address: row.baseToken.address,
        isPriority: false,
        name: row.baseToken.name,
        symbol: row.baseToken.symbol,
        url: row.url,
        dexId: row.dexId,
        chainId: row.chainId,
        changeRate24h: row?.priceChange?.h24?.toString(),
        price: row.priceUsd,
        imageUrl: row.info?.imageUrl || '',
        changeRate5m: row?.priceChange?.m5?.toString(),
        changeRate1h: row?.priceChange?.h1?.toString(),
        changeRate6h: row?.priceChange?.h24?.toString(),
      });
    }

    setIsInWatchlist(prev => !prev);
  };
  return (
    <TableRow
      sx={{
        backgroundColor: 'background.default', // Theme-aware
        color: 'text.primary', // Theme-aware
        cursor: 'pointer', // Indicate that the row is clickable
        borderColor: 'black',
        '&:hover': {
          backgroundColor: 'action.hover', // Theme-aware hover background color
          border: '2px solid', // Add a border on hover
          borderColor: 'primary.main', // Theme-aware border color
          borderRadius: '4px', // Optional: Add rounded corners for better visuals
        },
        borderBottom: `1px solid ${theme.palette.divider}`, // White line or divider line at the bottom
      }}
      onClick={() => window.open(`https://dexscreener.com/${row.chainId}/${row.pairAddress}`, '_blank')}>
      <TableCell>
        <IconButton
          onClick={event => {
            event.stopPropagation(); // Prevent the click from bubbling to the TableRow
            handleToggle();
          }}
          color={isInWatchlist ? 'warning' : 'default'}>
          {isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </TableCell>
      <TableCell
        title={`Chain : ${row.chainId.toUpperCase()} / Dex : ${row.dexId.toUpperCase()}`} // The full text will appear when you hover over the cell
        style={{
          overflow: 'hidden', // Hide the overflowed text
          textOverflow: 'ellipsis', // Show ellipsis when the text overflows
          whiteSpace: 'nowrap', // Prevent text from wrapping
        }}
        sx={theme => ({
          [theme.breakpoints.down('md')]: {
            position: 'sticky',
            left: 48,
            zIndex: 10,
            backgroundColor: '#121212',
          },
        })}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container direction="column">
              <Grid>
                <Avatar
                  src={`https://dd.dexscreener.com/ds-data/chains/${row.chainId}.png"`}
                  sx={{
                    width: 30,
                    height: 30,
                  }}
                />
              </Grid>
              <Grid>
                <Avatar
                  src={`https://dd.dexscreener.com/ds-data/dexes/${row.dexId}.png"`}
                  sx={{
                    width: 30,
                    height: 30,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </TableCell>
      <TableCell
        title={row.baseToken.name} // The full text will appear when you hover over the cell
        style={{
          overflow: 'hidden', // Hide the overflowed text
          textOverflow: 'ellipsis', // Show ellipsis when the text overflows
          whiteSpace: 'nowrap', // Prevent text from wrapping
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
              width: 50,
              height: 50,
              mr: 1,
            }}
          />
        </Box>
      </TableCell>
      <TableCell
        style={{
          overflow: 'hidden', // Hide the overflowed text
          textOverflow: 'ellipsis', // Show ellipsis when the text overflows
          whiteSpace: 'nowrap', // Prevent text from wrapping
        }}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={0} rowSpacing={1}>
            <Grid size={8}>
              <Item>{row.baseToken.name}</Item>
            </Grid>
            <Grid size={4}>
              <Item>
                {row.baseToken.symbol} / <span style={{ opacity: 0.7, fontSize: 11 }}>{row.quoteToken.symbol}</span>
              </Item>
            </Grid>
            <Grid size={6}>
              <Item>
                <div>
                  <span>MKT Cap: </span>
                  <SwitchTransition>
                    <CSSTransition
                      key={marketCap} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span>{marketCap}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
            <Grid size={6}>
              <Item>
                <div>
                  <span>VOL 24H: </span>
                  <SwitchTransition>
                    <CSSTransition
                      key={marketCap} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span>{volume_24}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
          </Grid>
        </Box>
      </TableCell>

      <SwitchTransition>
        <Fade key={price}>
          <TableCell align="right">{price}</TableCell>
        </Fade>
      </SwitchTransition>

      <TableCell
        style={{
          overflow: 'hidden', // Hide the overflowed text
          textOverflow: 'ellipsis', // Show ellipsis when the text overflows
          whiteSpace: 'nowrap', // Prevent text from wrapping
          width: '230px',
        }}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={0} rowSpacing={1}>
            <Grid size={6}>
              <Item>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block' }}>5M:</span>
                  <SwitchTransition>
                    <CSSTransition
                      key={percent_change5m} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span style={{ display: 'inline-block' }}>{renderPercentage(Number(percent_change5m))}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
            <Grid size={6}>
              <Item>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block' }}>&nbsp;6H:</span>
                  <SwitchTransition>
                    <CSSTransition
                      key={percent_change6h} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span style={{ display: 'inline-block' }}>{renderPercentage(Number(percent_change6h))}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
            <Grid size={6}>
              <Item>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block' }}>1H:</span>
                  <SwitchTransition>
                    <CSSTransition
                      key={percent_change1h} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span style={{ display: 'inline-block' }}>{renderPercentage(Number(percent_change1h))}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
            <Grid size={6}>
              <Item>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block' }}>24H:</span>
                  <SwitchTransition>
                    <CSSTransition
                      key={percent_change24h} // Ensure unique key for transitions
                      classNames="fade"
                      timeout={300} // Adjust as needed for transition speed
                    >
                      <span style={{ display: 'inline-block' }}>{renderPercentage(Number(percent_change24h))}</span>
                    </CSSTransition>
                  </SwitchTransition>
                </div>
              </Item>
            </Grid>
          </Grid>
        </Box>
      </TableCell>
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
