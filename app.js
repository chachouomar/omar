// ===== Constants (Omar's business data) =====
const DEFAULTS = {
    // Production costs per 16 desks
    woodFrame: 700,          // per frame
    mdfSheet: 4800,          // per sheet (4 desks per sheet)
    desksPerSheet: 4,
    accessories: 5300,       // for 16 desks
    chant: 1900,             // for 32 desks
    mdfWorkshop: 6000,       // for 16 desks
    woodCutting: 2000,       // for 16 desks
    legs: 480,               // per desk
    carton: 70,              // per carton (2 per desk)
    cartonsPerDesk: 2,
    transportWood: 1000,     // fixed
    transportLegs: 1000,     // fixed
    // Sales
    sellPrice: 7900,
    cpaLead: 3,              // dollars
    dollarRate: 260,
    confirmRate: 0.70,
    deliveryRate: 0.70,
    returnCost: 700,         // per return
    // Cash
    collectionDays: 7,
    baseBatch: 16
};

// ===== State =====
let cycles = [];

// ===== Tab Navigation =====
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ===== Production Calculator =====
function calculateProduction() {
    const numDesks = parseInt(document.getElementById('numDesks').value) || 16;
    const numSheets = Math.ceil(numDesks / DEFAULTS.desksPerSheet);
    const chantCost = Math.ceil(numDesks / 32) * DEFAULTS.chant;
    const accessoriesCost = Math.round((DEFAULTS.accessories / 16) * numDesks);
    const workshopCost = Math.round((DEFAULTS.mdfWorkshop / 16) * numDesks);
    const woodCuttingCost = Math.round((DEFAULTS.woodCutting / 16) * numDesks);

    const costs = [
        { name: 'خشب الهيكل', calc: `${numDesks} × ${DEFAULTS.woodFrame}`, amount: numDesks * DEFAULTS.woodFrame },
        { name: 'ألواح المدياف', calc: `${numSheets} × ${DEFAULTS.mdfSheet}`, amount: numSheets * DEFAULTS.mdfSheet },
        { name: 'إكسسوارات + ورنيش + ديليو', calc: `${numDesks} مكتب`, amount: accessoriesCost },
        { name: 'الشون PVC', calc: `${numDesks} مكتب`, amount: chantCost },
        { name: 'ورشة قص المدياف + الشون', calc: `${numDesks} مكتب`, amount: workshopCost },
        { name: 'قص خشب الهيكل (النجار)', calc: `${numDesks} هيكل`, amount: woodCuttingCost },
        { name: 'الأرجل', calc: `${numDesks} × ${DEFAULTS.legs}`, amount: numDesks * DEFAULTS.legs },
        { name: 'كرتون التغليف', calc: `${numDesks} × ${DEFAULTS.cartonsPerDesk} × ${DEFAULTS.carton}`, amount: numDesks * DEFAULTS.cartonsPerDesk * DEFAULTS.carton },
        { name: 'نقل (خشب + مدياف)', calc: 'ثابت', amount: DEFAULTS.transportWood },
        { name: 'نقل البليدة (أرجل)', calc: 'ثابت', amount: DEFAULTS.transportLegs },
    ];

    const total = costs.reduce((sum, c) => sum + c.amount, 0);
    const unitCost = Math.round(total / numDesks);

    const tbody = document.querySelector('#costTable tbody');
    tbody.innerHTML = costs.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.calc}</td>
            <td>${c.amount.toLocaleString()}</td>
        </tr>
    `).join('');

    document.getElementById('totalCost').textContent = total.toLocaleString() + ' دج';
    document.getElementById('unitCost').textContent = unitCost.toLocaleString() + ' دج';

    return { total, unitCost, numDesks };
}

// ===== Sales Funnel =====
function calculateSales() {
    const prod = calculateProduction();
    const numDesks = prod.numDesks;
    const cpa = parseFloat(document.getElementById('cpaLead').value) || 3;
    const dollarRate = parseInt(document.getElementById('dollarRate').value) || 260;
    const confirmRate = parseInt(document.getElementById('confirmRate').value) / 100 || 0.70;
    const deliveryRate = parseInt(document.getElementById('deliveryRate').value) / 100 || 0.70;
    const sellPrice = parseInt(document.getElementById('sellPrice').value) || 7900;
    const returnCost = parseInt(document.getElementById('returnCost').value) || 700;

    // To send numDesks, we need numDesks confirmed orders
    const leadsNeeded = Math.ceil(numDesks / confirmRate);
    const delivered = Math.round(numDesks * deliveryRate);
    const returned = numDesks - delivered;

    const adCostTotal = Math.round(leadsNeeded * cpa * dollarRate);

    document.querySelector('#funnelLeads .funnel-value').textContent = leadsNeeded;
    document.querySelector('#funnelConfirmed .funnel-value').textContent = numDesks;
    document.querySelector('#funnelDelivered .funnel-value').textContent = delivered;
    document.querySelector('#funnelReturned .funnel-value').textContent = returned;

    document.getElementById('adCostSummary').innerHTML = `
        💸 تكلفة الإعلانات للدورة: <strong>${adCostTotal.toLocaleString()} دج</strong> (${leadsNeeded} ليد × ${cpa}$ × ${dollarRate} دج)<br>
        📦 تكلفة الإرجاعات: <strong>${(returned * returnCost).toLocaleString()} دج</strong> (${returned} مرجع × ${returnCost} دج)
    `;

    return { leadsNeeded, confirmed: numDesks, delivered, returned, adCostTotal, sellPrice, returnCost, confirmRate, deliveryRate, cpa, dollarRate };
}

// ===== Stock Management =====
function calculateStock() {
    const prod = calculateProduction();
    const start = parseInt(document.getElementById('stockStart').value) || 0;
    const produced = parseInt(document.getElementById('stockProduced').value) || 16;
    const sent = parseInt(document.getElementById('stockSent').value) || 16;
    const returned = parseInt(document.getElementById('stockReturned').value) || 0;

    const current = start + produced - sent + returned;
    const inTransit = sent - Math.round(sent * 0.7) - returned; // approximate

    document.getElementById('currentStock').textContent = current;
    document.getElementById('stockValue').textContent = (current * prod.unitCost).toLocaleString();
    document.getElementById('inTransit').textContent = Math.max(0, sent - returned);
    
    const turnover = produced > 0 ? Math.round((current / produced) * 10) : 0;
    document.getElementById('stockTurnover').textContent = turnover > 0 ? turnover : '< 1';
}

// ===== Cash Flow =====
function calculateCashFlow() {
    const prod = calculateProduction();
    const sales = calculateSales();
    const availableCash = parseInt(document.getElementById('availableCash').value) || 140000;
    const collectionDays = parseInt(document.getElementById('collectionDays').value) || 7;
    const cyclesPerMonth = parseInt(document.getElementById('cyclesPerMonth').value) || 4;
    const dailyAdBudget = parseInt(document.getElementById('dailyAdBudget').value) || 2000;

    const monthlyAdCost = dailyAdBudget * 28;
    const monthlyProduction = prod.total * cyclesPerMonth;
    const monthlyRevenue = sales.delivered * cyclesPerMonth * sales.sellPrice;
    const monthlyReturns = sales.returned * cyclesPerMonth * sales.returnCost;
    const pendingCash = Math.round(monthlyRevenue / 30 * collectionDays);

    document.getElementById('cashIn').textContent = monthlyRevenue.toLocaleString() + ' دج';
    document.getElementById('cashOut').textContent = (monthlyProduction + monthlyAdCost + monthlyReturns).toLocaleString() + ' دج';
    document.getElementById('cashPending').textContent = pendingCash.toLocaleString() + ' دج';

    const netCash = availableCash + monthlyRevenue - monthlyProduction - monthlyAdCost - monthlyReturns;
    document.getElementById('netCash').textContent = netCash.toLocaleString() + ' دج';

    // Timeline
    const timeline = document.getElementById('cashflowTimeline');
    let html = '';
    const cycleDays = Math.floor(30 / cyclesPerMonth);
    
    for (let i = 1; i <= 30; i++) {
        let cls = 'neutral';
        let label = `يوم ${i}`;
        let detail = '';

        const cycleNum = Math.ceil(i / cycleDays);
        const dayInCycle = ((i - 1) % cycleDays) + 1;

        if (dayInCycle === 1) {
            cls = 'expense';
            detail = `إنتاج د${cycleNum}: -${(prod.total/1000).toFixed(0)}k`;
        } else if (dayInCycle === collectionDays) {
            cls = 'income';
            detail = `تحصيل: +${((sales.delivered * sales.sellPrice)/1000).toFixed(0)}k`;
        } else if (dayInCycle >= 3 && dayInCycle <= 5) {
            cls = 'expense';
            detail = `إرسال طلبيات`;
        }

        html += `<div class="cashflow-day ${cls}"><div>${label}</div><div>${detail}</div></div>`;
    }
    timeline.innerHTML = html;

    return { monthlyRevenue, monthlyProduction, monthlyAdCost, monthlyReturns, cyclesPerMonth };
}

// ===== Profit Calculator =====
function calculateProfit() {
    const prod = calculateProduction();
    const sales = calculateSales();
    const cf = calculateCashFlow();

    const revenue = sales.delivered * cf.cyclesPerMonth * sales.sellPrice;
    const productionCost = prod.total * cf.cyclesPerMonth;
    const adCost = parseInt(document.getElementById('dailyAdBudget').value) * 28 || cf.monthlyAdCost;
    const returnsCost = sales.returned * cf.cyclesPerMonth * sales.returnCost;

    const profit = revenue - productionCost - adCost - returnsCost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    const perUnit = sales.delivered * cf.cyclesPerMonth > 0 
        ? Math.round(profit / (sales.delivered * cf.cyclesPerMonth)) 
        : 0;

    document.getElementById('plRevenue').textContent = revenue.toLocaleString() + ' دج';
    document.getElementById('plProduction').textContent = '-' + productionCost.toLocaleString() + ' دج';
    document.getElementById('plAds').textContent = '-' + adCost.toLocaleString() + ' دج';
    document.getElementById('plReturns').textContent = '-' + returnsCost.toLocaleString() + ' دج';
    document.getElementById('plProfit').textContent = profit.toLocaleString() + ' دج';
    document.getElementById('plMargin').textContent = margin + '%';
    document.getElementById('plPerUnit').textContent = perUnit.toLocaleString() + ' دج';

    // Color profit
    const profitRow = document.querySelector('.profit-row td:last-child');
    profitRow.style.color = profit >= 0 ? '#16a34a' : '#dc2626';

    // Target calculation
    calculateTarget(prod, sales);

    // Scenarios
    calculateScenarios(prod);
}

// ===== Target Calculator =====
function calculateTarget(prod, sales) {
    const targetProfit = parseInt(document.getElementById('targetProfit').value) || 100000;
    
    const profitPerDelivered = sales.sellPrice - prod.unitCost 
        - (sales.cpa * sales.dollarRate / sales.confirmRate / sales.deliveryRate)
        - (sales.returnCost * (1 - sales.deliveryRate) / sales.deliveryRate);
    
    const unitsNeeded = Math.ceil(targetProfit / profitPerDelivered);
    const cyclesNeeded = Math.ceil(unitsNeeded / (prod.numDesks * sales.deliveryRate));
    const leadsNeeded = Math.ceil(unitsNeeded / sales.deliveryRate / sales.confirmRate);
    const adBudgetNeeded = Math.round(leadsNeeded * sales.cpa * sales.dollarRate);
    const capitalNeeded = Math.round(prod.total * 2 + adBudgetNeeded * 0.3);

    document.getElementById('targetResult').innerHTML = `
        🎯 <strong>لتحقيق ${targetProfit.toLocaleString()} دج ربح شهري:</strong><br><br>
        📦 تحتاج توصيل: <strong>${unitsNeeded} مكتب/شهر</strong><br>
        🔄 عدد الدورات: <strong>${cyclesNeeded} دورة</strong> (${prod.numDesks} مكتب/دورة)<br>
        📱 الليدات المطلوبة: <strong>${leadsNeeded} ليد/شهر</strong> (~${Math.ceil(leadsNeeded/28)} ليد/يوم)<br>
        💸 ميزانية الإعلانات: <strong>${adBudgetNeeded.toLocaleString()} دج/شهر</strong> (~${Math.round(adBudgetNeeded/28).toLocaleString()} دج/يوم)<br>
        💼 رأس المال المطلوب: <strong>~${capitalNeeded.toLocaleString()} دج</strong><br>
        💵 ربح المكتب الموصل: <strong>${Math.round(profitPerDelivered).toLocaleString()} دج</strong>
    `;
}

// ===== Scenario Comparison =====
function calculateScenarios(prod) {
    const scenarios = [
        { name: 'الوضع الحالي', cycles: 3, price: 7900, confirm: 70, delivery: 70, cpa: 3 },
        { name: 'تحسين متوسط', cycles: 4, price: 8500, confirm: 75, delivery: 75, cpa: 2.5 },
        { name: 'تحسين ممتاز', cycles: 4, price: 8900, confirm: 80, delivery: 80, cpa: 2 },
        { name: 'الهدف الأقصى', cycles: 5, price: 8900, confirm: 85, delivery: 85, cpa: 1.8 },
    ];

    const dollarRate = parseInt(document.getElementById('dollarRate').value) || 260;
    const returnCost = parseInt(document.getElementById('returnCost').value) || 700;
    const numDesks = prod.numDesks;

    const tbody = document.querySelector('#scenarioTable tbody');
    tbody.innerHTML = scenarios.map(s => {
        const delivered = Math.round(numDesks * (s.delivery / 100));
        const returned = numDesks - delivered;
        const leadsNeeded = Math.ceil(numDesks / (s.confirm / 100));
        
        const revenue = delivered * s.cycles * s.price;
        const prodCost = prod.total * s.cycles;
        const adCost = leadsNeeded * s.cpa * dollarRate * s.cycles;
        const retCost = returned * returnCost * s.cycles;
        const profit = Math.round(revenue - prodCost - adCost - retCost);
        
        const color = profit >= 100000 ? '#16a34a' : profit >= 50000 ? '#f59e0b' : '#dc2626';
        
        return `<tr>
            <td><strong>${s.name}</strong></td>
            <td>${s.cycles}</td>
            <td>${s.price.toLocaleString()}</td>
            <td>${s.confirm}%</td>
            <td>${s.delivery}%</td>
            <td>${s.cpa}$</td>
            <td style="color:${color};font-weight:800">${profit.toLocaleString()} دج</td>
        </tr>`;
    }).join('');
}

// ===== Cycle Logger =====
document.getElementById('addCycleBtn').addEventListener('click', () => {
    const numDesks = parseInt(document.getElementById('numDesks').value) || 16;
    const deliveryRate = parseInt(document.getElementById('deliveryRate').value) / 100 || 0.70;
    
    const cycle = {
        id: cycles.length + 1,
        date: new Date().toLocaleDateString('ar-DZ'),
        produced: numDesks,
        sent: numDesks,
        delivered: Math.round(numDesks * deliveryRate),
        returned: numDesks - Math.round(numDesks * deliveryRate),
        status: 'جارية'
    };
    cycles.push(cycle);
    renderCycles();
});

function renderCycles() {
    const tbody = document.querySelector('#cycleTable tbody');
    tbody.innerHTML = cycles.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.date}</td>
            <td>${c.produced}</td>
            <td>${c.sent}</td>
            <td>${c.delivered}</td>
            <td>${c.returned}</td>
            <td><span style="color:${c.status === 'مكتملة' ? '#16a34a' : '#f59e0b'}">${c.status}</span></td>
        </tr>
    `).join('');
}

// ===== Event Listeners =====
function attachListeners() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateAll();
        });
    });
}

function calculateAll() {
    calculateProduction();
    calculateSales();
    calculateStock();
    calculateCashFlow();
    calculateProfit();
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    attachListeners();
    calculateAll();
});
