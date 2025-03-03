import { Fade, TableCell, TableRow, Box, Avatar, IconButton, Tooltip, Typography } from '@mui/material';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Pair } from '../models';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import { useWatchListStorage, CoinGeckoContractAddress } from '@extension/storage';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { useState, useEffect, useMemo, useRef } from 'react';
import { generateUUID } from '../utils/index';
import { detectBlockchain } from '../utils/chain-helpers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BuySellChart from './BuySellCharts';
import React from 'react';
function numberFormat(num: number, options?: any) {
  let temp = 2;

  if (num < 1 && num > 0.0001) {
    temp = 4;
  }
  if (num < 0.0001) {
    temp = 8;
  }

  // If the number is greater than 1,000,000, use compact notation
  const isLargeNumber = num >= 1_000_000;

  let defaultOptions = {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: temp,
    minimumFractionDigits: 2,
    notation: isLargeNumber ? 'compact' : 'standard', // Use compact notation for large numbers
    compactDisplay: 'short', // Short format (e.g., "1.2M" instead of "1.2 million")
  };

  return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(num);
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  ...theme.typography.body2,
  padding: theme.spacing(0.5),
  textAlign: 'center',
  flexGrow: 1,
  border: `2px solid ${theme.palette.divider}`, // Thicker and more visible border
  borderRadius: theme.shape.borderRadius, // Optional: keep border rounded for better visuals
}));

const MiniChartIframe = React.memo(({ src, onLoad }: { src: string; onLoad: () => void }) => (
  <iframe src={src} width="100%" height="220" frameBorder="0" style={{ display: 'block' }} onLoad={onLoad} />
));

const commonQuoteTokens = new Set(['ETH', 'WETH', 'USDT', 'BTC', 'BNB', 'SOL']);

const isLikelyTradingViewSymbol = (pair: Pair): boolean => {
  const quoteSymbol = pair.quoteToken.symbol?.toUpperCase() || '';

  // Check if chain or DEX is supported and quote token is common
  return commonQuoteTokens.has(quoteSymbol);
};

interface BodyRowProps {
  row: Pair;
  memoizedContractAddresses: CoinGeckoContractAddress[];
  expandedItem: string | null; // Add this prop
  toggleExpandItem: (id: string) => void; // Add this prop
}

export default function BodyPairRow({ row, memoizedContractAddresses, expandedItem, toggleExpandItem }: BodyRowProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isSymbolValid, setIsSymbolValid] = useState<boolean | null>(null); // null = loading, true = valid, false = invalid
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState(false); // Track if symbol is invalid

  const theme = useTheme();
  const USD = Number(row.priceUsd);

  const percent_change5m = Number(row.priceChange.m5).toFixed(2);
  const percent_change1h = Number(row.priceChange.h1).toFixed(2);
  const percent_change6h = Number(row.priceChange.h6).toFixed(2);
  const percent_change24h = Number(row.priceChange.h24).toFixed(2);
  const uuid = generateUUID();

  const buys = useMemo(() => Number(row.txns.h24.buys) || 0, [row.txns.h24.buys]);
  const sells = useMemo(() => Number(row.txns.h24.sells) || 0, [row.txns.h24.sells]);

  const CoinGeckoIcon = 'content/coingecko.svg'; // Replace with actual path
  const DexscreenerIcon = 'content/dexscreener.svg';

  const price = useMemo(() => numberFormat(USD), [USD]);
  const marketCap = useMemo(
    () =>
      numberFormat(row.marketCap, {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [row.marketCap],
  );
  const fdv = useMemo(
    () =>
      numberFormat(row.fdv, {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [row.fdv],
  );
  const volume_24 = useMemo(
    () =>
      numberFormat(row.volume.h24, {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [row.volume.h24],
  );

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

  function calculateAge(pairCreatedAt: string): string {
    const createdAt = new Date(pairCreatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());

    const diffYears = now.getFullYear() - createdAt.getFullYear();
    const diffMonths = now.getMonth() - createdAt.getMonth();
    const diffDays = now.getDate() - createdAt.getDate();
    const diffHours = now.getHours() - createdAt.getHours();
    const diffMinutes = now.getMinutes() - createdAt.getMinutes();

    let years = diffYears;
    let months = diffMonths;
    let days = diffDays;
    let hours = diffHours;
    let minutes = diffMinutes;

    if (days < 0) {
      months -= 1;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const parts: string[] = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (years === 0 && months === 0) {
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
    }

    return parts.join(' ');
  }

  const isLikelyValid = useMemo(() => isLikelyTradingViewSymbol(row), [row]);

  useEffect(() => {
    if (expandedItem === row.pairAddress && isSymbolValid === null && isLikelyValid) {
      setIsSymbolValid(true); // Assume valid initially if likely supported
      const timeout = setTimeout(() => {
        if (isSymbolValid === true) {
          setIsSymbolValid(false);
          console.log(
            `Symbol ${row.baseToken.symbol || 'ANYONE'}/${row.quoteToken.symbol === '0x0' ? 'ETH' : row.quoteToken.symbol || 'ETH'} likely invalid`,
          );
        }
      }, 5000); // 5-second timeout
      return () => clearTimeout(timeout);
    } else if (expandedItem === row.pairAddress && !isLikelyValid) {
      setIsSymbolValid(false); // Skip loading if unlikely to be supported
    }
  }, [expandedItem, row.pairAddress, isSymbolValid, isLikelyValid]);

  const miniChartUrl = useMemo(() => {
    const symbol = `MEXC:${row.baseToken.symbol}USDT`; // e.g., "POPE%2FSOL" (URL-encoded "/")

    const config = {
      symbol: symbol,
      width: 350, // Fixed width for Mini Chart
      height: 220, // Fixed height for Mini Chart
      dateRange: '1M', // Default to 1 W; Mini Chart doesn't support full timeFrames array, adjust as needed
      colorTheme: 'dark',
      isTransparent: false,
      autosize: false,
      largeChartUrl: '',
      chartOnly: true, // Hides extra UI
      noTimeScale: false, // Shows timescale; set to true to hide X-axis if desired
      utm_source: 'www.tradingview.com',
      utm_medium: 'widget_new',
      utm_campaign: 'mini-symbol-overview',
      page_uri: 'www.tradingview.com/widget-wizard/en/dark/mini-chart/',
    };
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    return `https://www.tradingview-widget.com/embed-widget/mini-symbol-overview/?locale=en#${encodedConfig}`;
  }, [row.baseToken.symbol, row.quoteToken.symbol, theme.palette.mode]);

  return (
    <>
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
        {/* onClick={() => toggleExpandItem(row.pairAddress)}> */}
        <TableCell>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconButton
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'primary.main', // Add background color
                  borderRadius: '50%', // Make it circular
                }}
                onClick={event => {
                  event.stopPropagation();
                  toggleExpandItem(row.pairAddress);
                }}>
                {expandedItem === row.pairAddress ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              {/* First Row - Star Icon */}
              <IconButton
                sx={{
                  width: 20,
                  height: 20,
                }}
                onClick={event => {
                  event.stopPropagation();
                  handleToggle();
                }}
                color={isInWatchlist ? 'warning' : 'default'}>
                {isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tooltip title="Contract Address verified on DexScreener. Redirect?" arrow>
                <IconButton
                  style={{ backgroundColor: 'white', padding: 2 }}
                  size="small"
                  onClick={event => {
                    // event.stopPropagation();
                    // handleRedirect(item);
                  }}>
                  <Avatar
                    src={chrome.runtime.getURL(DexscreenerIcon)}
                    sx={{
                      width: 20,
                      height: 20,
                    }}
                  />
                </IconButton>
              </Tooltip>
              {/* Show CoinGecko Icon only if contractAddress is in storage */}
              {memoizedContractAddresses?.find(obj =>
                obj?.contracts?.includes(row.baseToken.address.toLocaleLowerCase()),
              ) && (
                <Tooltip title="Contract Address verified on CoinGecko. Redirect?" arrow>
                  <IconButton
                    style={{ backgroundColor: 'white', padding: 2 }}
                    size="small"
                    onClick={event => {
                      event.stopPropagation();
                      window.open(`https://www.coingecko.com/en/coins/` + row.baseToken.address, '_blank');
                      // window.open(`https://www.geckoterminal.com/` + row.chainId + '/pools/' + row.baseToken.address, '_blank');
                    }}>
                    <Avatar
                      src={chrome.runtime.getURL(CoinGeckoIcon)}
                      sx={{
                        width: 20,
                        height: 20,
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </div>
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
                    src={`https://dd.dexscreener.com/ds-data/chains/${row.chainId}.png`}
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
          <Tooltip
            title={
              detectBlockchain(row.baseToken.name)
                ? 'Name of the token detected as blockchain address (Beware of scam)'
                : row.baseToken.name
            }
            arrow>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={0} rowSpacing={1}>
                <Grid size={8}>
                  <Item>
                    {row.baseToken.name}
                    {detectBlockchain(row.baseToken.name) && <span style={{ color: 'red' }}> (Could be scam)</span>}
                  </Item>
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
                          key={row.pairAddress} // Use a stable key
                          classNames="fade"
                          timeout={300} // Adjust as needed for transition speed
                        >
                          <span>{marketCap}</span>
                        </CSSTransition>
                      </SwitchTransition>
                    </div>
                  </Item>
                </Grid>
                <Grid size={5}>
                  <Item>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center', // Center both the text and chart horizontally
                        gap: '8px', // Optional: add space between the text and chart
                      }}>
                      <span style={{ marginRight: '8px' }}>VOL 24H: </span>

                      <SwitchTransition>
                        <CSSTransition
                          key={row.pairAddress} // Use a stable key
                          classNames="fade"
                          timeout={300} // Adjust as needed for transition speed
                        >
                          <span>{volume_24}</span>
                        </CSSTransition>
                      </SwitchTransition>

                      {/* Add space between chart and volume text */}
                    </div>
                  </Item>
                </Grid>
                <Grid size={1}>
                  <Tooltip title={`Buys: ${buys}, Sells: ${sells}`} arrow>
                    <Box sx={{ marginLeft: '8px' }} width={30} height={30}>
                      <BuySellChart buys={buys} sells={sells} />
                    </Box>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
          </Tooltip>
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
      {expandedItem === row.pairAddress && (
        <TableRow
          sx={{
            backgroundColor: 'background.default',
            color: theme.palette.background.default,
            border: `2px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}>
          <TableCell colSpan={6} style={{ padding: '10px' }}>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={0} rowSpacing={1}>
                <Grid size={6}>
                  <Item>
                    <div>
                      <span>Liquidity: </span>
                      <span>{marketCap}</span>
                    </div>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <div>
                      <span>FDV: </span>
                      <span>{fdv}</span>
                    </div>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <div>
                      <span>CA: {row.pairAddress}</span>
                    </div>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <div>
                      <span>Pair Created: </span>
                      <span>{calculateAge(new Date(row.pairCreatedAt).toLocaleString())} ago</span>
                    </div>
                  </Item>
                </Grid>
                {/* TradingView Widget */}
                <Grid size={12}>
                  <Item>
                    {isSymbolValid === null ? (
                      <Box>Loading chart...</Box>
                    ) : isSymbolValid ? (
                      <MiniChartIframe src={miniChartUrl} onLoad={() => console.log('Chart loaded')} />
                    ) : (
                      <Box>Chart not available on TradingView</Box>
                    )}
                  </Item>
                </Grid>
              </Grid>
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
