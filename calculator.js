(function () {
  const el = (id) => document.getElementById(id);

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
    const resinCuFt = num(el('resinCuFt').value);
    const capPerFt3 = num(el('saltPreset').value); // grains per ft³ preset
    const saltDoseInput = el('saltDose').value.trim();
    const saltDose = saltDoseInput ? num(saltDoseInput) : inferSaltDoseFromPreset(capPerFt3);

    const resultsDiv = el('results');

    if (!hardnessGpg || hardnessGpg <= 0 || !dailyUse || dailyUse <= 0 || !resinCuFt || resinCuFt <= 0 || !capPerFt3 || capPerFt3 <= 0) {
      resultsDiv.innerHTML = `<div class="muted">Please enter valid positive numbers for hardness, daily use, resin ft³, and capacity preset.</div>`;
      return;
    }

    // Effective hardness
    const effHardness = hardnessGpg + 3 * (iron || 0) + 2 * (mn || 0);

    // Total capacity (grains)
    const totalCapacityGr = capPerFt3 * resinCuFt;

    // Throughput (gallons) before and after 10% safety factor
    const capacityGalRaw = totalCapacityGr / effHardness;
    const capacityGalSafe = capacityGalRaw * 0.90;

    // Days between regenerations
    const regenDays = capacityGalSafe / dailyUse;

    // Salt per regeneration (lb)
    const saltPerRegen = (saltDose || 0) * resinCuFt;

    resultsDiv.innerHTML = `
      <table>
        <tbody>
          <tr><th>Resin Volume</th><td>${fmt(resinCuFt, 2)} ft³</td></tr>
          <tr><th>Capacity Curve</th><td>${fmt(capPerFt3)} grains/ft³ ${saltDose ? `<span class="badge">~${fmt(saltDose)} lb/ft³</span>` : ''}</td></tr>
          <tr><th>Effective Hardness</th><td>${fmt(effHardness, 2)} gpg</td></tr>
          <tr><th>Total Capacity</th><td>${fmt(totalCapacityGr)} grains</td></tr>
          <tr><th>Throughput (no safety)</th><td>${fmt(capacityGalRaw)} gallons</td></tr>
          <tr><th>Throughput with 10% Safety</th><td>${fmt(capacityGalSafe)} gallons</td></tr>
          <tr><th>Daily Water Use</th><td>${fmt(dailyUse)} gpd</td></tr>
          <tr><th>Estimated Regen Interval</th><td>${fmt(regenDays, 2)} days</td></tr>
          <tr><th>Salt per Regeneration</th><td>${fmt(saltPerRegen)} lb</td></tr>
        </tbody>
      </table>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calcBtn').addEventListener('click', calculate);
  });
})();
