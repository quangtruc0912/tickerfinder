import React, { useState, useEffect } from 'react';

interface TickerProps {
  name: string;
}
const TickerPopup = (props: TickerProps) => {
  const [tickerInfo, setTickerInfo] = useState<TickerProps>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  //   const fetchTicker = async (url : string) => {
  //     try {
  //     //   const response = await fetch(`https://api.github.com/repos/${url}`);
  //     //   const data = await response.json();
  //     //   if (response.ok) {
  //         setRepoInfo(props.name)
  //     } catch (err) {
  //       setError('Error fetching ticker data.');
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  useEffect(() => {
    setTickerInfo(props);
  }, []);

  return (
    <div>
      <h1>Ticker Preview</h1>
      <div>
        {isLoading && <p>Loading ticker data...</p>}
        {error && <p>{error}</p>}
        {tickerInfo?.name && !isLoading && !error && (
          <div>
            <h2>{tickerInfo.name}</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerPopup;
