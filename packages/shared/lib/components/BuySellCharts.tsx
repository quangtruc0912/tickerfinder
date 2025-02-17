import React, { useMemo, memo, useEffect, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BuySellChart = memo(({ buys, sells }: { buys: number; sells: number }) => {
  const chartRef = useRef<ChartJS<'pie'> | null>(null);

  const data = useMemo(
    () => ({
      labels: ['Buys', 'Sells'],
      datasets: [
        {
          data: [buys, sells],
          backgroundColor: ['green', 'red'],
          borderWidth: 0,
        },
      ],
    }),
    [buys, sells],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      animation: { duration: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (chartRef.current) {
      // Update chart data without destroying and recreating the chart
      chartRef.current.data = data;
      chartRef.current.update();
    }
  }, [data]);

  return (
    <div>
      <Pie ref={chartRef} data={data} options={options} width={20} height={20} />
    </div>
  );
});

export default BuySellChart;
