import { useEffect, useRef } from 'react';
import {
  Chart,
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend);

export default function ClickChart({ history }) {

  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    const buckets = {};

    history.forEach((ts) => {
      const date  = new Date(ts);
      const label = date.toLocaleString('en-US', {
        month:  'short',
        day:    'numeric',
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      buckets[label] = (buckets[label] || 0) + 1;
    });
    const labels = Object.keys(buckets).sort();
    const values = labels.map((l) => buckets[l]);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label:           'Clicks',
          data:            values,
          backgroundColor: 'rgba(59, 130, 246, 0.6)', 
          borderColor:     'rgba(59, 130, 246, 1)',
          borderWidth:     1,
          borderRadius:    4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },  
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} click${ctx.raw !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#71717a', font: { size: 11 } }, 
            grid:  { color: 'rgba(255,255,255,0.05)' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color:     '#71717a',
              precision: 0,       
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };

  }, [history]);

  return (
    <canvas
      ref={canvasRef}   
      height={120}
    />
  );
}