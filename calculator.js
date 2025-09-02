(function () {
  // Tank catalog: Diameter × Height (inch) → Approx resin volume (cu ft)
  // Values marked "~" are typical estimates; adjust to your specs if needed.
  const tanks = [
    { label: '10" × 48" (Overall)',  dia: 10, h: 48, cuft: 1.0 },
    { label: '12" × 52" (Overall)',  dia: 12, h: 52, cuft: 2.0 },
    { label: '14" × 65" (Overall)',  dia: 14, h: 65, cuft: 3.0 },
    { label: '16" × 65" (Overall)',  dia: 16, h: 65, cuft: 4.0 },     // ~4 ft³ typical
    { label: '21" × 62" (Overall)',  dia: 21, h: 62, cuft: 7.0 },     // ~7 ft³ typical
    { label: '24" × 60" (Straight Wall)', dia: 24, h: 60, cuft: 10.0 },
    { label: '30" × 60" (Straight Wall)', dia: 30, h: 60, cuft: 15.0 },
    { label: '36" × 60" (Straight Wall)', dia: 36, h: 60, cuft: 20.0 },
    { label: '42" × 60" (Straight Wall)', dia: 42, h: 60, cuft: 21.0 }, // ~21 ft³ typical
    { label: '42" × 72" (Straight Wall)', dia: 42, h: 72, cuft: 25.0 },
    { label: '48" × 60" (Straight Wall)', dia: 48, h: 60, cuft: 35.0 },
    { label: '48" × 72" (Straight Wall)', dia: 48, h: 72, cuft: 42.0 }, // ~42 ft³ typical
    { label: '54" × 60" (Straight Wall)', dia: 54, h: 60, cuft: 50.0 },
    { label: '60" × 60" (Straight Wall)', dia: 60, h: 60, cuft: 65.0 },
  ];

  const el = (id) => document.getElementById(id);

  function initTankSelect() {
    const sel = el('tankSelect');
    sel.innerHTML = '';
    tanks.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${t.label} — ${t.cuft} ft³`;
      sel.appendChild(opt);
    });
    // Set initial resin ft³ from first option
    el('resinCuFt').value = tanks[0].cuft;
    sel.addEventListener('change', () => {
      const t = tanks[Number(sel.value)];
      if (t) el('resinCuFt').value = t.cuft;
    });
  }

  function inferSaltDoseFromPreset(grainsPerFt3) {
    switch (Number(grainsPerFt3)) {
      case 20000: return 6;
      case 24000: return 9;
      case 27000: return 12;
      case 30000: return 15;
      default: return null;
    }
  }

  function num(v) { return parseFloat(v); }
  function fmt(n, digits = 0) {
    if (!isFinite(n)) return '-';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
  }

  function calculate() {
    const hardnessGpg = num(el('hardnessGpg').value);
    const iron = num(el('ironPpm').value) || 0;
    const mn = num(el('manganesePpm').value) || 0;
    const dailyUse = num(el('dailyUseGpd').value);

    const perVesselResin = num(el('resinCuFt').value);
    const vesselCount = Math.max(1, Math.floor(num(el('vesselCount').value) || 1));
    const totalResinCuFt = perVesselResin * vesselCount;

    const capPerFt3 = num(el('saltPreset').value); // grains per ft³ preset
    const saltDoseInput = el('saltDose').value.trim();
    const saltDose = saltDoseInput ? num(saltDoseInput) : inferSaltDoseFromPreset(capPerFt3);

    const resultsDiv = el('results');

    // Basic validation
    if (!hardnessGpg || hardnessGpg <= 0 || !dailyUse || dailyUse <= 0 || !perVesselResin || perVesselResin <= 0 || !capPerFt3 || capPerFt3 <= 0) {
      resultsDiv.innerHTML = `<div class="muted">Please enter valid positive numbers for hardness, daily use, resin ft³, and capacity preset.</div>`;
      return;
    }

    // Effective hardness with Fe & Mn penalties
    const effHardness = hardnessGpg + 3 * (iron || 0) + 2 * (mn || 0);

    // Total capacity (grains) for the whole system (single or dual)
    const totalCapacityGr = capPerFt3 * totalResinCuFt;

    // Throughput (gallons) before and after 10% safety factor (system-level)
    const capacityGalRaw = totalCapacityGr / effHardness;
    const capacityGalSafe = capacityGalRaw * 0.90; // 10% safety factor applied

    // Days between regenerations (system-level)
    const regenDays = capacityGalSafe / dailyUse;

    // Salt per regeneration (system & per vessel)
    const saltPerRegenSystem = (saltDose || 0) * totalResinCuFt;
    const saltPerRegenPerVessel = (saltDose || 0) * perVesselResin;

    resultsDiv.innerHTML = `
      <table>
        <tbody>
          <tr>
            <th>Configuration</th>
            <td>${vesselCount === 2 ? 'Dual / Parallel' : 'Single'}</td>
          </tr>
          <tr>
            <th>Resin Volume</th>
            <td>${fmt(perVesselResin, 2)} ft³ per vessel × ${vesselCount} = <strong>${fmt(totalResinCuFt, 2)} ft³ total</strong></td>
          </tr>
          <tr>
            <th>Capacity Curve Selected</th>
            <td>${fmt(capPerFt3)} grains/ft³ ${
              saltDose ? `<span class="badge">~${fmt(saltDose)} lb/ft³</span>` : ''
            }</td>
          </tr>
          <tr>
            <th>Effective Hardness</th>
            <td>${fmt(effHardness, 2)} gpg <span class="muted">(= Hardness + 3×Fe + 2×Mn)</span></td>
          </tr>
          <tr>
            <th>Total Capacity (system)</th>
            <td>${fmt(totalCapacityGr)} grains</td>
          </tr>
          <tr>
            <th>Throughput (no safety)</th>
            <td>${fmt(capacityGalRaw)} gallons</td>
          </tr>
          <tr>
            <th>Throughput with 10% Safety</th>
            <td>${fmt(capacityGalSafe)} gallons <span class="badge">× 0.90</span></td>
          </tr>
          <tr>
            <th>Daily Water Use</th>
            <td>${fmt(dailyUse)} gpd</td>
          </tr>
          <tr>
            <th>Estimated Regen Interval</th>
            <td>${fmt(regenDays, 2)} days</td>
          </tr>
          <tr>
            <th>Salt per Regeneration (system)</th>
            <td>${fmt(saltPerRegenSystem)} lb ${
              vesselCount > 1 ? `<span class="muted">(= ${fmt(saltPerRegenPerVessel)} lb per vessel)</span>` : ''
            }</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    // populate tank sizes
    const sel = document.getElementById('tankSelect');
    tanks.forEach((t, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = `${t.label} — ${t.cuft} ft³`;
      sel.appendChild(opt);
    });
    // set default resin ft³ from first option
    document.getElementById('resinCuFt').value = tanks[0].cuft;

    sel.addEventListener('change', () => {
      const t = tanks[Number(sel.value)];
      if (t) document.getElementById('resinCuFt').value = t.cuft;
    });

    document.getElementById('calcBtn').addEventListener('click', calculate);
  });
})();
