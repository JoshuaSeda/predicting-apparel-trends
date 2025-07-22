let chart;
let chartData = {};

function selectTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.style.display = 'none');
  document.getElementById(tabName).style.display = 'block';

  document.querySelectorAll('.tab-buttons button').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  chart.data.datasets.forEach(ds => {
    ds.hidden = !(ds.label.toLowerCase().includes(tabName));
  });
  chart.update();
}

function toggleSeries(item) {
  const dataset = chart.data.datasets.find(ds => ds.label.toLowerCase().includes(item));
  dataset.hidden = !dataset.hidden;
  chart.update();
}

function createInputs() {
  ['jacket', 'tshirt', 'shorts'].forEach(item => {
    const container = document.getElementById(`${item}-inputs`);
    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.placeholder = '0';
      container.appendChild(input);
    }
  });
}

async function getForecast() {
  const months = parseInt(document.getElementById('forecastMonths').value);

  const getData = (item) => {
    const inputs = document.querySelectorAll(`#${item}-inputs input`);
    return Array.from(inputs).map(input => parseFloat(input.value) || 0);
  };

  const payload = {
    months,
    jacket: getData('jacket'),
    tshirt: getData('tshirt'),
    shorts: getData('shorts')
  };

  const response = await fetch('/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    alert('Failed to fetch forecast.');
    return;
  }

  const data = await response.json();
  const labels = data.months;

  const buildSet = (label, past, forecast, color, forecastColor = 'red') => [
    {
      label: `${label} - Past`,
      data: [...past, ...Array(forecast.length).fill(null)],
      borderColor: color,
      borderDash: [],
      fill: false
    },
    {
      label: `${label} - Forecast`,
      data: [...Array(past.length).fill(null), ...forecast],
      borderColor: forecastColor,
      borderDash: [5, 5],
      fill: false
    }
  ];

  chartData = {
    labels,
    datasets: [
      ...buildSet("Jacket", data.results.jacket.past, data.results.jacket.forecast, 'blue', 'blue'),
      ...buildSet("Tshirt", data.results.tshirt.past, data.results.tshirt.forecast, 'green', 'green'),
      ...buildSet("Shorts", data.results.shorts.past, data.results.shorts.forecast, 'orange', 'orange'),
    ]
  };

  drawChart();
}

function drawChart() {
  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      animation: false,
      plugins: { legend: { position: 'top' } },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Sales' }
        },
        x: {
          title: { display: true, text: 'Month' }
        }
      }
    }
  });
}

window.onload = () => {
  createInputs();
  document.getElementById('defaultTab').click();
};
