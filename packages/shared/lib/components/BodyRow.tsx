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

function formatCustomPrice(price: number): string {
  if (price === undefined || price === 0) {
    return '0';
  }

  // Ensure the price is represented as a fixed-point number string
  const priceString = price.toFixed(20); // Use a sufficiently large precision
  const [integerPart, decimalPart] = priceString.split('.');

  if (!decimalPart) {
    // If no decimal part, return as is
    return priceString;
  }

  const zerosCount = decimalPart.match(/^0+/)?.[0]?.length || 0;

  // Apply formatting only if there are more than 4 leading zeros
  if (zerosCount > 4 && integerPart == '0') {
    const significantDigits = decimalPart.slice(zerosCount).replace(/0+$/, ''); // Remove trailing zeros
    return `0.0{${zerosCount}}${significantDigits}`;
  }

  // Otherwise, return the price as a normal decimal without trailing zeros
  return parseFloat(priceString).toString(); // Remove trailing zeros from normal decimals
}

// Styled component with cleaner definition
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(0.5),
  textAlign: 'center',
  flexGrow: 1,
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

// Common styles object to reuse
const commonStyles = {
  tableRow: (theme: any) => ({
    backgroundColor: 'background.default',
    color: 'text.primary',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: 'action.hover',
      border: '2px solid',
      borderColor: 'primary.main',
      borderRadius: '4px',
    },
  }),
  ellipsisCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
  },
  iconButton: {
    width: 20,
    height: 20,
  },
};

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

  const price = useMemo(() => formatCustomPrice(USD), [USD]);
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

  const checkWatchlist = async () => {
    const watchlist = await useWatchListStorage.getWatchlist();
    const isAdded = watchlist.some(listItem => listItem.url === row.url);
    setIsInWatchlist(isAdded);
  };

  useEffect(() => {
    checkWatchlist();
  }, [row]);

  const handleToggle = async () => {
    if (isInWatchlist) {
      chrome.runtime.sendMessage({ type: 'REMOVE_FROM_WATCHLIST', id: row.url }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error removing from watchlist:", chrome.runtime.lastError);
        // } else {
        //   console.log("Removed from watchlist:", response);
        //   setIsInWatchlist(false);
        // }
      });
    } else {
      const index = await useWatchListStorage.maxIndex();
      const watchlistItem = {
        guidID: uuid,
        address: row.baseToken.address,
        isPriority: false,
        name: row.baseToken.name,
        symbol: row.baseToken.symbol,
        url: row.url,
        dexId: row.dexId,
        chainId: row.chainId,
        changeRate24h: row?.priceChange?.h24?.toString() || '0',
        price: row.priceUsd,
        imageUrl: row.info?.imageUrl || '',
        changeRate5m: row?.priceChange?.m5?.toString() || '0',
        changeRate1h: row?.priceChange?.h1?.toString() || '0',
        changeRate6h: row?.priceChange?.h6?.toString() || '0',
        index: index + 1,
      };

      chrome.runtime.sendMessage({ type: 'ADD_TO_WATCHLIST', item: watchlistItem }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error adding to watchlist:", chrome.runtime.lastError);
        // } else {
        //   console.log("Added to watchlist:", response);
        //   setIsInWatchlist(true);
        // }
      });
    }
    checkWatchlist();
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
      <TableRow sx={commonStyles.tableRow}>
        <TableCell>
          <Box sx={{ ...commonStyles.flexCenter, flexDirection: 'column', gap: 1 }}>
            <Box sx={{ ...commonStyles.flexCenter, gap: 1 }}>
              <IconButton
                sx={{
                  ...commonStyles.iconButton,
                  backgroundColor: 'primary.main',
                  borderRadius: '50%',
                }}
                onClick={e => {
                  e.stopPropagation();
                  toggleExpandItem(row.pairAddress);
                }}>
                {expandedItem === row.pairAddress ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <IconButton
                sx={commonStyles.iconButton}
                onClick={e => {
                  e.stopPropagation();
                  handleToggle();
                }}
                color={isInWatchlist ? 'warning' : 'default'}>
                {isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Box>
            <Box sx={{ ...commonStyles.flexCenter, gap: 1 }}>
              <Tooltip title="Contract Address verified on DexScreener. Redirect?" arrow>
                <IconButton
                  sx={{ backgroundColor: 'white', p: 0.25 }}
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    window.open(`${row.url}`, '_blank');
                  }}>
                  <Avatar src={chrome.runtime.getURL(DexscreenerIcon)} sx={commonStyles.iconButton} />
                </IconButton>
              </Tooltip>
              {memoizedContractAddresses?.find(obj =>
                obj?.contracts?.includes(row.baseToken.address.toLocaleLowerCase()),
              ) && (
                <Tooltip title="Contract Address verified on CoinGecko. Redirect?" arrow>
                  <IconButton
                    sx={{ backgroundColor: 'white', p: 0.25 }}
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      window.open(`https://www.coingecko.com/en/coins/${row.baseToken.address}`, '_blank');
                    }}>
                    <Avatar src={chrome.runtime.getURL(CoinGeckoIcon)} sx={commonStyles.iconButton} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell
          title={`Chain: ${row.chainId.toUpperCase()} / Dex: ${row.dexId.toUpperCase()}`}
          sx={{
            ...commonStyles.ellipsisCell,
            [theme.breakpoints.down('md')]: {
              position: 'sticky',
              left: 48,
              zIndex: 10,
              backgroundColor: 'background.default',
            },
          }}>
          <Box sx={commonStyles.flexCenter}>
            <Grid container direction="column" spacing={1}>
              <Grid>
                <Avatar
                  src={`https://dd.dexscreener.com/ds-data/chains/${row.chainId}.png`}
                  sx={{ width: 30, height: 30 }}
                />
              </Grid>
              <Grid>
                <Avatar
                  src={`https://dd.dexscreener.com/ds-data/dexes/${row.dexId}.png`}
                  sx={{ width: 30, height: 30 }}
                />
              </Grid>
            </Grid>
          </Box>
        </TableCell>
        <TableCell
          title={row.baseToken.name}
          sx={{
            ...commonStyles.ellipsisCell,
            p: 0,
            [theme.breakpoints.down('md')]: {
              position: 'sticky',
              left: 48,
              zIndex: 10,
              backgroundColor: 'background.default',
            },
          }}>
          <Box sx={{ ...commonStyles.flexCenter }}>
            <Avatar src={row.info?.imageUrl} sx={{ width: 50, height: 50, mr: 1 }} />
          </Box>
        </TableCell>
        <TableCell sx={commonStyles.ellipsisCell}>
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
                    <span>MKT Cap: </span>
                    <SwitchTransition>
                      <CSSTransition key={row.pairAddress} classNames="fade" timeout={300}>
                        <span>{marketCap}</span>
                      </CSSTransition>
                    </SwitchTransition>
                  </Item>
                </Grid>
                <Grid size={5}>
                  <Item>
                    <Box sx={{ ...commonStyles.flexCenter, justifyContent: 'center', gap: 1 }}>
                      <span>VOL 24H: </span>
                      <SwitchTransition>
                        <CSSTransition key={row.pairAddress} classNames="fade" timeout={300}>
                          <span>{volume_24}</span>
                        </CSSTransition>
                      </SwitchTransition>
                    </Box>
                  </Item>
                </Grid>
                <Grid size={1}>
                  <Tooltip title={`Buys: ${buys}, Sells: ${sells}`} arrow>
                    <Box sx={{ ml: 1 }} width={30} height={30}>
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
            <TableCell align="right">${price}</TableCell>
          </Fade>
        </SwitchTransition>
        <TableCell sx={{ ...commonStyles.ellipsisCell, width: '230px' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={0} rowSpacing={1}>
              {[
                { label: '5M', value: percent_change5m },
                { label: '6H', value: percent_change6h },
                { label: '1H', value: percent_change1h },
                { label: '24H', value: percent_change24h },
              ].map(({ label, value }) => (
                <Grid size={6} key={label}>
                  <Item>
                    <Box sx={{ ...commonStyles.flexCenter, gap: 1 }}>
                      <span>{label}:</span>
                      <SwitchTransition>
                        <CSSTransition key={value} classNames="fade" timeout={300}>
                          <span>{renderPercentage(Number(value))}</span>
                        </CSSTransition>
                      </SwitchTransition>
                    </Box>
                  </Item>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TableCell>
      </TableRow>
      {expandedItem === row.pairAddress && (
        <TableRow
          sx={{
            backgroundColor: 'background.default',
            border: `2px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          }}>
          <TableCell colSpan={6} sx={{ p: 1.25 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={0} rowSpacing={1}>
                <Grid size={6}>
                  <Item>
                    <span>Liquidity: </span>
                    <span>{marketCap}</span>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <span>FDV: </span>
                    <span>{fdv}</span>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <span>CA: {row.pairAddress}</span>
                  </Item>
                </Grid>
                <Grid size={6}>
                  <Item>
                    <span>Pair Created: </span>
                    <span>{calculateAge(new Date(row.pairCreatedAt).toLocaleString())} ago</span>
                  </Item>
                </Grid>
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
