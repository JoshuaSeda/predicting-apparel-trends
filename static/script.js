// Speech helper
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

let chart;
let chartData = {};

// Handle form submission (Get Forecast)
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  speak('Getting Forecast');

  const fileInput = document.getElementById('csvFile');
  const months    = document.getElementById('forecastMonths').value;

  if (!fileInput.files.length) {
    alert('Please upload a CSV file.');
    return;
  }

  const form = new FormData();
  form.append('file', fileInput.files[0]);
  form.append('months', months);

  const res = await fetch('/forecast', {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Forecast failed.');
    return;
  }

  const data = await res.json();
  chartData = {
    labels: data.months,
    datasets: [
      ...buildSet('Jacket', data.results.jacket.past, data.results.jacket.forecast, '#1d3557', '#457b9d'),
      ...buildSet('Tshirt', data.results.tshirt.past, data.results.tshirt.forecast, '#2a9d8f', '#52b69a'),
      ...buildSet('Shorts', data.results.shorts.past, data.results.shorts.forecast, '#e76f51', '#f28482')
    ]
  };

  drawChart();
  document.getElementById('showSummaryBtn').disabled = false;
});

// Build dataset arrays for Chart.js
function buildSet(label, past, future, pastColor, futureColor) {
  return [
    {
      label: `${label} - Past`,
      data: [...past, ...Array(future.length).fill(null)],
      borderColor: pastColor,
      tension: 0.4,
      fill: false
    },
    {
      label: `${label} - Forecast`,
      data: [...Array(past.length).fill(null), ...future],
      borderColor: futureColor,
      borderDash: [5, 5],
      tension: 0.4,
      fill: false
    }
  ];
}

// Draw or redraw the line chart
function drawChart() {
  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: { legend: { position: 'top' } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Sales' } },
        x: { title: { display: true, text: 'Month' } }
      }
    }
  });
}

// CSV tooltip hover
const tipIcon = document.querySelector('.tooltip-icon');
const tipBox  = document.querySelector('.csv-tooltip');
tipIcon.addEventListener('mouseenter', () => tipBox.style.display = 'block');
tipIcon.addEventListener('mouseleave', () => tipBox.style.display = 'none');

// Summary popup controls
const showBtn  = document.getElementById('showSummaryBtn');
const closeBtn = document.getElementById('closeSummaryBtn');
const popup    = document.getElementById('summaryPopup');
const content  = document.getElementById('summaryContent');

showBtn.addEventListener('click', () => {
  speak('Showing Summary');
  content.innerHTML = generateSummary(chartData);
  popup.classList.add('show');
});

closeBtn.addEventListener('click', () => {
  popup.classList.remove('show');
});

// Generate the summary HTML
function generateSummary(data) {
  if (!data || !data.datasets) return '<p>No data available.</p>';
  let html = '';
  ['Jacket','Tshirt','Shorts'].forEach(item => {
    const pastSet = data.datasets.find(d=>d.label===`${item} - Past`).data.filter(v=>v!=null);
    const futSet  = data.datasets.find(d=>d.label===`${item} - Forecast`).data.filter(v=>v!=null);
    const avgPast = pastSet.reduce((a,b)=>a+b,0)/pastSet.length || 0;
    const avgFut  = futSet.reduce((a,b)=>a+b,0)/futSet.length || 0;
    const up      = avgFut > avgPast;
    const diff    = Math.abs((avgFut - avgPast).toFixed(1));
    const all     = [...pastSet, ...futSet];
    const maxVal  = Math.max(...all);
    const minVal  = Math.min(...all);
    const maxMon  = data.labels[all.indexOf(maxVal)];
    const minMon  = data.labels[all.indexOf(minVal)];

    html += `
      <p>${item} shows an <strong>${up ? 'upward' : 'downward'}</strong> trend: forecast avg is ${diff} units ${up ? 'higher' : 'lower'}.</p>
      <p>Peak in <em>${maxMon}</em> (${maxVal}), low in <em>${minMon}</em> (${minVal}).</p><hr/>`;
  });
  return html;
}
