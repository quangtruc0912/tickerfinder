import { Fade, TableCell, TableRow, Box, Avatar } from '@mui/material';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { PriorityPair } from '../models';
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
  row: PriorityPair; // Typing the `row` prop as RowData
}

export default function BodyPriorityPairRow({ row }: BodyRowProps) {
  const theme = useTheme();
  const USD = Number(row.sell);
  const price = numberFormat(USD);
  const kucoinLogo = `content/kucoin-logo.svg`;
  const logo = `content/${row.ticker.toUpperCase()}.svg`;
  const percent_change24h = Number(row.changeRate).toFixed(2);

  //   const marketCap = numberFormat(row.marketCap, {
  //     notation: 'compact',
  //     compactDisplay: 'short',
  //   });
  const volume_24 = numberFormat(Number(row.volValue));

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
    padding: theme.spacing(0.5),
    textAlign: 'center',
    flexGrow: 1,
    border: `2px solid ${theme.palette.divider}`, // Thicker and more visible border
    borderRadius: theme.shape.borderRadius, // Optional: keep border rounded for better visuals
  }));
  return (
    <TableRow
      sx={{
        backgroundColor: 'background.default', // Theme-aware
        color: 'text.primary', // Theme-aware
      }}>
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
        title={row.buy} // The full text will appear when you hover over the cell
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
            src={chrome.runtime.getURL(logo)}
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
              <Item>{row.name}</Item>
            </Grid>
            <Grid size={4}>
              <Item>{row.ticker}</Item>
            </Grid>
            {/* <Grid size={6}>
                            <Item>
                                <div>
                                    <span>MKT Cap:</span>
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
                        </Grid> */}
            <Grid size={12}>
              <Item>
                <div>
                  <span>VOL 24H:</span>
                  <SwitchTransition>
                    <CSSTransition
                      key={volume_24} // Ensure unique key for transitions
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
