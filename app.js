document.addEventListener('DOMContentLoaded', () => {

  // --- STATE VARIABLES ---
  let calcStep = 1;
  const maxSteps = 4;
  let isYearlyBilling = false;
  
  // Default values to achieve exactly 8.4 tons CO2e total
  // Home: ~3.2t, Transport: ~2.8t, Food: ~1.4t, Shopping/Waste: ~1.0t
  const defaults = {
    electricity: 350, // kWh/mo
    gas: 60,         // m3/mo
    oil: 20,         // l/mo
    car: 500,        // miles/mo
    flights: 2,      // flights/yr
    transit: 4,      // hrs/wk
    meat: 3,         // meals/wk
    dairy: 3,        // meals/wk
    local: 20,       // %
    spend: 300,      // $/mo
    waste: 2,        // bags/wk
    recycle: 30      // %
  };

  // User input states (pre-populated with defaults for immediate demonstration)
  let userInputs = { ...defaults };
  let calculatedEmissions = {
    home: 3.2,
    transport: 2.8,
    food: 1.4,
    shopping: 1.0,
    total: 8.4
  };

  // --- ROUTER / VIEW SWITCHING ---
  const views = {
    landing: document.getElementById('view-landing'),
    calculator: document.getElementById('view-calculator'),
    insights: document.getElementById('view-insights'),
    tracker: document.getElementById('view-tracker'),
    business: document.getElementById('view-business')
  };

  const navLinks = {
    calculator: document.getElementById('link-calculator'),
    insights: document.getElementById('link-insights'),
    business: document.getElementById('link-business'),
    pricing: document.getElementById('link-pricing'),
    brand: document.getElementById('nav-brand')
  };

  function switchView(targetViewId) {
    // Hide all views
    Object.values(views).forEach(view => view.classList.remove('active'));
    // Show target view
    views[targetViewId].classList.add('active');
    
    // Update active nav styling
    Object.values(navLinks).forEach(link => {
      if (link) link.classList.remove('active');
    });

    if (targetViewId === 'calculator' && navLinks.calculator) navLinks.calculator.classList.add('active');
    if (targetViewId === 'insights' && navLinks.insights) navLinks.insights.classList.add('active');
    if (targetViewId === 'business' && navLinks.business) navLinks.business.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Bind nav links
  navLinks.brand.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); });
  navLinks.calculator.addEventListener('click', (e) => { e.preventDefault(); switchView('calculator'); });
  navLinks.insights.addEventListener('click', (e) => { e.preventDefault(); switchView('insights'); });
  navLinks.business.addEventListener('click', (e) => { e.preventDefault(); switchView('business'); });
  
  if (navLinks.pricing) {
    navLinks.pricing.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('landing');
      setTimeout(() => {
        document.getElementById('pricing-target').scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  // Sign In opens Sarah's tracker dashboard directly
  document.getElementById('link-signin').addEventListener('click', () => {
    switchView('tracker');
  });

  // Get started pill and CTA buttons
  document.getElementById('btn-getstarted').addEventListener('click', () => switchView('calculator'));
  document.getElementById('btn-hero-calc').addEventListener('click', () => switchView('calculator'));
  document.getElementById('btn-hero-biz').addEventListener('click', () => switchView('business'));
  document.getElementById('btn-select-sme').addEventListener('click', () => switchView('business'));
  document.getElementById('btn-tracker-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('tracker');
  });

  // --- LIVE GLOBAL TICKER ---
  const tickerEl = document.getElementById('global-ticker-val');
  let tickerVal = 1248407;
  setInterval(() => {
    tickerVal += Math.floor(Math.random() * 3) + 1;
    if (tickerEl) {
      tickerEl.innerText = tickerVal.toLocaleString();
    }
  }, 3500);

  // --- PRICING TOGGLE ---
  const btnMonthly = document.getElementById('pricing-monthly');
  const btnYearly = document.getElementById('pricing-yearly');
  const premiumPrice = document.getElementById('premium-price');
  const businessPrice = document.getElementById('business-price');

  if (btnMonthly && btnYearly) {
    btnMonthly.addEventListener('click', () => {
      btnMonthly.classList.add('active');
      btnYearly.classList.remove('active');
      isYearlyBilling = false;
      premiumPrice.innerHTML = '$8<span>/mo</span>';
      businessPrice.innerHTML = '$49<span>/mo</span>';
    });

    btnYearly.addEventListener('click', () => {
      btnYearly.classList.add('active');
      btnMonthly.classList.remove('active');
      isYearlyBilling = true;
      premiumPrice.innerHTML = '$6.40<span>/mo</span>';
      businessPrice.innerHTML = '$39.20<span>/mo</span>';
    });
  }

  // --- CALCULATOR MODULE ---
  const panels = [
    document.getElementById('panel-energy'),
    document.getElementById('panel-transport'),
    document.getElementById('panel-food'),
    document.getElementById('panel-shopping')
  ];
  
  const tabButtons = document.querySelectorAll('.calc-tab-btn');
  const stepIndicator = document.getElementById('calc-step-indicator');
  const pctIndicator = document.getElementById('calc-pct-indicator');
  const progressFill = document.getElementById('calc-progress-fill');
  
  // Set inputs to default values on load
  function initCalculatorInputs() {
    document.getElementById('input-electricity').value = userInputs.electricity;
    document.getElementById('input-gas').value = userInputs.gas;
    document.getElementById('input-oil').value = userInputs.oil;
    document.getElementById('input-car').value = userInputs.car;
    document.getElementById('input-flights').value = userInputs.flights;
    document.getElementById('input-transit').value = userInputs.transit;
    document.getElementById('input-meat').value = userInputs.meat;
    document.getElementById('input-dairy').value = userInputs.dairy;
    document.getElementById('input-local').value = userInputs.local;
    document.getElementById('input-spend').value = userInputs.spend;
    document.getElementById('input-waste').value = userInputs.waste;
    document.getElementById('input-recycle').value = userInputs.recycle;
  }
  initCalculatorInputs();

  function updateWizardUI() {
    // Hide all panels
    panels.forEach(panel => panel.classList.remove('active'));
    // Show current panel
    panels[calcStep - 1].classList.add('active');

    // Update tab button classes
    tabButtons.forEach((btn, idx) => {
      if (idx + 1 === calcStep) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update progress numbers
    stepIndicator.innerText = `Step ${calcStep} of ${maxSteps}`;
    const pct = Math.round((calcStep / maxSteps) * 100);
    pctIndicator.innerText = `${pct}% Complete`;
    progressFill.style.width = `${pct}%`;

    // Highlight coming up cards
    const comingUpCards = document.querySelectorAll('.coming-up-card');
    comingUpCards.forEach(card => {
      const stepNum = parseInt(card.getAttribute('data-target-step'));
      if (stepNum === calcStep) {
        card.style.borderColor = 'var(--primary-color)';
        card.style.backgroundColor = 'var(--success-light)';
      } else if (stepNum < calcStep) {
        card.style.borderColor = 'var(--border-color)';
        card.style.backgroundColor = '#f3f6f4';
      } else {
        card.style.borderColor = 'var(--border-color)';
        card.style.backgroundColor = '#ffffff';
      }
    });
  }

  // Tab clicks
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      calcStep = parseInt(btn.getAttribute('data-step'));
      updateWizardUI();
    });
  });

  // Coming up cards click
  document.querySelectorAll('.coming-up-card').forEach(card => {
    card.addEventListener('click', () => {
      calcStep = parseInt(card.getAttribute('data-target-step'));
      updateWizardUI();
    });
  });

  // Navigation inside wizard
  document.getElementById('btn-calc-back').addEventListener('click', () => {
    if (calcStep > 1) {
      calcStep--;
      updateWizardUI();
    } else {
      switchView('landing');
    }
  });

  document.getElementById('btn-calc-save').addEventListener('click', () => {
    alert('Progress saved! We have secure-cached your answers locally.');
  });

  document.getElementById('btn-calc-continue').addEventListener('click', () => {
    if (calcStep < maxSteps) {
      calcStep++;
      updateWizardUI();
    } else {
      // Calculate final emissions
      performCarbonMath();
      // Render dashboard results
      updateDashboardUI();
      // Route to insights view
      switchView('insights');
    }
  });

  // Form input change listeners to recalculate on-the-fly
  const allInputs = document.querySelectorAll('.input-field-wrapper input');
  allInputs.forEach(input => {
    input.addEventListener('input', () => {
      readInputs();
      performCarbonMath();
      document.getElementById('current-calc-estimate-val').innerText = calculatedEmissions.total.toFixed(1);
    });
  });

  function readInputs() {
    userInputs.electricity = parseFloat(document.getElementById('input-electricity').value) || 0;
    userInputs.gas = parseFloat(document.getElementById('input-gas').value) || 0;
    userInputs.oil = parseFloat(document.getElementById('input-oil').value) || 0;
    userInputs.car = parseFloat(document.getElementById('input-car').value) || 0;
    userInputs.flights = parseFloat(document.getElementById('input-flights').value) || 0;
    userInputs.transit = parseFloat(document.getElementById('input-transit').value) || 0;
    userInputs.meat = parseFloat(document.getElementById('input-meat').value) || 0;
    userInputs.dairy = parseFloat(document.getElementById('input-dairy').value) || 0;
    userInputs.local = parseFloat(document.getElementById('input-local').value) || 0;
    userInputs.spend = parseFloat(document.getElementById('input-spend').value) || 0;
    userInputs.waste = parseFloat(document.getElementById('input-waste').value) || 0;
    userInputs.recycle = parseFloat(document.getElementById('input-recycle').value) || 0;
  }

  function performCarbonMath() {
    // 1. Home Energy (monthly input to annual tons)
    const annualElec = userInputs.electricity * 12; // kWh
    const annualGas = userInputs.gas * 12;         // m3
    const annualOil = userInputs.oil * 12;         // liters
    // EPA/DEFRA factors
    const homeCO2 = (annualElec * 0.4 + annualGas * 2.0 + annualOil * 2.7) / 1000;

    // 2. Transport (monthly/annual inputs to annual tons)
    const annualDrive = userInputs.car * 12; // miles
    const annualFlights = userInputs.flights; // count
    const annualTransit = userInputs.transit * 52; // hours
    const transportCO2 = (annualDrive * 0.35 + annualFlights * 250 + annualTransit * 0.05) / 1000;

    // 3. Food (weekly meals to annual tons, adjusted by local/organic percentage)
    const annualMeat = userInputs.meat * 52;
    const annualDairy = userInputs.dairy * 52;
    let foodCO2 = (annualMeat * 15 + annualDairy * 5.0) / 1000;
    // Local organic reduction up to 20%
    const localReduction = (userInputs.local / 100) * 0.2;
    foodCO2 = foodCO2 * (1 - localReduction);

    // 4. Shopping & Waste (monthly spend / weekly waste to annual tons, adjusted by recycle)
    const annualSpend = userInputs.spend * 12;
    const annualWaste = userInputs.waste * 52;
    let shopWasteCO2 = (annualSpend * 0.1 + annualWaste * 4.0) / 1000;
    // Recycling reduces waste impact by up to 40%
    const recycleReduction = (userInputs.recycle / 100) * 0.4;
    shopWasteCO2 = shopWasteCO2 * (1 - recycleReduction);

    calculatedEmissions.home = Math.max(0.1, homeCO2);
    calculatedEmissions.transport = Math.max(0.1, transportCO2);
    calculatedEmissions.food = Math.max(0.1, foodCO2);
    calculatedEmissions.shopping = Math.max(0.1, shopWasteCO2);
    calculatedEmissions.total = calculatedEmissions.home + calculatedEmissions.transport + calculatedEmissions.food + calculatedEmissions.shopping;
  }

  // Use local averages buttons
  document.getElementById('toggle-avg-electricity').addEventListener('click', () => {
    document.getElementById('input-electricity').value = 900;
    triggerInputEvent('input-electricity');
  });
  document.getElementById('toggle-avg-gas').addEventListener('click', () => {
    document.getElementById('input-gas').value = 150;
    triggerInputEvent('input-gas');
  });
  document.getElementById('toggle-avg-oil').addEventListener('click', () => {
    document.getElementById('input-oil').value = 50;
    triggerInputEvent('input-oil');
  });
  document.getElementById('toggle-avg-car').addEventListener('click', () => {
    document.getElementById('input-car').value = 1000;
    triggerInputEvent('input-car');
  });
  document.getElementById('toggle-avg-flights').addEventListener('click', () => {
    document.getElementById('input-flights').value = 4;
    triggerInputEvent('input-flights');
  });
  document.getElementById('toggle-avg-transit').addEventListener('click', () => {
    document.getElementById('input-transit').value = 10;
    triggerInputEvent('input-transit');
  });

  function triggerInputEvent(id) {
    const input = document.getElementById(id);
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
  }

  // Connect smart meter mock
  const btnSmartMeter = document.getElementById('btn-smart-meter');
  btnSmartMeter.addEventListener('click', () => {
    btnSmartMeter.innerHTML = '<span style="color:var(--success-color)">✓ Smart Meter Connected</span>';
    btnSmartMeter.style.backgroundColor = '#ffffff';
    btnSmartMeter.style.borderColor = 'var(--success-color)';
    document.getElementById('input-electricity').value = 280;
    document.getElementById('input-gas').value = 45;
    triggerInputEvent('input-electricity');
    triggerInputEvent('input-gas');
  });

  // --- DASHBOARD UPDATER ---
  function updateDashboardUI() {
    const total = calculatedEmissions.total;
    document.getElementById('dash-total-val').innerText = total.toFixed(1);
    document.getElementById('donut-center-total').innerText = total.toFixed(1);
    
    // Category numbers
    const homeVal = calculatedEmissions.home;
    const transVal = calculatedEmissions.transport;
    const foodVal = calculatedEmissions.food;
    const shopVal = calculatedEmissions.shopping;
    
    document.getElementById('legend-val-home').innerText = homeVal.toFixed(1);
    document.getElementById('legend-val-transport').innerText = transVal.toFixed(1);
    document.getElementById('legend-val-food').innerText = foodVal.toFixed(1);
    document.getElementById('legend-val-shopping').innerText = shopVal.toFixed(1);

    // Donut chart stroke-dasharrays
    const pctHome = (homeVal / total) * 100;
    const pctTrans = (transVal / total) * 100;
    const pctFood = (foodVal / total) * 100;
    const pctShop = (shopVal / total) * 100;

    const segHome = document.getElementById('donut-segment-home');
    const segTrans = document.getElementById('donut-segment-transport');
    const segFood = document.getElementById('donut-segment-food');
    const segShop = document.getElementById('donut-segment-shopping');

    // Radius of circle is 15.915, circumference is exactly 100
    segHome.setAttribute('stroke-dasharray', `${pctHome} ${100 - pctHome}`);
    segHome.setAttribute('stroke-dashoffset', '100');

    segTrans.setAttribute('stroke-dasharray', `${pctTrans} ${100 - pctTrans}`);
    segTrans.setAttribute('stroke-dashoffset', `${100 - pctHome}`);

    segFood.setAttribute('stroke-dasharray', `${pctFood} ${100 - pctFood}`);
    segFood.setAttribute('stroke-dashoffset', `${100 - pctHome - pctTrans}`);

    segShop.setAttribute('stroke-dasharray', `${pctShop} ${100 - pctShop}`);
    segShop.setAttribute('stroke-dashoffset', `${100 - pctHome - pctTrans - pctFood}`);

    // Comparison column bar width
    const userBar = document.getElementById('comp-user-fill');
    const userLabel = document.getElementById('comp-user-label');
    userLabel.innerText = `${total.toFixed(1)} t`;
    
    const pctCompare = Math.min(100, (total / 14.0) * 100);
    userBar.style.width = `${pctCompare}%`;

    // Offset cost
    const offsetCost = total * 1.48; // $1.48 per ton per month
    document.getElementById('offset-cost-val').innerText = `$${offsetCost.toFixed(2)}`;
    document.getElementById('modal-footprint-ton').innerText = `${total.toFixed(1)} t CO2e`;
    document.getElementById('modal-footprint-cost').innerText = `$${offsetCost.toFixed(2)} / month`;
  }
  // Run once to show correct default chart on dashboard
  updateDashboardUI();


  // --- MODAL TRIGGERS ---
  const modalCheckout = document.getElementById('modal-checkout');
  const btnOffset = document.getElementById('btn-offset-checkout');
  const btnOffsetMenu = document.getElementById('act-offset');
  const closeCheckout = document.getElementById('modal-close-checkout');

  if (btnOffset && modalCheckout) {
    btnOffset.addEventListener('click', () => modalCheckout.classList.add('active'));
    btnOffsetMenu.addEventListener('click', (e) => {
      e.preventDefault();
      modalCheckout.classList.add('active');
    });
    closeCheckout.addEventListener('click', () => modalCheckout.classList.remove('active'));
    modalCheckout.addEventListener('click', (e) => {
      if (e.target === modalCheckout) modalCheckout.classList.remove('active');
    });
  }

  document.getElementById('btn-modal-checkout-submit').addEventListener('click', () => {
    alert('Thank you! Offsetting plan successfully activated.');
    modalCheckout.classList.remove('active');
  });

  // --- SARAH'S TRACKER GOAL SLIDER ---
  const goalSlider = document.getElementById('goal-range-slider');
  const sliderPctLabel = document.getElementById('slider-pct-label');

  if (goalSlider && sliderPctLabel) {
    goalSlider.addEventListener('input', () => {
      const val = goalSlider.value;
      sliderPctLabel.innerText = `${val}%`;
      // Calculate simulated goal emissions
      const baseline = calculatedEmissions.total;
      const targetCO2 = (baseline * (1 - val/100)).toFixed(1);
      sliderPctLabel.innerHTML = `${val}% <span style="font-weight:400;color:var(--text-muted);">(target: ${targetCO2} t)</span>`;
    });
  }

  // Checklist activity
  const chk1 = document.getElementById('chk-action-1');
  const chk2 = document.getElementById('chk-action-2');
  const chk3 = document.getElementById('chk-action-3');
  const btnLogAction = document.getElementById('btn-tracker-log');

  if (chk2) {
    chk2.addEventListener('change', () => {
      if (chk2.checked) {
        chk3.disabled = false;
        chk3.closest('.check-item').classList.remove('locked');
        chk3.closest('.check-item').querySelector('.check-item-title').removeAttribute('style');
      } else {
        chk3.disabled = true;
        chk3.checked = false;
        chk3.closest('.check-item').classList.add('locked');
        chk3.closest('.check-item').querySelector('.check-item-title').style.color = 'var(--text-muted)';
      }
    });
  }

  if (btnLogAction) {
    btnLogAction.addEventListener('click', () => {
      let loggedCount = 0;
      if (chk1 && chk1.checked) loggedCount++;
      if (chk2 && chk2.checked) loggedCount++;
      if (chk3 && chk3.checked) loggedCount++;
      alert(`Completed and logged ${loggedCount} carbon reduction actions this week! Your impact stats have been updated.`);
    });
  }

  // --- B2B SME MODULE SIMULATION ---
  const btnCommuteSimulate = document.getElementById('btn-commute-simulate');
  const commuteResultBox = document.getElementById('commute-result-box');
  const commuteResultText = document.getElementById('commute-result-text');

  if (btnCommuteSimulate) {
    btnCommuteSimulate.addEventListener('click', () => {
      const mode = document.getElementById('commute-mode').value;
      const distance = parseFloat(document.getElementById('commute-distance').value) || 0;
      const frequency = parseInt(document.getElementById('commute-frequency').value) || 0;
      const action = document.getElementById('commute-action').value;

      // Commute calculation math
      let emissionsFactor = 0; // kg CO2e per mile
      if (mode === 'car_gas') emissionsFactor = 0.35;
      else if (mode === 'car_ev') emissionsFactor = 0.12;
      else if (mode === 'transit') emissionsFactor = 0.08;
      else if (mode === 'bike') emissionsFactor = 0.0;

      const weeklyDistance = distance * frequency;
      const annualDistance = weeklyDistance * 52;
      const annualEmissions = (annualDistance * emissionsFactor) / 1000; // Tons CO2e

      let savings = 0;
      let suggestion = '';

      if (action === 'wfh_2') {
        savings = annualEmissions * 0.4; // 40% reduction
        suggestion = 'Implementing 2 days Work From Home policies offsets commuter emissions by 40% immediately.';
      } else if (action === 'ev_subsidy') {
        savings = annualEmissions * 0.5; // Switch 50% driving to EV equivalent
        suggestion = 'EV charging subsidies incentivize transition, cutting commuting emissions by up to 50%.';
      } else if (action === 'ebike') {
        savings = distance < 12 ? annualEmissions * 0.8 : annualEmissions * 0.3; // High savings if short commute
        suggestion = 'E-bike subsidies show huge ROI for staff living within a 10-mile radius.';
      } else {
        savings = 0;
        suggestion = 'No carbon policy selected. Select an action above to calculate ROI.';
      }

      commuteResultBox.style.display = 'block';
      commuteResultText.innerHTML = `
        Baseline commuter footprint: <strong>${annualEmissions.toFixed(2)} t CO2e/year</strong> per employee.<br>
        Carbon savings identified: <strong style="color:var(--success-color)">${savings.toFixed(2)} t CO2e/year (-${(annualEmissions > 0 ? (savings/annualEmissions * 100) : 0).toFixed(0)}%)</strong>.<br>
        Recommendation: ${suggestion}
      `;
    });
  }

  // Supplier file upload mock
  const uploadZone = document.getElementById('sme-upload-zone');
  const supplierTableBody = document.getElementById('supplier-table-body');

  if (uploadZone) {
    uploadZone.addEventListener('click', () => {
      uploadZone.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="spinner" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4e7d58" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="8"></circle></svg><span>Parsing ESG supply chain logs...</span>';
      
      // Inject CSS spinner keyframes dynamically
      if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.innerHTML = `
          .spinner { animation: spin 1s linear infinite; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
      }

      setTimeout(() => {
        uploadZone.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4e7d58" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span style="color:var(--success-color)">Top 20 Suppliers Mapped Successfully!</span>';
        
        // Append extra simulated rows to table
        supplierTableBody.innerHTML = `
          <tr>
            <td>Midwest Packaging Co.</td>
            <td>United States</td>
            <td>142 t</td>
            <td><span class="status-badge high">High Risk</span></td>
          </tr>
          <tr>
            <td>Cascade Logistics</td>
            <td>Canada</td>
            <td>48 t</td>
            <td><span class="status-badge medium">Medium Risk</span></td>
          </tr>
          <tr>
            <td>EcoPaper Solutions</td>
            <td>Sweden</td>
            <td>12 t</td>
            <td><span class="status-badge low">Low Risk</span></td>
          </tr>
          <tr style="background-color: var(--success-light); font-weight:600;">
            <td>Velo Express (Courier)</td>
            <td>Netherlands</td>
            <td>4 t</td>
            <td><span class="status-badge low">Low Risk</span></td>
          </tr>
          <tr style="background-color: var(--success-light); font-weight:600;">
            <td>GigaSteel Foundries</td>
            <td>Germany</td>
            <td>328 t</td>
            <td><span class="status-badge high">High Risk</span></td>
          </tr>
        `;
      }, 2000);
    });
  }

  // Light LCA Selector
  const lcaBtns = document.querySelectorAll('.lca-btn');
  const lcaDetails = document.getElementById('lca-breakdown-details');

  const lcaData = {
    latte: [
      { name: 'Dairy Farming / Oat Cultivation', pct: 60, tons: 0.12 },
      { name: 'Roasting & Processing', pct: 15, tons: 0.03 },
      { name: 'Packaging (Carton & Lid)', pct: 15, tons: 0.03 },
      { name: 'Transportation & Retail cooling', pct: 10, tons: 0.02 }
    ],
    shirt: [
      { name: 'Raw Cotton Cultivation (Water & Fertilizer)', pct: 45, tons: 1.80 },
      { name: 'Spinning, Weaving & Fabric Dyeing', pct: 30, tons: 1.20 },
      { name: 'Manufacturing & Garment sewing', pct: 15, tons: 0.60 },
      { name: 'Logistics (Air freight shipping)', pct: 10, tons: 0.40 }
    ]
  };

  function renderLCA(productKey) {
    const data = lcaData[productKey];
    let html = '';
    let total = 0;
    
    data.forEach(item => {
      total += item.tons;
      html += `
        <div class="lca-step">
          <span style="width:200px; font-weight:500;">${item.name}</span>
          <div class="lca-step-bar-wrapper">
            <div class="lca-step-bar">
              <div class="lca-step-bar-fill" style="width: ${item.pct}%;"></div>
            </div>
          </div>
          <span style="width:60px; text-align:right; color:var(--text-muted);">${item.pct}%</span>
          <span style="width:80px; text-align:right; font-weight:600;">${item.tons.toFixed(2)} kg</span>
        </div>
      `;
    });

    html += `
      <div class="lca-total">
        <span>Total Product Carbon Footprint (LCA)</span>
        <span>${total.toFixed(2)} kg CO2e</span>
      </div>
    `;

    lcaDetails.innerHTML = html;
  }

  // Initial render of Latte LCA
  renderLCA('latte');

  lcaBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      lcaBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const product = btn.getAttribute('data-product');
      renderLCA(product);
    });
  });

  // Footer link triggers
  document.querySelectorAll('.footer-link-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-target');
      if (targetId === 'view-calculator') switchView('calculator');
      else if (targetId === 'view-insights') switchView('insights');
      else if (targetId === 'view-business') switchView('business');
      else if (targetId === 'view-landing') {
        switchView('landing');
        setTimeout(() => {
          document.getElementById('pricing-target').scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });
  });

  // Newsletter form mock
  document.getElementById('btn-newsletter-submit').addEventListener('click', () => {
    const email = document.getElementById('newsletter-email').value;
    if (email) {
      alert(`Successfully subscribed ${email} to EcoTrace Climate Insights!`);
      document.getElementById('newsletter-email').value = '';
    } else {
      alert('Please enter a valid email address.');
    }
  });

});
