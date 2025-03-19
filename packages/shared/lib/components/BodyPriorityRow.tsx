import { Fade, TableCell, TableRow, Box, Avatar, IconButton } from '@mui/material';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { PriorityPair } from '../models';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState, useEffect, memo } from 'react';
import { KuCoinData, useWatchListStorage } from '@extension/storage';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { generateUUID } from '../utils/index';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  row: PriorityPair; // Typing the `row` prop as RowData
  memoizedKucoinData: KuCoinData[];
}

const BodyPriorityPairRow = memo(({ row, memoizedKucoinData }: BodyRowProps) => {
  const memoizedRow = useMemo(() => row, [row.ticker, row.sell, row.volValue, row.changeRate]); // ✅ Only updates if actual values change
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const theme = useTheme();
  const USD = Number(row.sell);
  const price = numberFormat(USD);
  const kucoinLogo = `content/kucoin-logo.svg`;
  const logo = `content/${row.ticker.toUpperCase()}.svg`;
  const uuid = generateUUID();
  const percent_change24h = Number(row.changeRate);
  const [logoUrl, setLogoUrl] = useState(`content/${row.ticker.toUpperCase()}.svg`);
  const volume_24 = useMemo(
    () =>
      numberFormat(Number(row.volValue), {
        notation: 'compact',
        compactDisplay: 'short',
      }),
    [row.volValue],
  );

  const renderPercentage = (num: number) => {
    if (num > 0) {
      return (
        <Box display="flex" justifyContent="flex-end" alignItems="center" color={'success.main'}>
          <ArrowDropUpIcon color={'success'} />
          <span>{(num * 100).toFixed(2)}%</span>
        </Box>
      );
    }
    if (num === 0) {
      <Box display={'flex'} justifyContent="flex-end" alignItems="center">
        <span> {num.toString().replace('-', '')}%</span>
      </Box>;
    }

    return (
      <Box display={'flex'} justifyContent="flex-end" alignItems="center" color={'error.main'}>
        <ArrowDropDownIcon />
        <span> {(num * 100).toFixed(2).toString().replace('-', '')}%</span>
      </Box>
    );
  };
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    ...theme.typography.body2,
    padding: theme.spacing(0.5),
    textAlign: 'center',
    border: `2px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  }));

  const checkWatchlist = async () => {
    const watchlist = await useWatchListStorage.getWatchlist();
    const isAdded = watchlist.some(listItem => listItem.symbol === row.ticker && listItem.isPriority === true);
    setIsInWatchlist(isAdded);
  };
  useEffect(() => {
    checkWatchlist();
  }, [memoizedRow, memoizedKucoinData]);

  useEffect(() => {
    const checkLogo = async () => {
      const dir = `content/${memoizedRow.ticker.toUpperCase()}.svg`;
      const fileUrl = chrome.runtime.getURL(dir);

      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          setLogoUrl(`content/${memoizedRow.ticker.toUpperCase()}.svg`);
        } else {
          throw new Error('File not found');
        }
      } catch (error) {
        const ca = memoizedKucoinData.find(item => item.symbol.toLowerCase() === memoizedRow.ticker.toLowerCase());
        if (ca) {
          setLogoUrl(ca.image);
        }
      }
    };

    checkLogo();
  }, [memoizedRow, memoizedKucoinData]);

  const handleToggle = async () => {
    if (isInWatchlist) {
      chrome.runtime.sendMessage({ type: 'REMOVE_PRIORITY_FROM_WATCHLIST', name: row.name }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error removing from watchlist:", chrome.runtime.lastError);
        // } else {
        //   console.log("Removed from priority watchlist:", response);
        // }
      });
    } else {
      const index = await useWatchListStorage.maxIndex();
      const watchlistItem = {
        guidID: uuid,
        address: '',
        isPriority: true,
        name: row.name,
        symbol: row.ticker,
        url: '',
        dexId: '',
        chainId: '',
        changeRate24h: row.changeRate,
        price: row.sell,
        imageUrl: logoUrl,
        changeRate5m: '0',
        changeRate1h: '0',
        changeRate6h: '0',
        index: index + 1,
      };
      chrome.runtime.sendMessage({ type: 'ADD_TO_WATCHLIST', item: watchlistItem }, response => {
        // if (chrome.runtime.lastError) {
        //   console.error("Error adding to watchlist:", chrome.runtime.lastError);
        // } else {
        //   console.log("Added to priority watchlist:", response);
        // }
      });
    }
    checkWatchlist();
    setIsInWatchlist(prev => !prev);
  };

  return (
    <TableRow
      hover
      sx={{
        backgroundColor: 'background.default', // Theme-aware
        color: 'text.primary', // Theme-aware
        cursor: 'pointer', // Indicate that the row is clickable
        '&:hover': {
          backgroundColor: 'action.hover', // Theme-aware hover background color
          border: '2px solid', // Add a border on hover
          borderColor: 'primary.main', // Theme-aware border color
          borderRadius: '4px', // Optional: Add rounded corners for better visuals
        },
        borderBottom: `1px solid ${theme.palette.divider}`, // White line or divider line at the bottom
      }}
      onClick={() => window.open(`https://www.kucoin.com/trade/${row.ticker.toUpperCase()}-USDT`, '_blank')}>
      <TableCell>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconButton
            onClick={event => {
              event.stopPropagation(); // Prevent the click from bubbling to the TableRow
              handleToggle();
            }}
            color={isInWatchlist ? 'warning' : 'default'}>
            {isInWatchlist ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
          <IconButton
            style={{
              backgroundColor: 'white', // Optional: To make the button stand out
              padding: 4,
            }}
            size="small"
            onClick={event => {
              // event.stopPropagation();
              // handleRedirect(item);
            }}>
            <OpenInNewIcon fontSize="small" sx={{ fontSize: 10 }} />
          </IconButton>
        </div>
      </TableCell>
      <TableCell
        title={`Dex : Kucoin`} // The full text will appear when you hover over the cell
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
          <Avatar
            src={chrome.runtime.getURL(kucoinLogo)}
            sx={{
              width: 50,
              height: 50,
              mr: 1,
            }}
          />
        </Box>
      </TableCell>
      <TableCell
        title={row.name} // The full text will appear when you hover over the cell
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
        <Avatar
          src={logoUrl.startsWith('https') ? logoUrl : chrome.runtime.getURL(logoUrl)}
          sx={{
            width: 50,
            height: 50,
            mr: 1,
          }}
        />
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
              <Item>{row.name}</Item>
            </Grid>
            <Grid size={4}>
              <Item>{row.ticker.toUpperCase()}</Item>
            </Grid>
            <Grid size={12}>
              <Item>VOL 24H: {volume_24}</Item>
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
      </TableCell>
    </TableRow>
  );
});

export default BodyPriorityPairRow;
