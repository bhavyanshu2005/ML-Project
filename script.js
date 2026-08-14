// ---- Build tick marks on the dial ----
(function buildTicks() {
  const ticksGroup = document.getElementById('ticks');
  const cx = 160, cy = 180, rOuter = 130, rInner = 120;
  const startDeg = -180, endDeg = 0; // semicircle
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const deg = startDeg + (i / steps) * (endDeg - startDeg);
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + rOuter * Math.cos(rad);
    const y1 = cy + rOuter * Math.sin(rad);
    const x2 = cx + rInner * Math.cos(rad);
    const y2 = cy + rInner * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1.toFixed(1));
    line.setAttribute('y1', y1.toFixed(1));
    line.setAttribute('x2', x2.toFixed(1));
    line.setAttribute('y2', y2.toFixed(1));
    ticksGroup.appendChild(line);
  }
})();

const form = document.getElementById('loan-form');
const submitBtn = document.getElementById('submit-btn');
const needleGroup = document.getElementById('needle-group');
const readoutValue = document.getElementById('readout-value');
const readoutCaption = document.getElementById('readout-caption');
const stamp = document.getElementById('verdict-stamp');
const factorsBox = document.getElementById('factors');
const factorsList = document.getElementById('factors-list');

const fieldIds = [
  'no_of_dependents', 'education', 'self_employed', 'income_annum',
  'loan_amount', 'loan_term', 'cibil_score', 'residential_assets_value',
  'commercial_assets_value', 'luxury_assets_value', 'bank_asset_value'
];

const FRIENDLY_NAMES = {
  cibil_score: 'CIBIL score',
  loan_term: 'Loan term',
  loan_amount: 'Loan amount',
  income_annum: 'Annual income',
  luxury_assets_value: 'Luxury assets',
  commercial_assets_value: 'Commercial assets',
  residential_assets_value: 'Residential assets',
  bank_asset_value: 'Bank deposits',
  no_of_dependents: 'Dependents',
  self_employed: 'Self-employed status',
  education: 'Education',
};

function setNeedle(probability) {
  // probability 0-100 -> angle -90deg (full reject) to 90deg (full approve)
  const angle = -90 + (probability / 100) * 180;
  needleGroup.style.transform = `rotate(${angle}deg)`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Reviewing…';
  stamp.classList.remove('show', 'rejected');
  readoutCaption.textContent = 'Reviewing application…';

  const payload = {};
  fieldIds.forEach((id) => {
    const el = document.getElementById(id);
    payload[id] = el.value;
  });

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'Prediction failed');
    }

    setNeedle(data.approved_probability);
    readoutValue.textContent = data.decision.toUpperCase();
    readoutCaption.textContent = `${data.approved_probability}% approval confidence`;

    stamp.textContent = data.decision === 'Approved' ? 'VERIFIED' : 'DECLINED';
    stamp.classList.toggle('rejected', data.decision !== 'Approved');
    // force reflow so the animation replays every submit
    stamp.classList.remove('show');
    void stamp.offsetWidth;
    stamp.classList.add('show');

    factorsList.innerHTML = '';
    data.top_factors.forEach((f) => {
      const li = document.createElement('li');
      li.textContent = FRIENDLY_NAMES[f] || f;
      factorsList.appendChild(li);
    });
    factorsBox.hidden = false;
  } catch (err) {
    readoutCaption.textContent = 'Something went wrong — check the console';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector('span').textContent = 'Submit to Underwriting';
  }
});
