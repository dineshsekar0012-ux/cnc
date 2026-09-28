/**
 * CNC Predictive Maintenance System - Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('prediction-form');
  const predictBtn = document.getElementById('predict-btn');
  const machineSelect = document.getElementById('machine-id');
  const typeBadge = document.getElementById('type-badge');
  const customTypeGroup = document.getElementById('custom-type-group');
  const machineTypeVal = document.getElementById('machine-type-val');
  const timestampEl = document.getElementById('current-timestamp');

  // Input Fields & Range Sliders
  const airTempInput = document.getElementById('air-temp');
  const airTempRange = document.getElementById('air-temp-range');
  const airTempC = document.getElementById('air-temp-c');

  const procTempInput = document.getElementById('proc-temp');
  const procTempRange = document.getElementById('proc-temp-range');
  const procTempC = document.getElementById('proc-temp-c');

  const rotSpeedInput = document.getElementById('rot-speed');
  const rotSpeedRange = document.getElementById('rot-speed-range');

  const torqueInput = document.getElementById('torque');
  const torqueRange = document.getElementById('torque-range');

  const toolWearInput = document.getElementById('tool-wear');
  const toolWearRange = document.getElementById('tool-wear-range');

  // Results Elements
  const mainStatusBanner = document.getElementById('main-status-banner');
  const mainStatusIcon = document.getElementById('main-status-icon');
  const mainStatusTitle = document.getElementById('main-status-title');
  const mainStatusDesc = document.getElementById('main-status-desc');

  const valFailureProb = document.getElementById('val-failure-prob');
  const barFailureProb = document.getElementById('bar-failure-prob');
  const valHealthScore = document.getElementById('val-health-score');
  const barHealthScore = document.getElementById('bar-health-score');
  const valRiskLevel = document.getElementById('val-risk-level');

  const failureModesSection = document.getElementById('failure-modes-section');
  const failureModesList = document.getElementById('failure-modes-list');

  const rowAirVal = document.getElementById('row-air-val');
  const rowAirStat = document.getElementById('row-air-stat');
  const rowProcVal = document.getElementById('row-proc-val');
  const rowProcStat = document.getElementById('row-proc-stat');
  const rowSpeedVal = document.getElementById('row-speed-val');
  const rowSpeedStat = document.getElementById('row-speed-stat');
  const rowTorqueVal = document.getElementById('row-torque-val');
  const rowTorqueStat = document.getElementById('row-torque-stat');
  const rowWearVal = document.getElementById('row-wear-val');
  const rowWearStat = document.getElementById('row-wear-stat');

  const telemDt = document.getElementById('telem-dt');
  const telemPower = document.getElementById('telem-power');
  const telemOverstrain = document.getElementById('telem-overstrain');

  const recommendationText = document.getElementById('recommendation-text');
  const historyTableBody = document.getElementById('history-table-body');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // History State
  const defaultHistory = [
    { id: 1, machineId: "CNC-001", machineType: "M", airTemp: 298.1, procTemp: 308.6, speed: 4200, torque: 45.2, toolWear: 120, result: "Healthy", risk: "12.4%", time: "16 May 2025, 10:42 AM" },
    { id: 2, machineId: "CNC-002", machineType: "L", airTemp: 301.5, procTemp: 311.2, speed: 3800, torque: 62.3, toolWear: 180, result: "Warning", risk: "56.7%", time: "16 May 2025, 10:35 AM" },
    { id: 3, machineId: "CNC-003", machineType: "L", airTemp: 304.2, procTemp: 315.6, speed: 4500, torque: 78.1, toolWear: 220, result: "At Risk", risk: "82.9%", time: "16 May 2025, 10:28 AM" },
    { id: 4, machineId: "CNC-001", machineType: "M", airTemp: 297.8, procTemp: 307.1, speed: 4100, torque: 40.5, toolWear: 95, result: "Healthy", risk: "8.6%", time: "16 May 2025, 10:20 AM" },
    { id: 5, machineId: "CNC-004", machineType: "L", airTemp: 302.3, procTemp: 312.4, speed: 3900, torque: 65.0, toolWear: 200, result: "Warning", risk: "64.1%", time: "16 May 2025, 10:15 AM" }
  ];

  let predictionHistory = JSON.parse(localStorage.getItem('cnc_pred_history')) || defaultHistory;

  // 1. Live Timestamp Formatter
  function updateTimestamp() {
    const now = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    if (timestampEl) {
      timestampEl.textContent = now.toLocaleDateString('en-GB', options);
    }
  }
  updateTimestamp();
  setInterval(updateTimestamp, 60000);

  // 2. Input Synchronization & Celsius Helpers
  function updateTempDisplays() {
    const aK = parseFloat(airTempInput.value) || 0;
    const pK = parseFloat(procTempInput.value) || 0;
    airTempC.textContent = `(${(aK - 273.15).toFixed(2)} °C)`;
    procTempC.textContent = `(${(pK - 273.15).toFixed(2)} °C)`;
  }

  function bindSync(input, range, callback) {
    input.addEventListener('input', () => {
      range.value = input.value;
      if (callback) callback();
    });
    range.addEventListener('input', () => {
      input.value = range.value;
      if (callback) callback();
    });
  }

  bindSync(airTempInput, airTempRange, updateTempDisplays);
  bindSync(procTempInput, procTempRange, updateTempDisplays);
  bindSync(rotSpeedInput, rotSpeedRange);
  bindSync(torqueInput, torqueRange);
  bindSync(toolWearInput, toolWearRange);
  updateTempDisplays();

  // 3. Machine Selection Handling
  machineSelect.addEventListener('change', () => {
    const selected = machineSelect.options[machineSelect.selectedIndex];
    const type = selected.getAttribute('data-type') || 'M';
    machineTypeVal.value = type;
    
    if (machineSelect.value === 'custom') {
      customTypeGroup.style.display = 'block';
      typeBadge.textContent = 'Custom Machine';
    } else {
      customTypeGroup.style.display = 'none';
      const labelMap = { 'L': 'Low Quality (L)', 'M': 'Medium Quality (M)', 'H': 'High Quality (H)' };
      typeBadge.textContent = `Type: ${type} (${labelMap[type] || 'Standard'})`;
    }
  });

  // Custom Type Buttons
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      machineTypeVal.value = btn.getAttribute('data-type');
      typeBadge.textContent = `Type: ${machineTypeVal.value} (Custom)`;
    });
  });

  // 4. Quick Scenario Presets
  const presets = {
    healthy: {
      machineId: "CNC-001",
      type: "M",
      airTemp: 298.1,
      procTemp: 308.6,
      speed: 4200,
      torque: 45.2,
      toolWear: 120
    },
    warning_wear: {
      machineId: "CNC-002",
      type: "L",
      airTemp: 301.5,
      procTemp: 311.2,
      speed: 3800,
      torque: 62.3,
      toolWear: 180
    },
    power_failure: {
      machineId: "CNC-003",
      type: "L",
      airTemp: 298.9,
      procTemp: 309.1,
      speed: 2861,
      torque: 4.6,
      toolWear: 143
    },
    overstrain: {
      machineId: "CNC-004",
      type: "L",
      airTemp: 298.4,
      procTemp: 308.2,
      speed: 1282,
      torque: 60.7,
      toolWear: 216
    },
    heat_dissipation: {
      machineId: "CNC-005",
      type: "M",
      airTemp: 302.3,
      procTemp: 310.8,
      speed: 1377,
      torque: 47.3,
      toolWear: 34
    }
  };

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const presetKey = chip.getAttribute('data-preset');
      if (presetKey === 'random_sample') {
        loadRandomSample();
        return;
      }

      const p = presets[presetKey];
      if (p) {
        applyParameters(p);
        executePrediction(false);
      }
    });
  });

  function applyParameters(p) {
    if (p.machineId) {
      let optionFound = false;
      for (let i = 0; i < machineSelect.options.length; i++) {
        if (machineSelect.options[i].value === p.machineId) {
          machineSelect.selectedIndex = i;
          optionFound = true;
          break;
        }
      }
      if (!optionFound) {
        machineSelect.value = "custom";
      }
    }
    
    if (p.type) {
      machineTypeVal.value = p.type;
      typeBadge.textContent = `Type: ${p.type}`;
    }

    airTempInput.value = p.airTemp;
    airTempRange.value = p.airTemp;
    procTempInput.value = p.procTemp;
    procTempRange.value = p.procTemp;
    rotSpeedInput.value = p.speed;
    rotSpeedRange.value = p.speed;
    torqueInput.value = p.torque;
    torqueRange.value = p.torque;
    toolWearInput.value = p.toolWear;
    toolWearRange.value = p.toolWear;

    updateTempDisplays();
  }

  function loadRandomSample() {
    // Generate a diverse sample from realistic dataset bounds
    const isFail = Math.random() < 0.35;
    let sample;
    if (isFail) {
      const failTypes = ['twf', 'pwf', 'hdf', 'osf'];
      const pick = failTypes[Math.floor(Math.random() * failTypes.length)];
      if (pick === 'twf') {
        sample = { machineId: "CNC-003", type: "L", airTemp: 298.8, procTemp: 308.9, speed: 1455, torque: 41.3, toolWear: 208 + Math.floor(Math.random() * 35) };
      } else if (pick === 'pwf') {
        sample = { machineId: "CNC-004", type: "M", airTemp: 298.2, procTemp: 308.5, speed: 2678, torque: 10.7, toolWear: 86 };
      } else if (pick === 'hdf') {
        sample = { machineId: "CNC-005", type: "M", airTemp: 302.3, procTemp: 310.8, speed: 1377, torque: 47.3, toolWear: 34 };
      } else {
        sample = { machineId: "CNC-002", type: "L", airTemp: 298.0, procTemp: 308.2, speed: 1348, torque: 58.8, toolWear: 202 };
      }
    } else {
      sample = {
        machineId: "CNC-001",
        type: Math.random() > 0.5 ? "M" : "L",
        airTemp: (297.5 + Math.random() * 3.5).toFixed(1),
        procTemp: (307.5 + Math.random() * 3.5).toFixed(1),
        speed: Math.floor(1380 + Math.random() * 500),
        torque: (35.0 + Math.random() * 20.0).toFixed(1),
        toolWear: Math.floor(Math.random() * 140)
      };
    }
    applyParameters(sample);
    executePrediction(false);
  }

  // 5. Prediction Execution
  async function executePrediction(animate = true) {
    const params = {
      machineId: machineSelect.value === 'custom' ? 'Custom-CNC' : machineSelect.value,
      machineType: machineTypeVal.value || 'M',
      airTemp: parseFloat(airTempInput.value),
      procTemp: parseFloat(procTempInput.value),
      speed: parseFloat(rotSpeedInput.value),
      torque: parseFloat(torqueInput.value),
      toolWear: parseFloat(toolWearInput.value)
    };

    if (animate) {
      predictBtn.disabled = true;
      predictBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Analyzing Machine Telemetry...</span>`;
    }

    let result;
    try {
      // Try backend prediction API first
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          result = data;
        }
      }
    } catch (err) {
      console.log('Backend API unavailable, executing client-side ML engine.');
    }

    // Fallback to client-side ML & Physics Engine
    if (!result && window.ML_ENGINE) {
      result = window.ML_ENGINE.predict(params);
    }

    if (animate) {
      setTimeout(() => {
        renderPredictionResults(result, params);
        predictBtn.disabled = false;
        predictBtn.innerHTML = `<i class="fa-solid fa-chart-line"></i> <span>Predict Machine Status</span>`;
      }, 250);
    } else {
      renderPredictionResults(result, params);
    }
  }

  function renderPredictionResults(res, params) {
    if (!res) return;

    // 1. Status Banner
    mainStatusBanner.className = `status-banner status-${res.statusClass}`;
    mainStatusTitle.textContent = res.statusBadge;

    if (res.statusClass === 'healthy') {
      mainStatusIcon.innerHTML = `<i class="fa-solid fa-check"></i>`;
      mainStatusDesc.textContent = "The machine is operating under normal conditions.";
    } else if (res.statusClass === 'warning') {
      mainStatusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
      mainStatusDesc.textContent = "Machine parameters are approaching operational threshold limits.";
    } else {
      mainStatusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
      mainStatusDesc.textContent = "Critical mechanical stress or breakdown risk detected. Immediate maintenance required.";
    }

    // 2. Metrics Cards
    valFailureProb.textContent = `${res.failureProbability}%`;
    barFailureProb.style.width = `${Math.min(100, Math.max(5, res.failureProbability))}%`;
    
    // Set bar color
    barFailureProb.className = `progress-fill ${res.failureProbability > 50 ? 'fill-red' : (res.failureProbability > 25 ? 'fill-amber' : 'fill-green')}`;

    valHealthScore.textContent = `${res.healthScore} / 100`;
    barHealthScore.style.width = `${res.healthScore}%`;
    barHealthScore.className = `progress-fill ${res.healthScore < 50 ? 'fill-red' : (res.healthScore < 75 ? 'fill-amber' : 'fill-green')}`;

    valRiskLevel.textContent = res.riskLevel;
    if (res.riskLevel.includes('LOW')) {
      valRiskLevel.className = "risk-pill pill-low";
    } else if (res.riskLevel.includes('MODERATE')) {
      valRiskLevel.className = "risk-pill pill-med";
    } else {
      valRiskLevel.className = "risk-pill pill-high";
    }

    // 3. Failure Modes Breakdown
    if (res.failureModes && res.failureModes.length > 0 && res.statusClass !== 'healthy') {
      failureModesSection.style.display = 'block';
      failureModesList.innerHTML = res.failureModes.map(m => `
        <div class="mode-item">
          <div class="mode-item-title">
            <span><i class="fa-solid fa-circle-exclamation"></i> ${m.name}</span>
            <span>${m.probability ? m.probability + '%' : 'High Risk'}</span>
          </div>
          <div class="mode-item-desc">${m.description || 'Abnormal sensor values match known failure fingerprint.'}</div>
        </div>
      `).join('');
    } else {
      failureModesSection.style.display = 'none';
      failureModesList.innerHTML = '';
    }

    // 4. Parameter Status Table
    if (res.parameterStatus && res.parameterStatus.length >= 5) {
      const p = res.parameterStatus;
      
      rowAirVal.textContent = p[0].value;
      rowAirStat.textContent = p[0].status;
      setRowStatus(rowAirStat, p[0].status);

      rowProcVal.textContent = p[1].value;
      rowProcStat.textContent = p[1].status;
      setRowStatus(rowProcStat, p[1].status);

      rowSpeedVal.textContent = p[2].value;
      rowSpeedStat.textContent = p[2].status;
      setRowStatus(rowSpeedStat, p[2].status);

      rowTorqueVal.textContent = p[3].value;
      rowTorqueStat.textContent = p[3].status;
      setRowStatus(rowTorqueStat, p[3].status);

      rowWearVal.textContent = p[4].value;
      rowWearStat.textContent = p[4].status;
      setRowStatus(rowWearStat, p[4].status);
    }

    // Physics Telemetry
    if (res.metrics) {
      telemDt.textContent = `${res.metrics.tempDiff} K`;
      telemPower.textContent = `${(res.metrics.powerWatts / 1000).toFixed(2)} kW`;
      telemOverstrain.textContent = `${res.metrics.overstrain.toLocaleString()} min·Nm`;
    }

    // Recommendation
    recommendationText.textContent = res.recommendation;

    // 5. Add to Prediction History
    addToHistory(params, res);
  }

  function setRowStatus(el, statusText) {
    const parent = el.parentElement;
    const dot = parent.querySelector('.status-dot');
    if (!dot) return;

    if (statusText === 'Normal') {
      dot.className = 'status-dot dot-normal';
      el.className = 'status-text-normal';
    } else if (statusText === 'Moderate' || statusText === 'Low') {
      dot.className = 'status-dot dot-warning';
      el.className = 'status-text-warning';
    } else {
      dot.className = 'status-dot dot-danger';
      el.className = 'status-text-danger';
    }
  }

  // 6. History Management
  function addToHistory(params, res) {
    const now = new Date();
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    const timeStr = now.toLocaleDateString('en-GB', options);

    let resultBadge = "Healthy";
    if (res.statusClass === 'warning') resultBadge = "Warning";
    if (res.statusClass === 'risk') resultBadge = "At Risk";

    const newRecord = {
      id: predictionHistory.length + 1,
      machineId: params.machineId,
      machineType: params.machineType,
      airTemp: params.airTemp,
      procTemp: params.procTemp,
      speed: params.speed,
      torque: params.torque,
      toolWear: params.toolWear,
      result: resultBadge,
      risk: `${res.failureProbability}%`,
      time: timeStr
    };

    // Prepend to history
    predictionHistory.unshift(newRecord);
    // Keep last 50
    if (predictionHistory.length > 50) predictionHistory = predictionHistory.slice(0, 50);

    localStorage.setItem('cnc_pred_history', JSON.stringify(predictionHistory));
    renderHistoryTable();
  }

  function renderHistoryTable() {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = '';

    predictionHistory.forEach((rec, idx) => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-healthy';
      if (rec.result === 'Warning') badgeClass = 'badge-warning';
      if (rec.result === 'At Risk' || rec.result === 'Failure Risk') badgeClass = 'badge-risk';

      tr.innerHTML = `
        <td><strong>${idx + 1}</strong></td>
        <td><strong>${rec.machineId}</strong></td>
        <td>${parseFloat(rec.airTemp).toFixed(1)}</td>
        <td>${parseFloat(rec.procTemp).toFixed(1)}</td>
        <td>${Math.round(rec.speed)}</td>
        <td>${parseFloat(rec.torque).toFixed(1)}</td>
        <td>${Math.round(rec.toolWear)}</td>
        <td><span class="history-badge ${badgeClass}">${rec.result}</span></td>
        <td><span class="history-badge ${badgeClass}">${rec.risk}</span></td>
        <td style="color: #64748b; font-size: 0.78rem;">${rec.time}</td>
        <td>
          <button type="button" class="btn-history-load" data-idx="${idx}" title="Reload parameters into predictor">
            <i class="fa-solid fa-arrow-rotate-left"></i> Load
          </button>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Bind Load buttons
    document.querySelectorAll('.btn-history-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const rec = predictionHistory[idx];
        if (rec) {
          applyParameters(rec);
          executePrediction(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // Export CSV Action
  btnExportCsv.addEventListener('click', () => {
    if (!predictionHistory || predictionHistory.length === 0) {
      alert("No history records to export.");
      return;
    }

    const headers = ["Index", "Machine_ID", "Machine_Type", "Air_Temp_K", "Process_Temp_K", "Rotational_Speed_RPM", "Torque_Nm", "Tool_Wear_Min", "Condition_Result", "Failure_Risk", "Timestamp"];
    const rows = predictionHistory.map((r, i) => [
      i + 1,
      r.machineId,
      r.machineType || 'M',
      r.airTemp,
      r.procTemp,
      r.speed,
      r.torque,
      r.toolWear,
      `"${r.result}"`,
      `"${r.risk}"`,
      `"${r.time}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CNC_Predictive_Maintenance_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Clear History Action
  btnClearHistory.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear all prediction history?")) {
      predictionHistory = [];
      localStorage.removeItem('cnc_pred_history');
      renderHistoryTable();
    }
  });

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    executePrediction(true);
  });

  // Initial render
  renderHistoryTable();
  // Execute initial prediction matching reference UI
  executePrediction(false);

  // 7. Modals & Navigation Handling
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  }

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close');
      closeModal(targetId);
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });

  document.getElementById('nav-about').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-about');
  });

  document.getElementById('nav-dataset').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-dataset');
    loadDatasetPage(1);
  });

  document.getElementById('nav-contact').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-contact');
  });

  document.getElementById('nav-history').addEventListener('click', (e) => {
    e.preventDefault();
    const hist = document.getElementById('history-section');
    if (hist) hist.scrollIntoView({ behavior: 'smooth' });
  });

  // 8. Dataset Explorer Pagination & Search
  let currentDatasetPage = 1;
  const datasetTableBody = document.getElementById('dataset-table-body');
  const datasetSearchInput = document.getElementById('dataset-search');
  const datasetFilterStatus = document.getElementById('dataset-filter-status');
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');
  const pageIndicator = document.getElementById('page-indicator');

  async function loadDatasetPage(page = 1) {
    currentDatasetPage = page;
    const search = datasetSearchInput ? datasetSearchInput.value : '';
    const status = datasetFilterStatus ? datasetFilterStatus.value : 'all';

    datasetTableBody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading records...</td></tr>`;

    try {
      const res = await fetch(`/api/dataset?page=${page}&limit=15&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          renderDatasetTable(data);
          return;
        }
      }
    } catch (e) {
      console.log('Dataset endpoint unavailable, displaying mock sample.');
    }

    // Fallback sample view
    renderMockDatasetTable();
  }

  function renderDatasetTable(data) {
    pageIndicator.textContent = `Page ${data.page} of ${data.totalPages || 1} (${data.total.toLocaleString()} records)`;
    prevPageBtn.disabled = data.page <= 1;
    nextPageBtn.disabled = data.page >= data.totalPages;

    datasetTableBody.innerHTML = data.records.map(r => {
      const isFail = r.Machine_Failure === 1;
      return `
        <tr>
          <td>${r.Machine_ID}</td>
          <td><strong>${r.Product_ID}</strong></td>
          <td><span class="badge-healthy">${r.Machine_Type}</span></td>
          <td>${parseFloat(r.Air_Temperature_K).toFixed(1)}</td>
          <td>${parseFloat(r.Process_Temperature_K).toFixed(1)}</td>
          <td>${r.Rotational_Speed_RPM}</td>
          <td>${parseFloat(r.Torque_Nm).toFixed(1)}</td>
          <td>${r.Tool_Wear_Min}</td>
          <td><span class="history-badge ${isFail ? 'badge-risk' : 'badge-healthy'}">${r.Status}</span></td>
          <td style="font-size: 0.75rem;">${r.Failure_Mode || 'None'}</td>
          <td>
            <button type="button" class="btn-history-load btn-test-record" 
              data-id="${r.Product_ID}"
              data-type="${r.Machine_Type}"
              data-air="${r.Air_Temperature_K}"
              data-proc="${r.Process_Temperature_K}"
              data-speed="${r.Rotational_Speed_RPM}"
              data-torque="${r.Torque_Nm}"
              data-wear="${r.Tool_Wear_Min}">
              Test
            </button>
          </td>
        </tr>
      `;
    }).join('');

    bindDatasetTestButtons();
  }

  function renderMockDatasetTable() {
    datasetTableBody.innerHTML = `
      <tr>
        <td>1</td><td>M14860</td><td>M</td><td>298.1</td><td>308.6</td><td>1551</td><td>42.8</td><td>0</td>
        <td><span class="history-badge badge-healthy">Healthy</span></td><td>None</td>
        <td><button class="btn-history-load" onclick="applyAndTest(298.1, 308.6, 1551, 42.8, 0, 'M')">Test</button></td>
      </tr>
      <tr>
        <td>51</td><td>L47230</td><td>L</td><td>298.9</td><td>309.1</td><td>2861</td><td>4.6</td><td>143</td>
        <td><span class="history-badge badge-risk">Failure Risk</span></td><td>Power Failure</td>
        <td><button class="btn-history-load" onclick="applyAndTest(298.9, 309.1, 2861, 4.6, 143, 'L')">Test</button></td>
      </tr>
      <tr>
        <td>70</td><td>L47249</td><td>L</td><td>298.9</td><td>309.0</td><td>1410</td><td>65.7</td><td>191</td>
        <td><span class="history-badge badge-risk">Failure Risk</span></td><td>Power, Overstrain</td>
        <td><button class="btn-history-load" onclick="applyAndTest(298.9, 309.0, 1410, 65.7, 191, 'L')">Test</button></td>
      </tr>
      <tr>
        <td>78</td><td>L47257</td><td>L</td><td>298.8</td><td>308.9</td><td>1455</td><td>41.3</td><td>208</td>
        <td><span class="history-badge badge-risk">Failure Risk</span></td><td>Tool Wear Failure</td>
        <td><button class="btn-history-load" onclick="applyAndTest(298.8, 308.9, 1455, 41.3, 208, 'L')">Test</button></td>
      </tr>
    `;
  }

  function bindDatasetTestButtons() {
    document.querySelectorAll('.btn-test-record').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = {
          machineId: btn.getAttribute('data-id'),
          type: btn.getAttribute('data-type'),
          airTemp: parseFloat(btn.getAttribute('data-air')),
          procTemp: parseFloat(btn.getAttribute('data-proc')),
          speed: parseFloat(btn.getAttribute('data-speed')),
          torque: parseFloat(btn.getAttribute('data-torque')),
          toolWear: parseFloat(btn.getAttribute('data-wear'))
        };
        applyParameters(p);
        closeModal('modal-dataset');
        executePrediction(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  if (datasetSearchInput) {
    let timeout = null;
    datasetSearchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => loadDatasetPage(1), 300);
    });
  }

  if (datasetFilterStatus) {
    datasetFilterStatus.addEventListener('change', () => loadDatasetPage(1));
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentDatasetPage > 1) loadDatasetPage(currentDatasetPage - 1);
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => loadDatasetPage(currentDatasetPage + 1));
  }
});

// Helper for inline test
window.applyAndTest = function(air, proc, speed, torque, wear, type) {
  document.getElementById('air-temp').value = air;
  document.getElementById('air-temp-range').value = air;
  document.getElementById('proc-temp').value = proc;
  document.getElementById('proc-temp-range').value = proc;
  document.getElementById('rot-speed').value = speed;
  document.getElementById('rot-speed-range').value = speed;
  document.getElementById('torque').value = torque;
  document.getElementById('torque-range').value = torque;
  document.getElementById('tool-wear').value = wear;
  document.getElementById('tool-wear-range').value = wear;
  document.getElementById('machine-type-val').value = type;
  document.getElementById('modal-dataset').style.display = 'none';
  document.getElementById('prediction-form').dispatchEvent(new Event('submit'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
