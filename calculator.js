(function () {
  const el = (id) => document.getElementById(id);

  function inferSaltDoseFromPreset(grainsPerFt3) {
    switch (Number(grainsPerFt3)) {
      case 20000: return 6;
      case 24000: return 9;
      case 27000: return 12;
      case 30000: return 15;   // 15 lb/ft³ ≈ 30,000 grains/ft³
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
    const saltDoseLbPerFt3 = saltDoseInput ? num(saltDoseInput) : inferSaltDoseFromPreset(capPerFt3);

    const safetyPct = num(el('safetyPct').value);
    const reservePct = num(el('reservePct').value) || 0;

    const resultsDiv = el('results');

    // Basic validation
    if (!hardnessGpg || hardnessGpg <= 0 || !dailyUse || dailyUse <= 0 || !resinCuFt || resinCuFt <= 0 || !capPerFt3 || capPerFt3 <= 0) {
      resultsDiv.innerHTML = `<div class="muted">Please enter valid positive numbers for hardness, daily use, resin ft³, and capacity preset.</div>`;
      return;
    }

    const safetyFrac = Math.max(0, Math.min(1, (isNaN(safetyPct) ? 10 : safetyPct) / 100));
    const reserveFrac = Math.max(0, Math.min(1, reservePct / 100));

    // Effective hardness with Fe & Mn penalties
    const effHardness = hardnessGpg + 3 * iron + 2 * mn;

    // Daily grain load
    const dailyGrains = effHardness * dailyUse;

    // Total capacity (grains)
    const totalCapacityGr = capPerFt3 * resinCuFt;

    // Throughput (gallons)
    const capacityGalRaw = totalCapacityGr / effHardness;
    const capacityGalSafety = capacityGalRaw * (1 - safetyFrac);
    const capacityGalOperational = capacityGalSafety * (1 - reserveFrac); // optional extra derate

    // Days between regenerations
    const regenDays = capacityGalOperational / dailyUse;

    // Salt use & efficiency
    const saltPerRegenLb = (saltDoseLbPerFt3 || 0) * resinCuFt;
    const saltEfficiencyGrPerLb = saltPerRegenLb > 0 ? totalCapacityGr / saltPerRegenLb : NaN;
    const saltPerDayLb = regenDays > 0 ? saltPerRegenLb / regenDays : NaN;
    const saltPer30DaysLb = isFinite(saltPerDayLb) ? saltPerDayLb * 30 : NaN;

    resultsDiv.innerHTML = `
      <table>
        <tbody>
          <tr><th>Resin Volume</th><td>${fmt(resinCuFt, 2)} ft³</td></tr>
          <tr><th>Capacity Curve</th><td>${fmt(capPerFt3)} grains/ft³ ${
            saltDoseLbPerFt3 ? `<span class="badge">~${fmt(saltDoseLbPerFt3)} lb/ft³</span>` : ''
          }</td></tr>
          <tr><th>Effective Hardness</th><td>${fmt(effHardness, 2)} gpg</td></tr>
          <tr><th>Daily Grain Load</th><td>${fmt(dailyGrains)} grains/day</td></tr>
          <tr><th>Total Capacity (no safety)</th><td>${fmt(totalCapacityGr)} grains</td></tr>
          <tr><th>Throughput (no safety)</th><td>${fmt(capacityGalRaw)} gallons</td></tr>
          <tr><th>Safety Factor Applied</th><td>${fmt(safetyFrac * 100, 2)} %</td></tr>
          <tr><th>Operational Reserve Applied</th><td>${fmt(reserveFrac * 100, 2)} %</td></tr>
          <tr><th>Throughput After Safety</th><td>${fmt(capacityGalSafety)} gallons</td></tr>
          <tr><th>Operational Throughput</th><td>${fmt(capacityGalOperational)} gallons</td></tr>
          <tr><th>Daily Water Use</th><td>${fmt(dailyUse)} gpd</td></tr>
          <tr><th>Estimated Regen Interval</th><td>${fmt(regenDays, 2)} days</td></tr>
          <tr><th>Salt per Regeneration</th><td>${fmt(saltPerRegenLb)} lb</td></tr>
          <tr><th>Salt Efficiency</th><td>${isFinite(saltEfficiencyGrPerLb) ? fmt(saltEfficiencyGrPerLb, 0) : '-'} grains/lb</td></tr>
          <tr><th>Estimated Salt Use</th><td>${isFinite(saltPerDayLb) ? fmt(saltPerDayLb, 2) : '-'} lb/day — ${isFinite(saltPer30DaysLb) ? fmt(saltPer30DaysLb, 1) : '-'} lb/30 days</td></tr>
        </tbody>
      </table>
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calcBtn').addEventListener('click', calculate);
  });
})();
