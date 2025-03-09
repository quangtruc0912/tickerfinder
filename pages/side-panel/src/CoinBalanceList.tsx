import CoinBalanceItem from './CoinBalanceItem';
import { TokenBalanceData } from '@extension/storage';
interface CoinBalanceListProps {
  tokenBalance: TokenBalanceData[]; // Replace 'any' with the appropriate type if known
}

const CoinBalanceList: React.FC<CoinBalanceListProps> = ({ tokenBalance }) => {
  const sortedTokens = [...tokenBalance]
    .map(token => ({
      ...token,
      tokenCoinPrice:
        (Number(token.value) / 10 ** Number(token.token.decimals)) * Number(token.token_cex.exchange_rate),
    }))
    .sort((a, b) => b.tokenCoinPrice - a.tokenCoinPrice);

  return (
    <div>
      {sortedTokens.map((token, index) => (
        <CoinBalanceItem key={index} item={token} />
      ))}
    </div>
  );
};

export default CoinBalanceList;
