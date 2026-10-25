"use strict";

const TRANSACTION_TYPES = {
  credit: {
    label: "Solicitud de crédito",
    code: "CR",
    color: "#8b6df6",
    minAmount: 200,
    maxAmount: 80000,
  },
  deposit: {
    label: "Depósito de dinero",
    code: "DP",
    color: "#20b486",
    minAmount: 1,
    maxAmount: 1500,
  },
  withdrawal: {
    label: "Retiro de dinero",
    code: "RT",
    color: "#ef5b67",
    minAmount: 1,
    maxAmount: 1000,
  },
  transfer: {
    label: "Transferencia",
    code: "TR",
    color: "#19a7bd",
    minAmount: 1,
    maxAmount: 3000,
  },
  payment: {
    label: "Pago de servicios",
    code: "PG",
    color: "#f2a93b",
    minAmount: 1,
    maxAmount: 300,
  },
  inquiry: {
    label: "Consulta financiera",
    code: "CS",
    color: "#617089",
    minAmount: 0,
    maxAmount: 0,
  },
  account: {
    label: "Apertura de cuenta",
    code: "AP",
    color: "#2563eb",
    minAmount: 0,
    maxAmount: 50,
  },
  card: {
    label: "Tarjeta bancaria",
    code: "TJ",
    color: "#db2777",
    minAmount: 0,
    maxAmount: 20,
  },
  insurance: {
    label: "Seguro bancario",
    code: "SG",
    color: "#0f9f8f",
    minAmount: 5,
    maxAmount: 120,
  },
  investment: {
    label: "Inversión o ahorro",
    code: "IV",
    color: "#7c3aed",
    minAmount: 50,
    maxAmount: 3000,
  },
};

const CREDIT_TYPES = {
  housing: {
    label: "Crédito para vivienda",
    code: "VIV",
    minAmount: 10000,
    maxAmount: 80000,
    defaultRate: 9.5,
    defaultTerm: 180,
  },
  vehicle: {
    label: "Crédito para vehículo",
    code: "VEH",
    minAmount: 3000,
    maxAmount: 30000,
    defaultRate: 13.5,
    defaultTerm: 60,
  },
  consumer: {
    label: "Crédito de consumo",
    code: "CON",
    minAmount: 200,
    maxAmount: 10000,
    defaultRate: 16.5,
    defaultTerm: 36,
  },
  business: {
    label: "Crédito para negocio",
    code: "NEG",
    minAmount: 500,
    maxAmount: 25000,
    defaultRate: 15.0,
    defaultTerm: 48,
  },
  education: {
    label: "Crédito educativo",
    code: "EDU",
    minAmount: 300,
    maxAmount: 12000,
    defaultRate: 11.5,
    defaultTerm: 60,
  },
};

const DEFAULT_AUTOMATIC_AMOUNT_PROFILES = {
  deposit: [
    { min: 1, max: 100, weight: 55 },
    { min: 100.01, max: 300, weight: 30 },
    { min: 300.01, max: 700, weight: 12 },
    { min: 700.01, max: 1500, weight: 3 },
  ],
  withdrawal: [
    { min: 1, max: 100, weight: 50 },
    { min: 100.01, max: 300, weight: 35 },
    { min: 300.01, max: 600, weight: 12 },
    { min: 600.01, max: 1000, weight: 3 },
  ],
  transfer: [
    { min: 1, max: 200, weight: 45 },
    { min: 200.01, max: 600, weight: 35 },
    { min: 600.01, max: 1500, weight: 15 },
    { min: 1500.01, max: 3000, weight: 5 },
  ],
  payment: [
    { min: 1, max: 50, weight: 55 },
    { min: 50.01, max: 150, weight: 35 },
    { min: 150.01, max: 300, weight: 10 },
  ],
  account: [
    { min: 0, max: 0, weight: 70 },
    { min: 5, max: 25, weight: 25 },
    { min: 25.01, max: 50, weight: 5 },
  ],
  card: [
    { min: 0, max: 0, weight: 85 },
    { min: 5, max: 20, weight: 15 },
  ],
  insurance: [
    { min: 5, max: 30, weight: 60 },
    { min: 30.01, max: 70, weight: 30 },
    { min: 70.01, max: 120, weight: 10 },
  ],
  investment: [
    { min: 50, max: 300, weight: 55 },
    { min: 300.01, max: 800, weight: 30 },
    { min: 800.01, max: 1500, weight: 12 },
    { min: 1500.01, max: 3000, weight: 3 },
  ],
};

const DEFAULT_AUTOMATIC_AMOUNT_RANGES = {
  deposit: { min: 1, max: 1500 },
  withdrawal: { min: 1, max: 1000 },
  transfer: { min: 1, max: 3000 },
  payment: { min: 1, max: 300 },
  account: { min: 0, max: 50 },
  card: { min: 0, max: 20 },
  insurance: { min: 5, max: 120 },
  investment: { min: 50, max: 3000 },
};

const DEFAULT_CREDIT_AMOUNT_RANGES = {
  housing: { min: 10000, max: 80000 },
  vehicle: { min: 3000, max: 30000 },
  consumer: { min: 200, max: 10000 },
  business: { min: 500, max: 25000 },
  education: { min: 300, max: 12000 },
};

/* Límites operativos de seguridad. Evitan que configuraciones antiguas o
       valores mal ingresados conviertan una transacción individual en un saldo
       de cientos de miles o millones de USD. */
const TRANSACTION_AMOUNT_LIMITS = Object.freeze({
  credit: { min: 200, max: 200000 },
  deposit: { min: 1, max: 5000 },
  withdrawal: { min: 1, max: 3000 },
  transfer: { min: 1, max: 15000 },
  payment: { min: 1, max: 1500 },
  inquiry: { min: 0, max: 0 },
  account: { min: 0, max: 500 },
  card: { min: 0, max: 200 },
  insurance: { min: 5, max: 1000 },
  investment: { min: 50, max: 25000 },
});

const CREDIT_AMOUNT_LIMITS = Object.freeze({
  housing: { min: 10000, max: 200000 },
  vehicle: { min: 3000, max: 80000 },
  consumer: { min: 200, max: 40000 },
  business: { min: 500, max: 150000 },
  education: { min: 300, max: 50000 },
});

function roundUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const sign = number < 0 ? -1 : 1;
  return Math.round((number + sign * Number.EPSILON) * 100) / 100;
}

function transactionLimit(type, creditType = "") {
  if (type === "credit" && CREDIT_AMOUNT_LIMITS[creditType]) {
    return CREDIT_AMOUNT_LIMITS[creditType];
  }
  return TRANSACTION_AMOUNT_LIMITS[type] || { min: 0, max: 200000 };
}

function sanitizeTransactionAmount(type, value, creditType = "") {
  const limit = transactionLimit(type, creditType);
  const number = Number(value);
  if (!Number.isFinite(number)) return roundUsd(limit.min);
  return roundUsd(clamp(number, limit.min, limit.max));
}

function rangeLimit(collectionName, type) {
  if (collectionName === "creditAmountRanges") {
    return CREDIT_AMOUNT_LIMITS[type] || { min: 0, max: 200000 };
  }
  return TRANSACTION_AMOUNT_LIMITS[type] || { min: 0, max: 200000 };
}

function sanitizeSourceAmountConfiguration(node) {
  if (!node || node.type !== "source") return;
  node.props = node.props || {};

  const automaticConfigured = node.props.automaticAmountRanges || {};
  node.props.automaticAmountRanges = {};
  Object.entries(DEFAULT_AUTOMATIC_AMOUNT_RANGES).forEach(
    ([type, fallback]) => {
      const limit = transactionLimit(type);
      node.props.automaticAmountRanges[type] = normalizeConfiguredRange(
        automaticConfigured[type],
        fallback,
        Math.max(fallback.min, limit.min),
        limit.max,
      );
    },
  );

  const creditConfigured = node.props.creditAmountRanges || {};
  node.props.creditAmountRanges = {};
  Object.entries(DEFAULT_CREDIT_AMOUNT_RANGES).forEach(([type, fallback]) => {
    const limit = CREDIT_AMOUNT_LIMITS[type];
    node.props.creditAmountRanges[type] = normalizeConfiguredRange(
      creditConfigured[type],
      fallback,
      limit.min,
      limit.max,
    );
  });

  node.props.amountFixed = roundUsd(
    clamp(
      Number(node.props.amountFixed) || 0,
      0,
      TRANSACTION_AMOUNT_LIMITS.credit.max,
    ),
  );
  node.props.amountMin = roundUsd(
    clamp(
      Number(node.props.amountMin) || 0,
      0,
      TRANSACTION_AMOUNT_LIMITS.credit.max,
    ),
  );
  node.props.amountMax = roundUsd(
    clamp(
      Number(node.props.amountMax) || node.props.amountMin,
      node.props.amountMin,
      TRANSACTION_AMOUNT_LIMITS.credit.max,
    ),
  );
}

const NODE_TYPES = {
  source: {
    label: "Entrada",
    icon: "👤",
    colorClass: "source-color",
    defaultName: "Ingreso de usuarios",
    props: {
      interval: 4,
      startAt: 0,
      maxEntities: 0,
      personType: "Ciudadano",
      transactionMode: "mixed",
      transactionType: "credit",
      amountMode: "automatic",
      amountFixed: 200,
      amountMin: 20,
      amountMax: 2000,
      automaticAmountRanges: clone(DEFAULT_AUTOMATIC_AMOUNT_RANGES),
      creditAmountRanges: clone(DEFAULT_CREDIT_AMOUNT_RANGES),
      color: "#20b486",
      transactionWeights: {
        credit: 7,
        deposit: 28,
        withdrawal: 23,
        transfer: 10,
        payment: 18,
        inquiry: 8,
        account: 2,
        card: 2,
        insurance: 1,
        investment: 1,
      },
      creditTypeWeights: {
        housing: 18,
        vehicle: 22,
        consumer: 35,
        business: 15,
        education: 10,
      },
    },
  },
  queue: {
    label: "Espera",
    icon: "≡",
    colorClass: "queue-color",
    defaultName: "Sala de espera",
    props: {
      capacity: 999,
      department: "General",
      procedure: "Espera de atención",
      targetWaitMinutes: 5,
      angerAfterMinutes: 12,
      abandonAfterMinutes: 30,
      abandonProbability: 30,
      color: "#f2a93b",
    },
  },
  process: {
    label: "Área",
    icon: "🏢",
    colorClass: "process-color",
    defaultName: "Área de atención",
    props: {
      serviceTime: 6,
      capacity: 2,
      department: "Atención al cliente",
      procedure: "Recepción de trámite",
      observations: "",
      processRole: "standard",
      creditApprovalRate: 75,
      creditMinIncome: 600,
      creditMaxDebtRatio: 40,
      creditMinEmploymentMonths: 6,
      creditMaxIncomeMultiple: 12,
      creditAnnualInterestRate: 14,
      creditTermMonths: 24,
      creditRates: {
        housing: 9.5,
        vehicle: 13.5,
        consumer: 16.5,
        business: 15,
        education: 11.5,
      },
      creditTerms: {
        housing: 180,
        vehicle: 60,
        consumer: 36,
        business: 48,
        education: 60,
      },
      targetWaitMinutes: 5,
      angerAfterMinutes: 12,
      abandonAfterMinutes: 35,
      abandonProbability: 25,
      staffCostPerHour: 5,
      shiftStart: "08:00",
      shiftEnd: "19:00",
      lunchStart: "13:00",
      lunchMinutes: 60,
      cashMinimum: 5000,
      cashMaximum: 50000,
      color: "#3a8bfd",
    },
  },
  decision: {
    label: "Decisión",
    icon: "◇",
    colorClass: "decision-color",
    defaultName: "Derivación",
    props: {
      department: "Flujo",
      procedure: "Asignación de ruta",
      routingMode: "transaction",
      color: "#8b6df6",
    },
  },
  sink: {
    label: "Salida",
    icon: "✓",
    colorClass: "sink-color",
    defaultName: "Trámite finalizado",
    props: {
      finalStatus: "Completado",
      department: "Cierre",
      procedure: "Cierre de trámite",
      color: "#ef5b67",
    },
  },
};

const dom = {
  app: document.querySelector(".app"),
  sidebar: document.getElementById("sidebar"),
  properties: document.getElementById("properties"),
  panelBackdrop: document.getElementById("panelBackdrop"),
  workspace: document.getElementById("workspace"),
  canvasWrap: document.getElementById("canvasWrap"),
  canvas: document.getElementById("canvas"),
  nodesLayer: document.getElementById("nodesLayer"),
  edgeLayer: document.getElementById("edgeLayer"),
  entityLayer: document.getElementById("entityLayer"),
  emptyState: document.getElementById("emptyState"),
  propertiesContent: document.getElementById("propertiesContent"),
  selectionType: document.getElementById("selectionType"),
  connectBtn: document.getElementById("connectBtn"),
  playBtn: document.getElementById("playBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  stopBtn: document.getElementById("stopBtn"),
  resetBtn: document.getElementById("resetBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  speedSelect: document.getElementById("speedSelect"),
  metricTime: document.getElementById("metricTime"),
  metricCreated: document.getElementById("metricCreated"),
  metricCompleted: document.getElementById("metricCompleted"),
  metricWip: document.getElementById("metricWip"),
  metricMaxQueue: document.getElementById("metricMaxQueue"),
  metricStaff: document.getElementById("metricStaff"),
  chartLine: document.getElementById("chartLine"),
  chartArea: document.getElementById("chartArea"),
  statusDot: document.getElementById("statusDot"),
  statusText: document.getElementById("statusText"),
  statusMessage: document.getElementById("statusMessage"),
  statusSelection: document.getElementById("statusSelection"),
  clockStatus: document.getElementById("clockStatus"),
  zoomLabel: document.getElementById("zoomLabel"),
  toastContainer: document.getElementById("toastContainer"),
  recordsList: document.getElementById("recordsList"),
  recordsCount: document.getElementById("recordsCount"),
  businessNameInput: document.getElementById("businessNameInput"),
  initialCapitalInput: document.getElementById("initialCapitalInput"),
  openingTimeInput: document.getElementById("openingTimeInput"),
  closingTimeInput: document.getElementById("closingTimeInput"),
  simulationStartDateInput: document.getElementById("simulationStartDateInput"),
  simulationEndDateInput: document.getElementById("simulationEndDateInput"),
  simulationUnitInput: document.getElementById("simulationUnitInput"),
  simulationLengthInput: document.getElementById("simulationLengthInput"),
  weekdaySelector: document.getElementById("weekdaySelector"),
  startDayLabel: document.getElementById("startDayLabel"),
  endDayLabel: document.getElementById("endDayLabel"),
  metricDate: document.getElementById("metricDate"),
  metricDelayed: document.getElementById("metricDelayed"),
  metricAngry: document.getElementById("metricAngry"),
  metricAbandoned: document.getElementById("metricAbandoned"),
  scheduleBadge: document.getElementById("scheduleBadge"),
  capitalBadge: document.getElementById("capitalBadge"),
  scenarioTitle: document.getElementById("scenarioTitle"),
  metricCapital: document.getElementById("metricCapital"),
  metricNetChange: document.getElementById("metricNetChange"),
  metricCreditDisbursed: document.getElementById("metricCreditDisbursed"),
  metricInterestReceivable: document.getElementById("metricInterestReceivable"),
  metricCreditApproved: document.getElementById("metricCreditApproved"),
  metricCreditRejected: document.getElementById("metricCreditRejected"),
  metricDeposits: document.getElementById("metricDeposits"),
  metricWithdrawals: document.getElementById("metricWithdrawals"),
  minimumReserveInput: document.getElementById("minimumReserveInput"),
  vaultCashInput: document.getElementById("vaultCashInput"),
  cashDeskInput: document.getElementById("cashDeskInput"),
  commissionRateInput: document.getElementById("commissionRateInput"),
  defaultRiskInput: document.getElementById("defaultRiskInput"),
  recoveryRateInput: document.getElementById("recoveryRateInput"),
  appointmentRateInput: document.getElementById("appointmentRateInput"),
  priorityRateInput: document.getElementById("priorityRateInput"),
  digitalShareInput: document.getElementById("digitalShareInput"),
  outageRateInput: document.getElementById("outageRateInput"),
  outageMinutesInput: document.getElementById("outageMinutesInput"),
  amlThresholdInput: document.getElementById("amlThresholdInput"),
  scenarioSnapshotNameInput: document.getElementById(
    "scenarioSnapshotNameInput",
  ),
  snapshotList: document.getElementById("snapshotList"),
  comparisonModal: document.getElementById("comparisonModal"),
  comparisonContent: document.getElementById("comparisonContent"),
  eventBanner: document.getElementById("eventBanner"),
  decisionInsights: document.getElementById("decisionInsights"),
  metricCashDesk: document.getElementById("metricCashDesk"),
  metricVaultCash: document.getElementById("metricVaultCash"),
  metricClientDeposits: document.getElementById("metricClientDeposits"),
  metricLoanPortfolio: document.getElementById("metricLoanPortfolio"),
  metricOverduePortfolio: document.getElementById("metricOverduePortfolio"),
  metricRecovered: document.getElementById("metricRecovered"),
  metricCommissionIncome: document.getElementById("metricCommissionIncome"),
  metricStaffCost: document.getElementById("metricStaffCost"),
  metricEquity: document.getElementById("metricEquity"),
  metricSatisfaction: document.getElementById("metricSatisfaction"),
  metricNps: document.getElementById("metricNps"),
  metricUtilization: document.getElementById("metricUtilization"),
  metricComplianceFlags: document.getElementById("metricComplianceFlags"),
};

const state = {
  nodes: [],
  edges: [],
  records: [],
  capitalLedger: [],
  scenario: {
    businessName: "Entidad financiera",
    initialCapital: 1000000,
    currentCapital: 1000000,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    simulationUnit: "days",
    simulationLength: 1,
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    openingTime: "08:00",
    closingTime: "19:00",
    minimumReserve: 250000,
    initialVaultCash: 300000,
    initialCashDesk: 100000,
    commissionRate: 1.5,
    monthlyDefaultRate: 8,
    recoveryRate: 45,
    appointmentRate: 25,
    priorityRate: 10,
    digitalShare: 20,
    dailyOutageRate: 3,
    outageMinutes: 20,
    amlThreshold: 10000,
  },
  financial: {
    cashDesk: 100000,
    vaultCash: 300000,
    clientDeposits: 0,
    investmentLiability: 0,
    loanPortfolio: 0,
    overduePortfolio: 0,
    recoveredTotal: 0,
    commissionIncome: 0,
    interestCollected: 0,
    staffCost: 0,
    operatingCost: 0,
  },
  loanAccounts: [],
  scenarioSnapshots: [],
  currentSimulationDay: -1,
  operationalEvent: null,
  selected: null,
  connectionMode: false,
  connectionOrigin: null,
  zoom: 1,
  draggingNode: null,
  dragOffset: { x: 0, y: 0 },
  dragStart: { x: 0, y: 0 },
  dragMoved: false,
  dragPointerId: null,
  running: false,
  paused: false,
  simTime: 0,
  speed: Number(dom.speedSelect.value),
  lastFrame: 0,
  nextEntityId: 1,
  nextEventId: 1,
  events: [],
  movingEntities: [],
  nodeRuntime: new Map(),
  sourceSchedule: new Map(),
  metrics: {
    created: 0,
    completed: 0,
    rejected: 0,
    maxQueue: 0,
    creditApproved: 0,
    creditRejected: 0,
    depositTotal: 0,
    withdrawalTotal: 0,
    creditDisbursed: 0,
    interestReceivable: 0,
    paymentTotal: 0,
    transferInTotal: 0,
    transferOutTotal: 0,
    delayedEvents: 0,
    angryUsers: 0,
    abandonedUsers: 0,
    satisfactionTotal: 0,
    satisfactionSamples: 0,
    promoters: 0,
    detractors: 0,
    staffBusyMinutes: 0,
    staffCapacityMinutes: 0,
    complianceFlags: 0,
    blockedOperations: 0,
    loanPaymentsReceived: 0,
    delinquentLoans: 0,
    history: [],
  },
  nextHistoryTime: 0,
};

const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  },
};

function uid(prefix) {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return prefix + "-" + window.crypto.randomUUID();
  }
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 9)
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function formatNumber(value, decimals = 1) {
  return Number(value || 0).toLocaleString("es-EC", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function safeColor(value, fallback = "#3a8bfd") {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function timeStringToMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToClock(totalMinutes) {
  const normalized = Math.max(0, Math.round(Number(totalMinutes) || 0));
  const hours = Math.floor(normalized / 60) % 24;
  const minutes = normalized % 60;
  return (
    String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0")
  );
}

function sessionStartMinutes() {
  return timeStringToMinutes(state.scenario?.openingTime || "08:00");
}

function sessionEndMinutes() {
  return timeStringToMinutes(state.scenario?.closingTime || "19:00");
}

function sessionDurationMinutes() {
  return Math.max(1, sessionEndMinutes() - sessionStartMinutes());
}

function parseLocalDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return new Date();
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
    0,
    0,
    0,
  );
}

function formatDateIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function calculateEndDate(startDate, unit, quantity) {
  const start = parseLocalDate(startDate);
  const length = clamp(
    Math.floor(Number(quantity) || 1),
    1,
    unit === "months" ? 12 : 365,
  );
  const end = new Date(start);
  if (unit === "months") {
    end.setMonth(end.getMonth() + length);
    end.setDate(end.getDate() - 1);
  } else {
    end.setDate(end.getDate() + length - 1);
  }
  return formatDateIso(end);
}

function normalizedOperatingDays() {
  const values = Array.isArray(state.scenario?.operatingDays)
    ? state.scenario.operatingDays
        .map(Number)
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    : [];
  return [...new Set(values)].sort((a, b) => a - b);
}

function simulationCalendarDates() {
  const start = parseLocalDate(state.scenario?.startDate);
  let end = parseLocalDate(
    state.scenario?.endDate || state.scenario?.startDate,
  );
  if (end < start) end = new Date(start);
  const enabledDays = new Set(normalizedOperatingDays());
  const dates = [];
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= end && guard < 3700) {
    if (enabledDays.has(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return dates;
}

function simulationDaysCount() {
  return simulationCalendarDates().length;
}

function simulationTotalMinutes() {
  return simulationDaysCount() * sessionDurationMinutes();
}

function simulationDayIndex(simMinute = state.simTime) {
  const duration = sessionDurationMinutes();
  const days = simulationDaysCount();
  if (days <= 0) return 0;
  return Math.min(
    days - 1,
    Math.max(0, Math.floor(Math.max(0, Number(simMinute) || 0) / duration)),
  );
}

function simulationDate(simMinute = state.simTime) {
  const dates = simulationCalendarDates();
  if (dates.length === 0) return parseLocalDate(state.scenario?.startDate);
  return new Date(dates[simulationDayIndex(simMinute)]);
}

function simulationClock(simMinute = state.simTime) {
  const duration = sessionDurationMinutes();
  const raw = Math.max(0, Number(simMinute) || 0);
  let minuteWithinDay = raw % duration;
  if (raw > 0 && raw >= simulationTotalMinutes()) minuteWithinDay = duration;
  return minutesToClock(sessionStartMinutes() + minuteWithinDay);
}

function simulationDateTime(simMinute = state.simTime) {
  return `${formatDisplayDate(simulationDate(simMinute))} ${simulationClock(simMinute)}`;
}

function populateScheduleSelectors() {
  if (!dom.openingTimeInput || !dom.closingTimeInput) return;
  const options = [];
  for (let minutes = 8 * 60; minutes <= 19 * 60; minutes += 30) {
    const value = minutesToClock(minutes);
    const display = value.replace(":", "h");
    options.push(`<option value="${value}">${display}</option>`);
  }
  const html = options.join("");
  dom.openingTimeInput.innerHTML = html;
  dom.closingTimeInput.innerHTML = html;
}

function updateScenarioUi() {
  ensureAdvancedScenario();
  const name =
    String(state.scenario?.businessName || "Entidad financiera").trim() ||
    "Entidad financiera";
  const capital = Math.max(0, Number(state.scenario?.initialCapital) || 0);
  let startDate = String(
    state.scenario?.startDate || new Date().toISOString().slice(0, 10),
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
    startDate = new Date().toISOString().slice(0, 10);
  let simulationUnit =
    state.scenario?.simulationUnit === "months" ? "months" : "days";
  let simulationLength = clamp(
    Math.floor(Number(state.scenario?.simulationLength) || 1),
    1,
    simulationUnit === "months" ? 12 : 365,
  );
  let endDate = String(
    state.scenario?.endDate ||
      calculateEndDate(startDate, simulationUnit, simulationLength),
  );
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
    parseLocalDate(endDate) < parseLocalDate(startDate)
  ) {
    endDate = calculateEndDate(startDate, simulationUnit, simulationLength);
  }
  let operatingDays = normalizedOperatingDays();
  if (operatingDays.length === 0) operatingDays = [0, 1, 2, 3, 4, 5, 6];
  let openingTime = String(state.scenario?.openingTime || "08:00");
  let closingTime = String(state.scenario?.closingTime || "19:00");
  if (
    timeStringToMinutes(openingTime) < 8 * 60 ||
    timeStringToMinutes(openingTime) > 19 * 60
  )
    openingTime = "08:00";
  if (
    timeStringToMinutes(closingTime) < 8 * 60 ||
    timeStringToMinutes(closingTime) > 19 * 60
  )
    closingTime = "19:00";
  if (timeStringToMinutes(closingTime) <= timeStringToMinutes(openingTime))
    closingTime = "19:00";

  state.scenario.businessName = name;
  state.scenario.initialCapital = capital;
  state.scenario.startDate = startDate;
  state.scenario.endDate = endDate;
  state.scenario.simulationUnit = simulationUnit;
  state.scenario.simulationLength = simulationLength;
  state.scenario.operatingDays = operatingDays;
  if (!Number.isFinite(Number(state.scenario.currentCapital)))
    state.scenario.currentCapital = capital;
  state.scenario.currentCapital = Math.max(
    0,
    Number(state.scenario.currentCapital) || 0,
  );
  state.scenario.openingTime = openingTime;
  state.scenario.closingTime = closingTime;

  if (dom.minimumReserveInput)
    dom.minimumReserveInput.value = String(state.scenario.minimumReserve);
  if (dom.vaultCashInput && !state.running)
    dom.vaultCashInput.value = String(state.scenario.initialVaultCash);
  if (dom.cashDeskInput && !state.running)
    dom.cashDeskInput.value = String(state.scenario.initialCashDesk);
  if (dom.commissionRateInput)
    dom.commissionRateInput.value = String(state.scenario.commissionRate);
  if (dom.defaultRiskInput)
    dom.defaultRiskInput.value = String(state.scenario.monthlyDefaultRate);
  if (dom.recoveryRateInput)
    dom.recoveryRateInput.value = String(state.scenario.recoveryRate);
  if (dom.appointmentRateInput)
    dom.appointmentRateInput.value = String(state.scenario.appointmentRate);
  if (dom.priorityRateInput)
    dom.priorityRateInput.value = String(state.scenario.priorityRate);
  if (dom.digitalShareInput)
    dom.digitalShareInput.value = String(state.scenario.digitalShare);
  if (dom.outageRateInput)
    dom.outageRateInput.value = String(state.scenario.dailyOutageRate);
  if (dom.outageMinutesInput)
    dom.outageMinutesInput.value = String(state.scenario.outageMinutes);
  if (dom.amlThresholdInput)
    dom.amlThresholdInput.value = String(state.scenario.amlThreshold);
  if (dom.businessNameInput && dom.businessNameInput.value !== name)
    dom.businessNameInput.value = name;
  if (
    dom.initialCapitalInput &&
    Number(dom.initialCapitalInput.value) !== capital
  )
    dom.initialCapitalInput.value = String(capital);
  if (dom.simulationStartDateInput)
    dom.simulationStartDateInput.value = startDate;
  if (dom.simulationEndDateInput) {
    dom.simulationEndDateInput.min = startDate;
    dom.simulationEndDateInput.value = endDate;
  }
  if (dom.startDayLabel)
    dom.startDayLabel.textContent = new Intl.DateTimeFormat("es-EC", {
      weekday: "long",
    }).format(parseLocalDate(startDate));
  if (dom.endDayLabel)
    dom.endDayLabel.textContent = new Intl.DateTimeFormat("es-EC", {
      weekday: "long",
    }).format(parseLocalDate(endDate));
  if (dom.weekdaySelector) {
    dom.weekdaySelector
      .querySelectorAll('input[type="checkbox"]')
      .forEach((input) => {
        input.checked = operatingDays.includes(Number(input.value));
      });
  }
  if (dom.simulationUnitInput) dom.simulationUnitInput.value = simulationUnit;
  if (dom.simulationLengthInput) {
    dom.simulationLengthInput.value = String(simulationLength);
    dom.simulationLengthInput.max = simulationUnit === "months" ? "12" : "365";
  }
  if (dom.openingTimeInput) dom.openingTimeInput.value = openingTime;
  if (dom.closingTimeInput) dom.closingTimeInput.value = closingTime;
  if (dom.scenarioTitle)
    dom.scenarioTitle.textContent = name + " · recorrido de usuarios por áreas";
  const periodText =
    simulationUnit === "months"
      ? `${simulationLength} ${simulationLength === 1 ? "mes" : "meses"}`
      : `${simulationLength} ${simulationLength === 1 ? "día" : "días"}`;
  const enabledCount = operatingDays.length;
  if (dom.scheduleBadge)
    dom.scheduleBadge.textContent = `${formatDisplayDate(parseLocalDate(startDate))}–${formatDisplayDate(parseLocalDate(endDate))} · ${openingTime.replace(":", "h")}–${closingTime.replace(":", "h")} · ${enabledCount} días/sem.`;
  if (dom.capitalBadge) {
    const capitalText =
      "Capital disponible: " + formatCurrency(state.scenario.currentCapital);
    dom.capitalBadge.textContent = capitalText;
    dom.capitalBadge.title = capitalText;
  }
  if (dom.metricCapital)
    dom.metricCapital.textContent = compactCurrency(
      state.scenario.currentCapital,
    );
  if (dom.metricDate)
    dom.metricDate.textContent = formatDisplayDate(simulationDate());
}

function getTransactionConfig(type) {
  return TRANSACTION_TYPES[type] || TRANSACTION_TYPES.inquiry;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function compactCurrency(value) {
  const rawAmount = Number(value) || 0;
  const sign = rawAmount < 0 ? "-" : "";
  const amount = Math.abs(rawAmount);
  if (amount >= 1000000)
    return sign + "$" + formatNumber(amount / 1000000, 1) + "M";
  if (amount >= 1000)
    return (
      sign + "$" + formatNumber(amount / 1000, amount >= 10000 ? 0 : 1) + "K"
    );
  return sign + "$" + formatNumber(amount, amount % 1 ? 2 : 0);
}

function ensureAdvancedScenario() {
  const defaults = {
    minimumReserve: 250000,
    initialVaultCash: 300000,
    initialCashDesk: 100000,
    commissionRate: 1.5,
    monthlyDefaultRate: 8,
    recoveryRate: 45,
    appointmentRate: 25,
    priorityRate: 10,
    digitalShare: 20,
    dailyOutageRate: 3,
    outageMinutes: 20,
    amlThreshold: 10000,
  };
  Object.entries(defaults).forEach(([key, value]) => {
    if (!Number.isFinite(Number(state.scenario?.[key])))
      state.scenario[key] = value;
  });
  state.scenario.minimumReserve = Math.max(
    0,
    Number(state.scenario.minimumReserve) || 0,
  );
  state.scenario.initialVaultCash = Math.max(
    0,
    Number(state.scenario.initialVaultCash) || 0,
  );
  state.scenario.initialCashDesk = Math.max(
    0,
    Number(state.scenario.initialCashDesk) || 0,
  );
  state.scenario.commissionRate = clamp(
    Number(state.scenario.commissionRate) || 0,
    0,
    100,
  );
  state.scenario.monthlyDefaultRate = clamp(
    Number(state.scenario.monthlyDefaultRate) || 0,
    0,
    100,
  );
  state.scenario.recoveryRate = clamp(
    Number(state.scenario.recoveryRate) || 0,
    0,
    100,
  );
  state.scenario.appointmentRate = clamp(
    Number(state.scenario.appointmentRate) || 0,
    0,
    100,
  );
  state.scenario.priorityRate = clamp(
    Number(state.scenario.priorityRate) || 0,
    0,
    100,
  );
  state.scenario.digitalShare = clamp(
    Number(state.scenario.digitalShare) || 0,
    0,
    100,
  );
  state.scenario.dailyOutageRate = clamp(
    Number(state.scenario.dailyOutageRate) || 0,
    0,
    100,
  );
  state.scenario.outageMinutes = clamp(
    Math.floor(Number(state.scenario.outageMinutes) || 20),
    1,
    240,
  );
  state.scenario.amlThreshold = Math.max(
    0,
    Number(state.scenario.amlThreshold) || 0,
  );
}

function resetAdvancedFinancialState() {
  ensureAdvancedScenario();
  state.financial = {
    cashDesk: Math.max(0, Number(state.scenario.initialCashDesk) || 0),
    vaultCash: Math.max(0, Number(state.scenario.initialVaultCash) || 0),
    clientDeposits: 0,
    investmentLiability: 0,
    loanPortfolio: 0,
    overduePortfolio: 0,
    recoveredTotal: 0,
    commissionIncome: 0,
    interestCollected: 0,
    staffCost: 0,
    operatingCost: 0,
  };
  state.loanAccounts = [];
  state.currentSimulationDay = -1;
  state.operationalEvent = null;
}

function estimatedEquity() {
  const assets =
    Math.max(0, Number(state.scenario.currentCapital) || 0) +
    Math.max(0, Number(state.financial.loanPortfolio) || 0) +
    Math.max(0, Number(state.metrics.interestReceivable) || 0);
  const liabilities =
    Math.max(0, Number(state.financial.clientDeposits) || 0) +
    Math.max(0, Number(state.financial.investmentLiability) || 0);
  return (
    assets -
    liabilities -
    Math.max(0, Number(state.financial.staffCost) || 0) -
    Math.max(0, Number(state.financial.operatingCost) || 0)
  );
}

function transferVaultToCashDesk(requiredAmount) {
  const required = Math.max(0, Number(requiredAmount) || 0);
  if (state.financial.cashDesk >= required) return true;
  const shortage = required - state.financial.cashDesk;
  const transfer = Math.min(shortage, state.financial.vaultCash);
  state.financial.vaultCash -= transfer;
  state.financial.cashDesk += transfer;
  return state.financial.cashDesk >= required;
}

function balanceCashDesk() {
  const maxCash = Math.max(
    1000,
    ...state.nodes
      .filter(
        (node) =>
          node.type === "process" &&
          node.props.processRole === "transaction_processing",
      )
      .map((node) => Number(node.props.cashMaximum) || 50000),
  );
  const minCash = Math.max(
    0,
    ...state.nodes
      .filter(
        (node) =>
          node.type === "process" &&
          node.props.processRole === "transaction_processing",
      )
      .map((node) => Number(node.props.cashMinimum) || 5000),
  );
  if (state.financial.cashDesk > maxCash) {
    const excess = state.financial.cashDesk - maxCash;
    state.financial.cashDesk -= excess;
    state.financial.vaultCash += excess;
  } else if (
    state.financial.cashDesk < minCash &&
    state.financial.vaultCash > 0
  ) {
    const transfer = Math.min(
      minCash - state.financial.cashDesk,
      state.financial.vaultCash,
    );
    state.financial.vaultCash -= transfer;
    state.financial.cashDesk += transfer;
  }
}

function isOperationalEventActive() {
  return (
    state.operationalEvent &&
    state.simTime >= state.operationalEvent.start &&
    state.simTime < state.operationalEvent.end
  );
}

function processSimulationDayEvents() {
  const day = simulationDayIndex();
  if (day === state.currentSimulationDay) {
    if (state.operationalEvent && state.simTime >= state.operationalEvent.end) {
      state.operationalEvent = null;
      if (dom.eventBanner) dom.eventBanner.classList.remove("show");
    }
    return;
  }
  state.currentSimulationDay = day;
  state.operationalEvent = null;
  if (dom.eventBanner) dom.eventBanner.classList.remove("show");
  if (Math.random() * 100 < state.scenario.dailyOutageRate) {
    const duration = Math.min(
      sessionDurationMinutes(),
      Math.max(1, Number(state.scenario.outageMinutes) || 20),
    );
    const dayStart = day * sessionDurationMinutes();
    const latestStart = Math.max(0, sessionDurationMinutes() - duration);
    const start = dayStart + randomAmount(0, latestStart);
    state.operationalEvent = {
      type: "system_outage",
      start,
      end: start + duration,
      label: "Falla temporal del sistema",
    };
  }
  processLoanPortfolioForDay(day);
}

function processLoanPortfolioForDay(dayIndex) {
  const date = simulationDate(dayIndex * sessionDurationMinutes());
  state.loanAccounts.forEach((loan) => {
    if (loan.status === "paid") return;
    const elapsedDays = Math.max(
      0,
      Math.floor((date - parseLocalDate(loan.startDate)) / 86400000),
    );
    const installmentNumber = Math.floor(elapsedDays / 30);
    if (
      installmentNumber <= 0 ||
      installmentNumber <= loan.installmentsProcessed
    )
      return;
    loan.installmentsProcessed = installmentNumber;
    const principalOutstanding = Math.max(
      0,
      Number(loan.outstandingPrincipal) || 0,
    );
    if (principalOutstanding <= 0) {
      loan.status = "paid";
      return;
    }
    const monthlyInterest =
      (principalOutstanding * (Number(loan.annualRate) || 0)) / 100 / 12;
    const expectedPayment = Math.min(
      Number(loan.monthlyPayment) || 0,
      principalOutstanding + monthlyInterest,
    );
    const goesLate = Math.random() * 100 < state.scenario.monthlyDefaultRate;
    if (goesLate) {
      loan.status = "overdue";
      loan.overdueAmount += expectedPayment;
      state.financial.overduePortfolio += expectedPayment;
      state.metrics.delinquentLoans += 1;
      if (Math.random() * 100 < state.scenario.recoveryRate) {
        const recovery = Math.min(
          loan.overdueAmount,
          expectedPayment * randomAmount(0.35, 1),
        );
        loan.overdueAmount -= recovery;
        state.financial.overduePortfolio = Math.max(
          0,
          state.financial.overduePortfolio - recovery,
        );
        state.financial.recoveredTotal += recovery;
        state.metrics.loanPaymentsReceived += recovery;
        state.scenario.currentCapital += recovery;
        if (loan.overdueAmount <= 0.01) loan.status = "current";
      }
      return;
    }
    const interestPaid = Math.min(expectedPayment, monthlyInterest);
    const principalPaid = Math.max(0, expectedPayment - interestPaid);
    loan.outstandingPrincipal = Math.max(
      0,
      principalOutstanding - principalPaid,
    );
    state.financial.loanPortfolio = Math.max(
      0,
      state.financial.loanPortfolio - principalPaid,
    );
    state.metrics.interestReceivable = Math.max(
      0,
      state.metrics.interestReceivable - interestPaid,
    );
    state.financial.interestCollected += interestPaid;
    state.metrics.loanPaymentsReceived += expectedPayment;
    state.scenario.currentCapital += expectedPayment;
    loan.status = loan.outstandingPrincipal <= 0.01 ? "paid" : "current";
  });
}

function isNodeOnShift(node) {
  if (!node || node.type !== "process") return true;
  const now = timeStringToMinutes(simulationClock());
  const shiftStart = timeStringToMinutes(
    node.props.shiftStart || state.scenario.openingTime,
  );
  const shiftEnd = timeStringToMinutes(
    node.props.shiftEnd || state.scenario.closingTime,
  );
  if (now < shiftStart || now >= shiftEnd) return false;
  const lunchStart = timeStringToMinutes(node.props.lunchStart || "13:00");
  const lunchMinutes = Math.max(0, Number(node.props.lunchMinutes) || 0);
  if (lunchMinutes > 0 && now >= lunchStart && now < lunchStart + lunchMinutes)
    return false;
  if (
    isOperationalEventActive() &&
    [
      "standard",
      "credit_evaluation",
      "transaction_processing",
      "banking_services",
      "digital",
      "compliance",
    ].includes(node.props.processRole || "standard")
  )
    return false;
  return true;
}

function accumulateAdvancedMetrics(minutes) {
  const delta = Math.max(0, Number(minutes) || 0);
  state.nodes
    .filter((node) => node.type === "process")
    .forEach((node) => {
      const runtime = ensureNodeRuntime(node);
      const capacity = Math.max(1, Number(node.props.capacity) || 1);
      if (isNodeOnShift(node)) {
        state.metrics.staffCapacityMinutes += capacity * delta;
        state.metrics.staffBusyMinutes +=
          Math.min(capacity, runtime.busy) * delta;
        const cost =
          (Math.max(0, Number(node.props.staffCostPerHour) || 0) *
            capacity *
            delta) /
          60;
        state.financial.staffCost += cost;
      }
    });
  balanceCashDesk();
  if (state.operationalEvent && isOperationalEventActive() && dom.eventBanner) {
    dom.eventBanner.textContent = `⚠ ${state.operationalEvent.label} · ${formatNumber(state.operationalEvent.end - state.simTime, 0)} min restantes`;
    dom.eventBanner.classList.add("show");
  }
}

function enqueueEntity(runtime, entity) {
  const priorityScore =
    entity.priorityLevel === "priority" ? 2 : entity.hasAppointment ? 1 : 0;
  const index = runtime.queue.findIndex((item) => {
    const itemScore =
      item.priorityLevel === "priority" ? 2 : item.hasAppointment ? 1 : 0;
    return itemScore < priorityScore;
  });
  if (index === -1) runtime.queue.push(entity);
  else runtime.queue.splice(index, 0, entity);
}

function calculateSatisfaction(entity) {
  const wait = Math.max(0, Number(entity.totalWaitMinutes) || 0);
  const duration = Math.max(0, state.simTime - Number(entity.createdAt || 0));
  let score = 5;
  if (wait > 5) score -= 1;
  if (wait > 15) score -= 1;
  if (wait > 30) score -= 1;
  if (entity.mood === "angry") score -= 1;
  if (
    entity.operationOutcome === "rejected" ||
    entity.creditOutcome === "rejected"
  )
    score -= 1;
  if (entity.operationOutcome === "abandoned") score = 1;
  if (entity.hasAppointment && wait <= 5) score += 0.25;
  if (duration > 90) score -= 0.5;
  return clamp(Math.round(score * 10) / 10, 1, 5);
}

function npsCategory(score) {
  if (score >= 4.5) return "Promotor";
  if (score <= 3) return "Detractor";
  return "Pasivo";
}

function renderDecisionInsights() {
  if (!dom.decisionInsights) return;
  const completed = Math.max(1, state.metrics.completed);
  const avgWait = state.records.length
    ? state.records.reduce(
        (sum, record) => sum + Number(record.waitingMinutes || 0),
        0,
      ) / state.records.length
    : 0;
  const approvalTotal =
    state.metrics.creditApproved + state.metrics.creditRejected;
  const approvalRate = approvalTotal
    ? (state.metrics.creditApproved / approvalTotal) * 100
    : 0;
  const utilization = state.metrics.staffCapacityMinutes
    ? (state.metrics.staffBusyMinutes / state.metrics.staffCapacityMinutes) *
      100
    : 0;
  const reserveGap = Math.max(
    0,
    state.scenario.minimumReserve - Number(state.scenario.currentCapital || 0),
  );
  const insights = [];
  if (reserveGap > 0)
    insights.push([
      "danger",
      `La liquidez está ${formatCurrency(reserveGap)} por debajo de la reserva mínima configurada.`,
    ]);
  else
    insights.push([
      "success",
      `La reserva mínima está cubierta. Excedente disponible: ${formatCurrency(Math.max(0, state.scenario.currentCapital - state.scenario.minimumReserve))}.`,
    ]);
  if (avgWait > 15)
    insights.push([
      "warning",
      `Espera promedio de ${formatNumber(avgWait, 1)} min. Revise personal, turnos o capacidad de las áreas congestionadas.`,
    ]);
  else if (state.records.length)
    insights.push([
      "success",
      `La espera promedio es ${formatNumber(avgWait, 1)} min; el nivel de servicio se mantiene controlado.`,
    ]);
  if (utilization < 35 && state.simTime > 60)
    insights.push([
      "warning",
      `Utilización del personal de ${formatNumber(utilization, 0)}%. Puede probar un escenario con menos personal.`,
    ]);
  if (utilization > 85)
    insights.push([
      "danger",
      `Utilización del personal de ${formatNumber(utilization, 0)}%. Existe riesgo de congestión y demoras.`,
    ]);
  if (approvalTotal && approvalRate < 20)
    insights.push([
      "warning",
      `Aprobación crediticia de ${formatNumber(approvalRate, 1)}%. Revise plazos, tasas y criterios de riesgo.`,
    ]);
  if (state.financial.overduePortfolio > 0)
    insights.push([
      "danger",
      `Cartera en mora: ${formatCurrency(state.financial.overduePortfolio)}. Evalúe cobranza y refinanciamiento.`,
    ]);
  if (!insights.length)
    insights.push([
      "success",
      "Ejecute la simulación para generar recomendaciones basadas en los resultados.",
    ]);
  dom.decisionInsights.innerHTML = insights
    .slice(0, 5)
    .map(
      ([type, message]) =>
        `<div class="decision-insight ${type}">${escapeHtml(message)}</div>`,
    )
    .join("");
}

function currentScenarioSnapshot(name) {
  const records = state.records.length;
  const avgWait = records
    ? state.records.reduce(
        (sum, record) => sum + Number(record.waitingMinutes || 0),
        0,
      ) / records
    : 0;
  const satisfaction = state.metrics.satisfactionSamples
    ? state.metrics.satisfactionTotal / state.metrics.satisfactionSamples
    : 0;
  const nps = state.metrics.satisfactionSamples
    ? ((state.metrics.promoters - state.metrics.detractors) /
        state.metrics.satisfactionSamples) *
      100
    : 0;
  const utilization = state.metrics.staffCapacityMinutes
    ? (state.metrics.staffBusyMinutes / state.metrics.staffCapacityMinutes) *
      100
    : 0;
  return {
    id: uid("scenario"),
    name: String(name || "Escenario").trim() || "Escenario",
    savedAt: new Date().toISOString(),
    staff: totalStaff(),
    completed: state.metrics.completed,
    avgWait,
    angry: state.metrics.angryUsers,
    abandoned: state.metrics.abandonedUsers,
    capital: Number(state.scenario.currentCapital) || 0,
    equity: estimatedEquity(),
    creditApproved: state.metrics.creditApproved,
    creditRejected: state.metrics.creditRejected,
    overduePortfolio: state.financial.overduePortfolio,
    staffCost: state.financial.staffCost,
    satisfaction,
    nps,
    utilization,
  };
}

function saveScenarioSnapshot() {
  const snapshot = currentScenarioSnapshot(
    dom.scenarioSnapshotNameInput?.value || "Escenario",
  );
  state.scenarioSnapshots.unshift(snapshot);
  if (state.scenarioSnapshots.length > 8) state.scenarioSnapshots.pop();
  safeStorage.set(
    "simuladorBancarioNeodatScenariosV13",
    JSON.stringify(state.scenarioSnapshots),
  );
  renderSnapshotList();
  showToast("Resultado guardado para comparación.");
}

function renderSnapshotList() {
  if (!dom.snapshotList) return;
  if (!state.scenarioSnapshots.length) {
    dom.snapshotList.innerHTML = `<div class="snapshot-card"><strong>Sin escenarios guardados</strong><span>Ejecute una simulación y guarde su resultado.</span></div>`;
    return;
  }
  dom.snapshotList.innerHTML = state.scenarioSnapshots
    .map(
      (item) => `
        <div class="snapshot-card">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${item.completed} finalizados · espera ${formatNumber(item.avgWait, 1)} min · capital ${formatCurrency(item.capital)}</span>
          <span>Personal ${item.staff} · satisfacción ${item.satisfaction ? formatNumber(item.satisfaction, 1) + "/5" : "—"}</span>
        </div>
      `,
    )
    .join("");
}

function renderScenarioComparison() {
  if (!dom.comparisonContent) return;
  if (!state.scenarioSnapshots.length) {
    dom.comparisonContent.innerHTML = `<div class="decision-insight warning">No existen escenarios guardados para comparar.</div>`;
    return;
  }
  const metrics = [
    ["Personal", "staff", (value) => formatNumber(value, 0)],
    ["Trámites finalizados", "completed", (value) => formatNumber(value, 0)],
    ["Espera promedio", "avgWait", (value) => formatNumber(value, 1) + " min"],
    ["Usuarios molestos", "angry", (value) => formatNumber(value, 0)],
    ["Abandonos", "abandoned", (value) => formatNumber(value, 0)],
    ["Capital disponible", "capital", formatCurrency],
    ["Patrimonio estimado", "equity", formatCurrency],
    ["Créditos aprobados", "creditApproved", (value) => formatNumber(value, 0)],
    [
      "Créditos rechazados",
      "creditRejected",
      (value) => formatNumber(value, 0),
    ],
    ["Cartera en mora", "overduePortfolio", formatCurrency],
    ["Costo de personal", "staffCost", formatCurrency],
    [
      "Satisfacción",
      "satisfaction",
      (value) => (value ? formatNumber(value, 1) + "/5" : "—"),
    ],
    ["NPS", "nps", (value) => formatNumber(value, 0)],
    ["Utilización", "utilization", (value) => formatNumber(value, 0) + "%"],
  ];
  const header = `<tr><th>KPI</th>${state.scenarioSnapshots.map((item) => `<th>${escapeHtml(item.name)}</th>`).join("")}</tr>`;
  const body = metrics
    .map(
      ([label, key, formatter]) =>
        `<tr><td>${label}</td>${state.scenarioSnapshots.map((item) => `<td>${formatter(Number(item[key]) || 0)}</td>`).join("")}</tr>`,
    )
    .join("");
  dom.comparisonContent.innerHTML = `<table class="comparison-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
}

function randomAmount(min, max) {
  const low = Math.max(0, Number(min) || 0);
  const high = Math.max(low, Number(max) || low);
  return Math.round((low + Math.random() * (high - low)) * 100) / 100;
}

function weightedAmount(bands) {
  const validBands = Array.isArray(bands)
    ? bands.filter((band) => Number(band?.weight) > 0)
    : [];
  if (!validBands.length) return 0;

  const totalWeight = validBands.reduce(
    (sum, band) => sum + Number(band.weight),
    0,
  );
  let draw = Math.random() * totalWeight;

  for (const band of validBands) {
    draw -= Number(band.weight);
    if (draw <= 0) return randomAmount(band.min, band.max);
  }

  const lastBand = validBands[validBands.length - 1];
  return randomAmount(lastBand.min, lastBand.max);
}

function normalizeConfiguredRange(
  config,
  fallback,
  minimumAllowed = 0,
  maximumAllowed = Number.POSITIVE_INFINITY,
) {
  const safeMaximum = Number.isFinite(Number(maximumAllowed))
    ? Math.max(minimumAllowed, Number(maximumAllowed))
    : Number.POSITIVE_INFINITY;
  const fallbackMin = clamp(
    Number(fallback?.min) || minimumAllowed,
    minimumAllowed,
    safeMaximum,
  );
  const fallbackMax = clamp(
    Number(fallback?.max) || fallbackMin,
    fallbackMin,
    safeMaximum,
  );
  const configuredMin = Number(config?.min);
  const configuredMax = Number(config?.max);
  const min = roundUsd(
    clamp(
      Number.isFinite(configuredMin) ? configuredMin : fallbackMin,
      minimumAllowed,
      safeMaximum,
    ),
  );
  const max = roundUsd(
    clamp(
      Number.isFinite(configuredMax) ? configuredMax : fallbackMax,
      min,
      safeMaximum,
    ),
  );
  return { min, max };
}

function scaleAmountProfile(profile, configuredRange) {
  if (!Array.isArray(profile) || !profile.length) return [];
  const baseMin = Math.min(...profile.map((band) => Number(band.min) || 0));
  const baseMax = Math.max(...profile.map((band) => Number(band.max) || 0));
  const span = Math.max(0.000001, baseMax - baseMin);
  const targetSpan = Math.max(0, configuredRange.max - configuredRange.min);

  return profile.map((band, index) => {
    const minRatio = (Number(band.min) - baseMin) / span;
    const maxRatio = (Number(band.max) - baseMin) / span;
    const scaledMin =
      index === 0
        ? configuredRange.min
        : configuredRange.min + minRatio * targetSpan;
    const scaledMax =
      index === profile.length - 1
        ? configuredRange.max
        : configuredRange.min + maxRatio * targetSpan;
    return {
      min: Math.round(Math.max(configuredRange.min, scaledMin) * 100) / 100,
      max: Math.round(Math.max(scaledMin, scaledMax) * 100) / 100,
      weight: Number(band.weight) || 0,
    };
  });
}

function normalAutomaticAmount(type, props = {}) {
  if (type === "inquiry") return 0;

  const fallbackRange = DEFAULT_AUTOMATIC_AMOUNT_RANGES[type];
  const profile = DEFAULT_AUTOMATIC_AMOUNT_PROFILES[type];
  const limit = transactionLimit(type);

  if (fallbackRange && profile) {
    const configuredRange = normalizeConfiguredRange(
      props.automaticAmountRanges?.[type],
      fallbackRange,
      limit.min,
      limit.max,
    );
    return sanitizeTransactionAmount(
      type,
      weightedAmount(scaleAmountProfile(profile, configuredRange)),
    );
  }

  const transaction = getTransactionConfig(type);
  return sanitizeTransactionAmount(
    type,
    randomAmount(transaction.minAmount, transaction.maxAmount),
  );
}

function chooseTransactionAmount(type, props) {
  const mode = props.amountMode || "automatic";
  const limit = transactionLimit(type);
  let amount = 0;

  if (mode === "fixed") {
    amount = Number(props.amountFixed) || 0;
  } else if (mode === "random") {
    const configuredRange = normalizeConfiguredRange(
      { min: props.amountMin, max: props.amountMax },
      {
        min: limit.min,
        max: Math.min(
          limit.max,
          Math.max(limit.min, Number(props.amountMax) || limit.max),
        ),
      },
      limit.min,
      limit.max,
    );
    amount = randomAmount(configuredRange.min, configuredRange.max);
  } else {
    amount = normalAutomaticAmount(type, props);
  }

  return sanitizeTransactionAmount(type, amount);
}

function amountConfigurationSummary(props) {
  const mode = props.amountMode || "automatic";
  if (mode === "fixed") return formatCurrency(props.amountFixed || 0);
  if (mode === "random")
    return `${formatCurrency(props.amountMin || 0)} – ${formatCurrency(props.amountMax || 0)}`;
  return "Rangos automáticos ajustables";
}

function chooseTransactionType(props) {
  if ((props.transactionMode || "mixed") === "fixed") {
    return TRANSACTION_TYPES[props.transactionType]
      ? props.transactionType
      : "credit";
  }

  const defaults = NODE_TYPES.source.props.transactionWeights;
  const weights = { ...defaults, ...(props.transactionWeights || {}) };
  const entries = Object.keys(TRANSACTION_TYPES).map((type) => ({
    type,
    weight: Math.max(0, Number(weights[type]) || 0),
  }));
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return "inquiry";

  let random = Math.random() * total;
  for (const item of entries) {
    random -= item.weight;
    if (random <= 0) return item.type;
  }
  return entries[entries.length - 1].type;
}

function chooseCreditType(props) {
  const defaults = NODE_TYPES.source.props.creditTypeWeights || {};
  const weights = { ...defaults, ...(props.creditTypeWeights || {}) };
  const entries = Object.keys(CREDIT_TYPES).map((type) => ({
    type,
    weight: Math.max(0, Number(weights[type]) || 0),
  }));
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return "consumer";
  let random = Math.random() * total;
  for (const item of entries) {
    random -= item.weight;
    if (random <= 0) return item.type;
  }
  return "consumer";
}

function creditTypeLabel(type) {
  return CREDIT_TYPES[type]?.label || CREDIT_TYPES.consumer.label;
}

function transactionOptions(selected) {
  return Object.entries(TRANSACTION_TYPES)
    .map(
      ([value, item]) =>
        `<option value="${value}" ${selected === value ? "selected" : ""}>${item.label}</option>`,
    )
    .join("");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function updateStatus(message) {
  dom.statusMessage.textContent = message;
}
function getNode(nodeId) {
  return state.nodes.find((node) => node.id === nodeId) || null;
}
function getEdge(edgeId) {
  return state.edges.find((edge) => edge.id === edgeId) || null;
}
function getOutgoing(nodeId) {
  return state.edges.filter((edge) => edge.from === nodeId);
}
function getIncoming(nodeId) {
  return state.edges.filter((edge) => edge.to === nodeId);
}

function nodeCenter(node) {
  return { x: node.x + 94, y: node.y + 54 };
}

function totalStaff() {
  return state.nodes
    .filter((node) => node.type === "process")
    .reduce(
      (sum, node) => sum + Math.max(1, Number(node.props.capacity) || 1),
      0,
    );
}

function createNode(type, x, y, custom = {}) {
  const config = NODE_TYPES[type];
  if (!config) return null;

  const node = {
    id: uid("node"),
    type,
    name: custom.name || config.defaultName,
    x: clamp(Number(x) || 0, 0, 2400 - 188),
    y: clamp(Number(y) || 0, 0, 1400 - 108),
    props: { ...clone(config.props), ...(custom.props || {}) },
  };

  state.nodes.push(node);
  ensureNodeRuntime(node);
  renderAll();
  selectElement("node", node.id);
  return node;
}

function createEdge(from, to, weight = 1) {
  if (!from || !to || from === to) {
    showToast("La conexión no es válida.", "warning");
    return null;
  }

  const exists = state.edges.some(
    (edge) => edge.from === from && edge.to === to,
  );
  if (exists) {
    showToast("Esa conexión ya existe.", "warning");
    return null;
  }

  const fromNode = getNode(from);
  if (!fromNode || fromNode.type === "sink") {
    showToast("El bloque de salida no puede generar conexiones.", "warning");
    return null;
  }

  const edge = {
    id: uid("edge"),
    from,
    to,
    weight: Math.max(0, Number(weight) || 0),
    transactionTypes: [],
  };
  state.edges.push(edge);
  renderEdges();
  updateModelStatus();
  selectElement("edge", edge.id);
  showToast("Conexión creada.");
  return edge;
}

function ensureNodeRuntime(node) {
  if (!state.nodeRuntime.has(node.id)) {
    state.nodeRuntime.set(node.id, {
      queue: [],
      busy: 0,
      completed: 0,
      entered: 0,
      rejected: 0,
    });
  }
  return state.nodeRuntime.get(node.id);
}

function renderAll() {
  renderNodes();
  renderEdges();
  renderProperties();
  updateModelStatus();
  updateEmptyState();
  updateMetrics();
  updateScenarioUi();
  renderRecords();
}

function renderNodes() {
  dom.nodesLayer.innerHTML = "";

  state.nodes.forEach((node) => {
    const config = NODE_TYPES[node.type];
    const runtime = ensureNodeRuntime(node);

    const element = document.createElement("div");
    element.className = "node";
    element.dataset.nodeId = node.id;
    element.title = "Toque o haga clic para editar. Arrastre para mover.";
    element.style.left = node.x + "px";
    element.style.top = node.y + "px";

    if (state.selected?.kind === "node" && state.selected.id === node.id) {
      element.classList.add("selected");
    }
    if (state.connectionOrigin === node.id) {
      element.classList.add("connection-origin");
    }

    let statusValue = "0";
    let metricLabel = "Recorridos";
    let metricValue = runtime.completed;
    let details = "";
    let quickControls = "";

    if (node.type === "source") {
      statusValue = String(runtime.completed);
      metricLabel = "Ingresos";
      metricValue = runtime.completed;
      const transactionText =
        (node.props.transactionMode || "mixed") === "fixed"
          ? getTransactionConfig(node.props.transactionType || "credit").label
          : "Mezcla configurable";
      details = `<b>Usuario:</b> ${escapeHtml(node.props.personType || "Ciudadano")}<br><b>Trámite:</b> ${escapeHtml(transactionText)}<br><b>Monto USD:</b> ${escapeHtml(amountConfigurationSummary(node.props))}`;
    } else if (node.type === "queue") {
      const angryCount = runtime.queue.filter(
        (entity) => entity.mood === "angry",
      ).length;
      statusValue = String(runtime.queue.length);
      metricLabel = "En espera";
      metricValue = runtime.queue.length;
      details = `<b>Área:</b> ${escapeHtml(node.props.department || "General")}<br><b>Meta de espera:</b> ${formatNumber(node.props.targetWaitMinutes ?? 5, 0)} min<br><b>Trámite:</b> ${escapeHtml(node.props.procedure || "Espera")}${angryCount ? `<span class="mood-pill">😠 ${angryCount}</span>` : ""}`;
    } else if (node.type === "process") {
      statusValue =
        runtime.busy + "/" + Math.max(1, Number(node.props.capacity) || 1);
      metricLabel = "Atendidos";
      metricValue = runtime.completed;
      details = `<b>Depto.:</b> ${escapeHtml(node.props.department || "Área")}<br><b>Trámite:</b> ${escapeHtml(node.props.procedure || "Atención")}`;
      if (node.props.processRole === "credit_evaluation") {
        const angryCount = runtime.queue.filter(
          (entity) => entity.mood === "angry",
        ).length;
        details += `<br><b>Productos:</b> vivienda, vehículo, consumo, negocio y educativo${angryCount ? `<span class="mood-pill">😠 ${angryCount}</span>` : ""}`;
      } else if (node.props.processRole === "banking_services") {
        details += `<br><b>Servicios:</b> cuentas, tarjetas, seguros e inversiones`;
      }
      quickControls = `
            <div class="node-controls">
              <button class="mini-step" data-action="decrease" title="Reducir personal">−</button>
              <span class="mini-value">${Math.max(1, Number(node.props.capacity) || 1)}</span>
              <button class="mini-step" data-action="increase" title="Incrementar personal">+</button>
            </div>
          `;
    } else if (node.type === "decision") {
      statusValue = String(runtime.completed);
      metricLabel = "Derivadas";
      metricValue = runtime.completed;
      const routingText =
        (node.props.routingMode || "probability") === "transaction"
          ? "Según tipo de trámite"
          : "Según probabilidad";
      details = `<b>Departamento:</b> ${escapeHtml(node.props.department || "Flujo")}<br><b>Ruta:</b> ${escapeHtml(routingText)}`;
    } else if (node.type === "sink") {
      statusValue = String(runtime.completed);
      metricLabel = "Finalizadas";
      metricValue = runtime.completed;
      details = `<b>Estado final:</b> ${escapeHtml(node.props.finalStatus || "Completado")}<br><b>Registro:</b> guardado automáticamente`;
    }

    const active =
      (node.type === "queue" && runtime.queue.length > 0) ||
      (node.type === "process" && runtime.busy > 0) ||
      (node.type === "source" && state.running && !state.paused);

    element.innerHTML = `
          <span class="node-port in"></span>
          <span class="node-port out"></span>
          <div class="node-header">
            <div class="node-icon ${config.colorClass}" style="background:${safeColor(node.props.color, config.color || "#3a8bfd")};">${config.icon}</div>
            <div class="node-title">
              <strong title="${escapeHtml(node.name)}">${escapeHtml(node.name)}</strong>
              <span>${config.label}</span>
            </div>
            <div class="node-status">${statusValue}</div>
          </div>
          <div class="node-details">${details}</div>
          <div class="node-body">
            <div class="node-metric">
              <span>${metricLabel}</span>
              <strong>${metricValue}</strong>
            </div>
            ${quickControls || `<span class="node-indicator ${active ? "active" : ""}"></span>`}
          </div>
        `;

    element.addEventListener("pointerdown", (event) =>
      beginNodeDrag(event, node.id),
    );

    if (node.type === "process") {
      const downButton = element.querySelector('[data-action="decrease"]');
      const upButton = element.querySelector('[data-action="increase"]');

      downButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        adjustStaff(node.id, -1);
      });

      upButton?.addEventListener("click", (event) => {
        event.stopPropagation();
        adjustStaff(node.id, 1);
      });
    }

    dom.nodesLayer.appendChild(element);
  });
}

function adjustStaff(nodeId, delta) {
  const node = getNode(nodeId);
  if (!node || node.type !== "process") return;
  node.props.capacity = Math.max(1, (Number(node.props.capacity) || 1) + delta);
  renderNodes();
  updateMetrics();
  if (state.selected?.kind === "node" && state.selected.id === nodeId)
    renderProperties();
  updateStatus("Personal actualizado en " + node.name + ".");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEdges() {
  dom.edgeLayer.innerHTML = "";

  state.edges.forEach((edge) => {
    const fromNode = getNode(edge.from);
    const toNode = getNode(edge.to);
    if (!fromNode || !toNode) return;

    const start = { x: fromNode.x + 188, y: fromNode.y + 54 };
    const end = { x: toNode.x, y: toNode.y + 54 };
    const distance = Math.abs(end.x - start.x);
    const bend = Math.max(70, distance * 0.45);
    const direction = end.x >= start.x ? 1 : -1;
    const c1x = start.x + bend * direction;
    const c2x = end.x - bend * direction;
    const path = `M ${start.x} ${start.y} C ${c1x} ${start.y}, ${c2x} ${end.y}, ${end.x} ${end.y}`;

    const mid = cubicPoint(
      { x: start.x, y: start.y },
      { x: c1x, y: start.y },
      { x: c2x, y: end.y },
      { x: end.x, y: end.y },
      0.5,
    );

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "edge-group");
    group.dataset.edgeId = edge.id;

    if (state.selected?.kind === "edge" && state.selected.id === edge.id)
      group.classList.add("selected");

    const visible = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    visible.setAttribute("class", "edge-visible");
    visible.setAttribute("d", path);

    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("class", "edge-hit");
    hit.setAttribute("d", path);

    group.appendChild(visible);
    group.appendChild(hit);

    if (fromNode.type === "decision") {
      const labelText = formatDecisionLabel(edge, fromNode);
      const labelWidth = Math.max(48, Math.min(112, labelText.length * 7 + 16));
      const labelGroup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
      );
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("class", "edge-label-bg");
      rect.setAttribute("x", mid.x - labelWidth / 2);
      rect.setAttribute("y", mid.y - 12);
      rect.setAttribute("width", labelWidth);
      rect.setAttribute("height", 24);
      rect.setAttribute("rx", 8);

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("class", "edge-label");
      text.setAttribute("x", mid.x);
      text.setAttribute("y", mid.y + 0.5);
      text.textContent = labelText;

      labelGroup.appendChild(rect);
      labelGroup.appendChild(text);
      group.appendChild(labelGroup);
    }

    group.addEventListener("click", (event) => {
      event.stopPropagation();
      selectElement("edge", edge.id);
    });

    dom.edgeLayer.appendChild(group);
  });
}

function formatDecisionLabel(edge, fromNode) {
  if ((fromNode?.props?.routingMode || "probability") === "transaction") {
    const types = Array.isArray(edge.transactionTypes)
      ? edge.transactionTypes
      : [];
    if (types.length === 0) return "RESTO";
    return types.map((type) => getTransactionConfig(type).code).join("/");
  }

  const siblings = getOutgoing(edge.from);
  const total = siblings.reduce(
    (sum, item) => sum + Math.max(0, Number(item.weight) || 0),
    0,
  );
  const percent = total > 0 ? ((Number(edge.weight) || 0) / total) * 100 : 0;
  return formatNumber(percent, 0) + "%";
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
}

function handleNodeClick(nodeId) {
  if (!state.connectionMode) {
    selectElement("node", nodeId);
    return;
  }
  if (!state.connectionOrigin) {
    state.connectionOrigin = nodeId;
    selectElement("node", nodeId);
    updateStatus("Seleccione el bloque de destino.");
    renderNodes();
    return;
  }

  const origin = state.connectionOrigin;
  state.connectionOrigin = null;
  if (origin === nodeId) {
    showToast("Seleccione un bloque de destino diferente.", "warning");
    renderNodes();
    return;
  }

  createEdge(origin, nodeId, 1);
  renderNodes();
  updateStatus(
    "Conexión creada. Seleccione otro origen o desactive el modo Conectar.",
  );
}

function selectElement(kind, id) {
  state.selected = { kind, id };
  renderNodes();
  renderEdges();
  renderProperties();

  if (window.innerWidth <= 1100 && kind) {
    dom.sidebar.classList.remove("open");
    dom.properties.classList.add("open");
  }
}

function clearSelection() {
  state.selected = null;
  renderNodes();
  renderEdges();
  renderProperties();
}

function renderProperties() {
  const selection = state.selected;
  if (!selection) {
    dom.selectionType.textContent = "Sin selección";
    dom.propertiesContent.className = "properties-empty";
    dom.propertiesContent.innerHTML = `
          <strong>Seleccione un elemento</strong>
          Haga clic sobre un bloque o una conexión para editar sus parámetros.
        `;
    return;
  }

  dom.propertiesContent.className = "";

  if (selection.kind === "node") {
    const node = getNode(selection.id);
    if (!node) {
      clearSelection();
      return;
    }
    renderNodeProperties(node);
    return;
  }

  if (selection.kind === "edge") {
    const edge = getEdge(selection.id);
    if (!edge) {
      clearSelection();
      return;
    }
    renderEdgeProperties(edge);
  }
}

function renderNodeProperties(node) {
  const config = NODE_TYPES[node.type];
  dom.selectionType.textContent = config.label;

  let fields = `
        <div class="field">
          <label for="propName">Nombre</label>
          <input id="propName" type="text" value="${escapeHtml(node.name)}" maxlength="60">
        </div>
        <div class="field">
          <label for="propColor">Color del bloque</label>
          <input id="propColor" type="color" value="${safeColor(node.props.color, "#3a8bfd")}" style="height:40px;padding:4px;cursor:pointer;">
        </div>
      `;

  if (node.type === "source") {
    fields += `
          <div class="field-row">
            <div class="field">
              <label for="propInterval">Intervalo de llegada (min)</label>
              <input id="propInterval" type="number" min="0.1" step="0.1" value="${Number(node.props.interval) || 4}">
            </div>
            <div class="field">
              <label for="propStartAt">Inicio desde apertura (min)</label>
              <input id="propStartAt" type="number" min="0" step="0.1" value="${Number(node.props.startAt) || 0}">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="propMaxEntities">Máximo personas (0 = ilimitado)</label>
              <input id="propMaxEntities" type="number" min="0" step="1" value="${Number(node.props.maxEntities) || 0}">
            </div>
            <div class="field">
              <label for="propPersonType">Tipo de persona</label>
              <input id="propPersonType" type="text" value="${escapeHtml(node.props.personType || "Ciudadano")}">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="propTransactionMode">Asignación del trámite</label>
              <select id="propTransactionMode">
                <option value="mixed" ${(node.props.transactionMode || "mixed") === "mixed" ? "selected" : ""}>Mezcla por probabilidad</option>
                <option value="fixed" ${node.props.transactionMode === "fixed" ? "selected" : ""}>Un trámite fijo</option>
              </select>
            </div>
            <div class="field">
              <label for="propTransactionType">Trámite fijo</label>
              <select id="propTransactionType">${transactionOptions(node.props.transactionType || "credit")}</select>
            </div>
          </div>
          <div class="field">
            <label for="propAmountMode">Monto de la transacción en USD</label>
            <select id="propAmountMode">
              <option value="automatic" ${(node.props.amountMode || "automatic") === "automatic" ? "selected" : ""}>Automático según el trámite</option>
              <option value="random" ${node.props.amountMode === "random" ? "selected" : ""}>Rango personalizado</option>
              <option value="fixed" ${node.props.amountMode === "fixed" ? "selected" : ""}>Monto fijo</option>
            </select>
          </div>
          ${
            node.props.amountMode === "fixed"
              ? `
            <div class="field">
              <label for="propAmountFixed">Monto fijo USD</label>
              <input id="propAmountFixed" type="number" min="0" step="0.01" value="${Number(node.props.amountFixed) || 0}">
            </div>
          `
              : node.props.amountMode === "random"
                ? `
            <div class="field-row">
              <div class="field">
                <label for="propAmountMin">Monto mínimo USD</label>
                <input id="propAmountMin" type="number" min="0" step="0.01" value="${Number(node.props.amountMin) || 0}">
              </div>
              <div class="field">
                <label for="propAmountMax">Monto máximo USD</label>
                <input id="propAmountMax" type="number" min="0" step="0.01" value="${Number(node.props.amountMax) || 0}">
              </div>
            </div>
          `
                : `
            <div class="field-help">
              Los montos automáticos mantienen una distribución concentrada en valores bajos, pero ahora usted puede modificar los límites mínimo y máximo de cada operación.
            </div>

            <details class="config-disclosure">
              <summary>Rangos automáticos de transacciones</summary>
              <div class="config-disclosure-body">
                <div class="field-row">
                  <div class="field"><label for="autoDepositMin">Depósito mínimo USD</label><input id="autoDepositMin" type="number" min="1" step="0.01" value="${Number(node.props.automaticAmountRanges?.deposit?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.deposit.min)}"></div>
                  <div class="field"><label for="autoDepositMax">Depósito máximo USD</label><input id="autoDepositMax" type="number" min="1" step="0.01" value="${Number(node.props.automaticAmountRanges?.deposit?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.deposit.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoWithdrawalMin">Retiro mínimo USD</label><input id="autoWithdrawalMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.withdrawal?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.withdrawal.min)}"></div>
                  <div class="field"><label for="autoWithdrawalMax">Retiro máximo USD</label><input id="autoWithdrawalMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.withdrawal?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.withdrawal.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoTransferMin">Transferencia mínima USD</label><input id="autoTransferMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.transfer?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.transfer.min)}"></div>
                  <div class="field"><label for="autoTransferMax">Transferencia máxima USD</label><input id="autoTransferMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.transfer?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.transfer.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoPaymentMin">Pago mínimo USD</label><input id="autoPaymentMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.payment?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.payment.min)}"></div>
                  <div class="field"><label for="autoPaymentMax">Pago máximo USD</label><input id="autoPaymentMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.payment?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.payment.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoAccountMin">Apertura mínima USD</label><input id="autoAccountMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.account?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.account.min)}"></div>
                  <div class="field"><label for="autoAccountMax">Apertura máxima USD</label><input id="autoAccountMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.account?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.account.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoCardMin">Tarjeta mínimo USD</label><input id="autoCardMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.card?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.card.min)}"></div>
                  <div class="field"><label for="autoCardMax">Tarjeta máximo USD</label><input id="autoCardMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.card?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.card.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoInsuranceMin">Seguro mínimo USD</label><input id="autoInsuranceMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.insurance?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.insurance.min)}"></div>
                  <div class="field"><label for="autoInsuranceMax">Seguro máximo USD</label><input id="autoInsuranceMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.insurance?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.insurance.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="autoInvestmentMin">Inversión mínima USD</label><input id="autoInvestmentMin" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.investment?.min ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.investment.min)}"></div>
                  <div class="field"><label for="autoInvestmentMax">Inversión máxima USD</label><input id="autoInvestmentMax" type="number" min="0" step="0.01" value="${Number(node.props.automaticAmountRanges?.investment?.max ?? DEFAULT_AUTOMATIC_AMOUNT_RANGES.investment.max)}"></div>
                </div>
                <button class="property-button" id="resetAutomaticRangesBtn" type="button" style="width:100%;">Restablecer montos normales</button>
              </div>
            </details>

            <details class="config-disclosure">
              <summary>Montos automáticos por tipo de crédito</summary>
              <div class="config-disclosure-body">
                <div class="field-row">
                  <div class="field"><label for="creditAmountHousingMin">Vivienda mínimo USD</label><input id="creditAmountHousingMin" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.housing?.min ?? DEFAULT_CREDIT_AMOUNT_RANGES.housing.min)}"></div>
                  <div class="field"><label for="creditAmountHousingMax">Vivienda máximo USD</label><input id="creditAmountHousingMax" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.housing?.max ?? DEFAULT_CREDIT_AMOUNT_RANGES.housing.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="creditAmountVehicleMin">Vehículo mínimo USD</label><input id="creditAmountVehicleMin" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.vehicle?.min ?? DEFAULT_CREDIT_AMOUNT_RANGES.vehicle.min)}"></div>
                  <div class="field"><label for="creditAmountVehicleMax">Vehículo máximo USD</label><input id="creditAmountVehicleMax" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.vehicle?.max ?? DEFAULT_CREDIT_AMOUNT_RANGES.vehicle.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="creditAmountConsumerMin">Consumo mínimo USD</label><input id="creditAmountConsumerMin" type="number" min="0" step="50" value="${Number(node.props.creditAmountRanges?.consumer?.min ?? DEFAULT_CREDIT_AMOUNT_RANGES.consumer.min)}"></div>
                  <div class="field"><label for="creditAmountConsumerMax">Consumo máximo USD</label><input id="creditAmountConsumerMax" type="number" min="0" step="50" value="${Number(node.props.creditAmountRanges?.consumer?.max ?? DEFAULT_CREDIT_AMOUNT_RANGES.consumer.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="creditAmountBusinessMin">Negocio mínimo USD</label><input id="creditAmountBusinessMin" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.business?.min ?? DEFAULT_CREDIT_AMOUNT_RANGES.business.min)}"></div>
                  <div class="field"><label for="creditAmountBusinessMax">Negocio máximo USD</label><input id="creditAmountBusinessMax" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.business?.max ?? DEFAULT_CREDIT_AMOUNT_RANGES.business.max)}"></div>
                </div>
                <div class="field-row">
                  <div class="field"><label for="creditAmountEducationMin">Educativo mínimo USD</label><input id="creditAmountEducationMin" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.education?.min ?? DEFAULT_CREDIT_AMOUNT_RANGES.education.min)}"></div>
                  <div class="field"><label for="creditAmountEducationMax">Educativo máximo USD</label><input id="creditAmountEducationMax" type="number" min="0" step="100" value="${Number(node.props.creditAmountRanges?.education?.max ?? DEFAULT_CREDIT_AMOUNT_RANGES.education.max)}"></div>
                </div>
                <button class="property-button" id="resetCreditAmountRangesBtn" type="button" style="width:100%;">Restablecer montos de crédito</button>
              </div>
            </details>
          `
          }
          ${
            (node.props.transactionMode || "mixed") === "mixed"
              ? `
            <div class="field">
              <label>Pesos de cada trámite</label>
              <div style="color:var(--muted);font-size:10px;line-height:1.5;margin-bottom:8px;">Los valores funcionan como pesos relativos y no necesitan sumar 100.</div>
            </div>
            <div class="field-row">
              <div class="field"><label for="weightCredit">Crédito</label><input id="weightCredit" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.credit ?? 7)}"></div>
              <div class="field"><label for="weightDeposit">Depósito</label><input id="weightDeposit" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.deposit ?? 28)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="weightWithdrawal">Retiro</label><input id="weightWithdrawal" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.withdrawal ?? 23)}"></div>
              <div class="field"><label for="weightTransfer">Transferencia</label><input id="weightTransfer" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.transfer ?? 10)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="weightPayment">Pago</label><input id="weightPayment" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.payment ?? 18)}"></div>
              <div class="field"><label for="weightInquiry">Consulta</label><input id="weightInquiry" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.inquiry ?? 8)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="weightAccount">Apertura cuenta</label><input id="weightAccount" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.account ?? 2)}"></div>
              <div class="field"><label for="weightCard">Tarjeta</label><input id="weightCard" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.card ?? 2)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="weightInsurance">Seguro</label><input id="weightInsurance" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.insurance ?? 1)}"></div>
              <div class="field"><label for="weightInvestment">Inversión</label><input id="weightInvestment" type="number" min="0" step="1" value="${Number(node.props.transactionWeights?.investment ?? 1)}"></div>
            </div>
            <div class="field"><label>Tipos de crédito</label><div class="field-help">Defina la frecuencia relativa de cada producto crediticio.</div></div>
            <div class="field-row">
              <div class="field"><label for="creditWeightHousing">Vivienda</label><input id="creditWeightHousing" type="number" min="0" step="1" value="${Number(node.props.creditTypeWeights?.housing ?? 18)}"></div>
              <div class="field"><label for="creditWeightVehicle">Vehículo</label><input id="creditWeightVehicle" type="number" min="0" step="1" value="${Number(node.props.creditTypeWeights?.vehicle ?? 22)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="creditWeightConsumer">Consumo</label><input id="creditWeightConsumer" type="number" min="0" step="1" value="${Number(node.props.creditTypeWeights?.consumer ?? 35)}"></div>
              <div class="field"><label for="creditWeightBusiness">Negocio</label><input id="creditWeightBusiness" type="number" min="0" step="1" value="${Number(node.props.creditTypeWeights?.business ?? 15)}"></div>
            </div>
            <div class="field"><label for="creditWeightEducation">Educativo</label><input id="creditWeightEducation" type="number" min="0" step="1" value="${Number(node.props.creditTypeWeights?.education ?? 10)}"></div>
          `
              : ""
          }
        `;
  }

  if (node.type === "queue") {
    fields += `
          <div class="field-row">
            <div class="field">
              <label for="propCapacity">Capacidad cola</label>
              <input id="propCapacity" type="number" min="1" step="1" value="${Number(node.props.capacity) || 999}">
            </div>
            <div class="field">
              <label for="propDepartment">Área o departamento</label>
              <input id="propDepartment" type="text" value="${escapeHtml(node.props.department || "General")}">
            </div>
          </div>
          <div class="field">
            <label for="propProcedure">Descripción de la espera</label>
            <input id="propProcedure" type="text" value="${escapeHtml(node.props.procedure || "Espera de atención")}">
          </div>
          <div class="field"><label for="propTargetWait">Tiempo objetivo para ser atendido (min)</label><input id="propTargetWait" type="number" min="0" step="1" value="${Number(node.props.targetWaitMinutes ?? 5)}"></div>
          <div class="field-row">
            <div class="field"><label for="propAngerAfter">Se molesta después de (min)</label><input id="propAngerAfter" type="number" min="1" step="1" value="${Number(node.props.angerAfterMinutes ?? 12)}"></div>
            <div class="field"><label for="propAbandonAfter">Puede abandonar después de (min)</label><input id="propAbandonAfter" type="number" min="1" step="1" value="${Number(node.props.abandonAfterMinutes ?? 30)}"></div>
          </div>
          <div class="field"><label for="propAbandonProbability">Probabilidad de abandonar (%)</label><input id="propAbandonProbability" type="number" min="0" max="100" step="1" value="${Number(node.props.abandonProbability ?? 30)}"></div>
        `;
  }

  if (node.type === "process") {
    fields += `
          <div class="field-row">
            <div class="field">
              <label for="propDepartment">Departamento</label>
              <input id="propDepartment" type="text" value="${escapeHtml(node.props.department || "Atención al cliente")}">
            </div>
            <div class="field">
              <label for="propCapacity">Personal</label>
              <input id="propCapacity" type="number" min="1" step="1" value="${Number(node.props.capacity) || 1}">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="propServiceTime">Tiempo de atención (min)</label>
              <input id="propServiceTime" type="number" min="0.1" step="0.1" value="${Number(node.props.serviceTime) || 6}">
            </div>
            <div class="field">
              <label for="propProcedure">Trámite</label>
              <input id="propProcedure" type="text" value="${escapeHtml(node.props.procedure || "Recepción de trámite")}">
            </div>
          </div>
          <div class="field">
            <label for="propProcessRole">Función del área</label>
            <select id="propProcessRole">
              <option value="standard" ${(node.props.processRole || "standard") === "standard" ? "selected" : ""}>Atención general</option>
              <option value="transaction_processing" ${node.props.processRole === "transaction_processing" ? "selected" : ""}>Procesamiento de transacciones</option>
              <option value="credit_evaluation" ${node.props.processRole === "credit_evaluation" ? "selected" : ""}>Evaluación de crédito</option>
              <option value="banking_services" ${node.props.processRole === "banking_services" ? "selected" : ""}>Servicios bancarios</option>
              <option value="vault" ${node.props.processRole === "vault" ? "selected" : ""}>Bóveda y tesorería</option>
              <option value="collections" ${node.props.processRole === "collections" ? "selected" : ""}>Cobranza y recuperación</option>
              <option value="digital" ${node.props.processRole === "digital" ? "selected" : ""}>Canal digital</option>
              <option value="compliance" ${node.props.processRole === "compliance" ? "selected" : ""}>Cumplimiento y revisión</option>
            </select>
          </div>
          ${
            node.props.processRole === "credit_evaluation"
              ? `
            <div class="field-row">
              <div class="field">
                <label for="propCreditApprovalRate">Aprobación base (%)</label>
                <input id="propCreditApprovalRate" type="number" min="0" max="100" step="1" value="${Number(node.props.creditApprovalRate ?? 75)}">
              </div>
              <div class="field">
                <label for="propCreditMinIncome">Ingreso mínimo USD</label>
                <input id="propCreditMinIncome" type="number" min="0" step="10" value="${Number(node.props.creditMinIncome ?? 600)}">
              </div>
            </div>
            <div class="field-row">
              <div class="field">
                <label for="propCreditMaxDebtRatio">Deuda máxima / ingreso (%)</label>
                <input id="propCreditMaxDebtRatio" type="number" min="0" max="100" step="1" value="${Number(node.props.creditMaxDebtRatio ?? 40)}">
              </div>
              <div class="field">
                <label for="propCreditMinEmploymentMonths">Antigüedad mínima (meses)</label>
                <input id="propCreditMinEmploymentMonths" type="number" min="0" step="1" value="${Number(node.props.creditMinEmploymentMonths ?? 6)}">
              </div>
            </div>
            <div class="field">
              <label for="propCreditMaxIncomeMultiple">Monto máximo / ingreso mensual (veces)</label>
              <input id="propCreditMaxIncomeMultiple" type="number" min="1" step="1" value="${Number(node.props.creditMaxIncomeMultiple ?? 12)}">
            </div>
            <div class="field-help">Las tasas y plazos son editables por producto. El crédito puede aprobarse o rechazarse y se registra la causa.</div>
            <div class="field-row">
              <div class="field"><label for="rateHousing">Tasa vivienda (%)</label><input id="rateHousing" type="number" min="0" max="100" step="0.1" value="${Number(node.props.creditRates?.housing ?? 9.5)}"></div>
              <div class="field"><label for="termHousing">Plazo vivienda (meses)</label><input id="termHousing" type="number" min="1" max="360" step="1" value="${Number(node.props.creditTerms?.housing ?? 180)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="rateVehicle">Tasa vehículo (%)</label><input id="rateVehicle" type="number" min="0" max="100" step="0.1" value="${Number(node.props.creditRates?.vehicle ?? 13.5)}"></div>
              <div class="field"><label for="termVehicle">Plazo vehículo (meses)</label><input id="termVehicle" type="number" min="1" max="360" step="1" value="${Number(node.props.creditTerms?.vehicle ?? 60)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="rateConsumer">Tasa consumo (%)</label><input id="rateConsumer" type="number" min="0" max="100" step="0.1" value="${Number(node.props.creditRates?.consumer ?? 16.5)}"></div>
              <div class="field"><label for="termConsumer">Plazo consumo (meses)</label><input id="termConsumer" type="number" min="1" max="360" step="1" value="${Number(node.props.creditTerms?.consumer ?? 36)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="rateBusiness">Tasa negocio (%)</label><input id="rateBusiness" type="number" min="0" max="100" step="0.1" value="${Number(node.props.creditRates?.business ?? 15)}"></div>
              <div class="field"><label for="termBusiness">Plazo negocio (meses)</label><input id="termBusiness" type="number" min="1" max="360" step="1" value="${Number(node.props.creditTerms?.business ?? 48)}"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="rateEducation">Tasa educativo (%)</label><input id="rateEducation" type="number" min="0" max="100" step="0.1" value="${Number(node.props.creditRates?.education ?? 11.5)}"></div>
              <div class="field"><label for="termEducation">Plazo educativo (meses)</label><input id="termEducation" type="number" min="1" max="360" step="1" value="${Number(node.props.creditTerms?.education ?? 60)}"></div>
            </div>
            <div style="margin:-4px 0 13px;padding:9px 10px;border:1px solid var(--line);border-radius:9px;background:#f5f8fc;color:var(--muted);font-size:9px;line-height:1.5;">
              Se registra si el crédito fue aprobado o rechazado y la razón: documentación incompleta, historial negativo, ingreso insuficiente, endeudamiento alto, poca antigüedad laboral o monto solicitado elevado.
            </div>
          `
              : ""
          }
          <div class="field-row">
            <div class="field"><label for="propShiftStart">Inicio de turno</label><input id="propShiftStart" type="time" min="08:00" max="19:00" step="1800" value="${escapeHtml(node.props.shiftStart || "08:00")}"></div>
            <div class="field"><label for="propShiftEnd">Fin de turno</label><input id="propShiftEnd" type="time" min="08:00" max="19:00" step="1800" value="${escapeHtml(node.props.shiftEnd || "19:00")}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="propLunchStart">Inicio de almuerzo</label><input id="propLunchStart" type="time" min="08:00" max="19:00" step="1800" value="${escapeHtml(node.props.lunchStart || "13:00")}"></div>
            <div class="field"><label for="propLunchMinutes">Almuerzo (min)</label><input id="propLunchMinutes" type="number" min="0" max="180" step="5" value="${Number(node.props.lunchMinutes ?? 60)}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label for="propStaffCost">Costo por funcionario/hora USD</label><input id="propStaffCost" type="number" min="0" step="0.1" value="${Number(node.props.staffCostPerHour ?? 5)}"></div>
            <div class="field"><label for="propCashMinimum">Efectivo mínimo USD</label><input id="propCashMinimum" type="number" min="0" step="100" value="${Number(node.props.cashMinimum ?? 5000)}"></div>
          </div>
          <div class="field"><label for="propCashMaximum">Efectivo máximo antes de enviar a bóveda USD</label><input id="propCashMaximum" type="number" min="0" step="100" value="${Number(node.props.cashMaximum ?? 50000)}"></div>
          <div class="field"><label for="propTargetWait">Tiempo objetivo para iniciar atención (min)</label><input id="propTargetWait" type="number" min="0" step="1" value="${Number(node.props.targetWaitMinutes ?? 5)}"></div>
          <div class="field-row">
            <div class="field"><label for="propAngerAfter">Demora para molestarse (min)</label><input id="propAngerAfter" type="number" min="1" step="1" value="${Number(node.props.angerAfterMinutes ?? 12)}"></div>
            <div class="field"><label for="propAbandonAfter">Demora para abandonar (min)</label><input id="propAbandonAfter" type="number" min="1" step="1" value="${Number(node.props.abandonAfterMinutes ?? 35)}"></div>
          </div>
          <div class="field"><label for="propAbandonProbability">Probabilidad de abandono (%)</label><input id="propAbandonProbability" type="number" min="0" max="100" step="1" value="${Number(node.props.abandonProbability ?? 25)}"></div>
          <div class="field">
            <label for="propObservations">Observaciones</label>
            <textarea id="propObservations">${escapeHtml(node.props.observations || "")}</textarea>
          </div>
        `;
  }

  if (node.type === "decision") {
    fields += `
          <div class="field-row">
            <div class="field">
              <label for="propDepartment">Departamento</label>
              <input id="propDepartment" type="text" value="${escapeHtml(node.props.department || "Flujo")}">
            </div>
            <div class="field">
              <label for="propProcedure">Uso</label>
              <input id="propProcedure" type="text" value="${escapeHtml(node.props.procedure || "Asignación de ruta")}">
            </div>
          </div>
          <div class="field">
            <label for="propRoutingMode">Forma de derivación</label>
            <select id="propRoutingMode">
              <option value="transaction" ${(node.props.routingMode || "transaction") === "transaction" ? "selected" : ""}>Según tipo de trámite</option>
              <option value="probability" ${node.props.routingMode === "probability" ? "selected" : ""}>Según probabilidad</option>
            </select>
          </div>
          <div class="field">
            <label>Configuración de las rutas</label>
            <div style="color:var(--muted); font-size:10px; line-height:1.55;">
              Seleccione cada conexión saliente. En modo trámite podrá asignar crédito, depósito, retiro u otras operaciones a cada destino. En modo probabilidad podrá editar sus pesos.
            </div>
          </div>
        `;
  }

  if (node.type === "sink") {
    fields += `
          <div class="field-row">
            <div class="field">
              <label for="propDepartment">Departamento</label>
              <input id="propDepartment" type="text" value="${escapeHtml(node.props.department || "Cierre")}">
            </div>
            <div class="field">
              <label for="propFinalStatus">Estado final</label>
              <input id="propFinalStatus" type="text" value="${escapeHtml(node.props.finalStatus || "Completado")}">
            </div>
          </div>
          <div class="field">
            <label for="propProcedure">Descripción</label>
            <input id="propProcedure" type="text" value="${escapeHtml(node.props.procedure || "Cierre de trámite")}">
          </div>
        `;
  }

  fields += `
        <div class="property-actions">
          <button class="property-button" id="duplicateNodeBtn">Duplicar</button>
          <button class="property-button danger" id="deletePropertyBtn">Eliminar</button>
        </div>
      `;

  dom.propertiesContent.innerHTML = fields;

  document.getElementById("propName")?.addEventListener("input", (event) => {
    node.name = event.target.value || config.defaultName;
    renderNodes();
  });

  document.getElementById("propColor")?.addEventListener("input", (event) => {
    node.props.color = safeColor(event.target.value, "#3a8bfd");
    renderNodes();
  });

  if (node.type === "source") {
    bindNumericInput(
      "propInterval",
      (value) => (node.props.interval = Math.max(0.1, value)),
    );
    bindNumericInput(
      "propStartAt",
      (value) => (node.props.startAt = Math.max(0, value)),
    );
    bindNumericInput(
      "propMaxEntities",
      (value) => (node.props.maxEntities = Math.max(0, Math.floor(value))),
    );
    bindTextInput(
      "propPersonType",
      (value) => (node.props.personType = value || "Ciudadano"),
    );
    document
      .getElementById("propTransactionMode")
      ?.addEventListener("change", (event) => {
        node.props.transactionMode =
          event.target.value === "fixed" ? "fixed" : "mixed";
        renderNodes();
        renderProperties();
      });
    document
      .getElementById("propTransactionType")
      ?.addEventListener("change", (event) => {
        node.props.transactionType = TRANSACTION_TYPES[event.target.value]
          ? event.target.value
          : "credit";
        renderNodes();
      });
    document
      .getElementById("propAmountMode")
      ?.addEventListener("change", (event) => {
        node.props.amountMode = ["automatic", "random", "fixed"].includes(
          event.target.value,
        )
          ? event.target.value
          : "automatic";
        renderNodes();
        renderProperties();
      });
    bindNumericInput(
      "propAmountFixed",
      (value) => (node.props.amountFixed = Math.max(0, value)),
    );
    bindNumericInput("propAmountMin", (value) => {
      node.props.amountMin = Math.max(0, value);
      if ((Number(node.props.amountMax) || 0) < node.props.amountMin)
        node.props.amountMax = node.props.amountMin;
    });
    bindNumericInput(
      "propAmountMax",
      (value) =>
        (node.props.amountMax = Math.max(
          Number(node.props.amountMin) || 0,
          value,
        )),
    );

    ensureSourceAmountRanges(node);
    bindRangePair(node, "autoDeposit", "automaticAmountRanges", "deposit", 1);
    bindRangePair(
      node,
      "autoWithdrawal",
      "automaticAmountRanges",
      "withdrawal",
      0,
    );
    bindRangePair(node, "autoTransfer", "automaticAmountRanges", "transfer", 0);
    bindRangePair(node, "autoPayment", "automaticAmountRanges", "payment", 0);
    bindRangePair(node, "autoAccount", "automaticAmountRanges", "account", 0);
    bindRangePair(node, "autoCard", "automaticAmountRanges", "card", 0);
    bindRangePair(
      node,
      "autoInsurance",
      "automaticAmountRanges",
      "insurance",
      0,
    );
    bindRangePair(
      node,
      "autoInvestment",
      "automaticAmountRanges",
      "investment",
      0,
    );

    bindRangePair(
      node,
      "creditAmountHousing",
      "creditAmountRanges",
      "housing",
      0,
    );
    bindRangePair(
      node,
      "creditAmountVehicle",
      "creditAmountRanges",
      "vehicle",
      0,
    );
    bindRangePair(
      node,
      "creditAmountConsumer",
      "creditAmountRanges",
      "consumer",
      0,
    );
    bindRangePair(
      node,
      "creditAmountBusiness",
      "creditAmountRanges",
      "business",
      0,
    );
    bindRangePair(
      node,
      "creditAmountEducation",
      "creditAmountRanges",
      "education",
      0,
    );

    document
      .getElementById("resetAutomaticRangesBtn")
      ?.addEventListener("click", () => {
        node.props.automaticAmountRanges = clone(
          DEFAULT_AUTOMATIC_AMOUNT_RANGES,
        );
        renderNodes();
        renderProperties();
        showToast("Montos automáticos restablecidos al escenario normal.");
      });

    document
      .getElementById("resetCreditAmountRangesBtn")
      ?.addEventListener("click", () => {
        node.props.creditAmountRanges = clone(DEFAULT_CREDIT_AMOUNT_RANGES);
        renderNodes();
        renderProperties();
        showToast("Montos de crédito restablecidos.");
      });

    node.props.transactionWeights = {
      ...NODE_TYPES.source.props.transactionWeights,
      ...(node.props.transactionWeights || {}),
    };
    bindNumericInput(
      "weightCredit",
      (value) => (node.props.transactionWeights.credit = Math.max(0, value)),
    );
    bindNumericInput(
      "weightDeposit",
      (value) => (node.props.transactionWeights.deposit = Math.max(0, value)),
    );
    bindNumericInput(
      "weightWithdrawal",
      (value) =>
        (node.props.transactionWeights.withdrawal = Math.max(0, value)),
    );
    bindNumericInput(
      "weightTransfer",
      (value) => (node.props.transactionWeights.transfer = Math.max(0, value)),
    );
    bindNumericInput(
      "weightPayment",
      (value) => (node.props.transactionWeights.payment = Math.max(0, value)),
    );
    bindNumericInput(
      "weightInquiry",
      (value) => (node.props.transactionWeights.inquiry = Math.max(0, value)),
    );
    bindNumericInput(
      "weightAccount",
      (value) => (node.props.transactionWeights.account = Math.max(0, value)),
    );
    bindNumericInput(
      "weightCard",
      (value) => (node.props.transactionWeights.card = Math.max(0, value)),
    );
    bindNumericInput(
      "weightInsurance",
      (value) => (node.props.transactionWeights.insurance = Math.max(0, value)),
    );
    bindNumericInput(
      "weightInvestment",
      (value) =>
        (node.props.transactionWeights.investment = Math.max(0, value)),
    );
    node.props.creditTypeWeights = {
      ...NODE_TYPES.source.props.creditTypeWeights,
      ...(node.props.creditTypeWeights || {}),
    };
    bindNumericInput(
      "creditWeightHousing",
      (value) => (node.props.creditTypeWeights.housing = Math.max(0, value)),
    );
    bindNumericInput(
      "creditWeightVehicle",
      (value) => (node.props.creditTypeWeights.vehicle = Math.max(0, value)),
    );
    bindNumericInput(
      "creditWeightConsumer",
      (value) => (node.props.creditTypeWeights.consumer = Math.max(0, value)),
    );
    bindNumericInput(
      "creditWeightBusiness",
      (value) => (node.props.creditTypeWeights.business = Math.max(0, value)),
    );
    bindNumericInput(
      "creditWeightEducation",
      (value) => (node.props.creditTypeWeights.education = Math.max(0, value)),
    );
  }

  if (node.type === "queue") {
    bindNumericInput(
      "propCapacity",
      (value) => (node.props.capacity = Math.max(1, Math.floor(value))),
    );
    bindTextInput(
      "propDepartment",
      (value) => (node.props.department = value || "General"),
    );
    bindTextInput(
      "propProcedure",
      (value) => (node.props.procedure = value || "Espera de atención"),
    );
    bindNumericInput(
      "propTargetWait",
      (value) => (node.props.targetWaitMinutes = Math.max(0, value)),
    );
    bindNumericInput(
      "propAngerAfter",
      (value) => (node.props.angerAfterMinutes = Math.max(1, value)),
    );
    bindNumericInput(
      "propAbandonAfter",
      (value) => (node.props.abandonAfterMinutes = Math.max(1, value)),
    );
    bindNumericInput(
      "propAbandonProbability",
      (value) => (node.props.abandonProbability = clamp(value, 0, 100)),
    );
  }

  if (node.type === "process") {
    bindTextInput(
      "propDepartment",
      (value) => (node.props.department = value || "Atención al cliente"),
    );
    bindNumericInput(
      "propCapacity",
      (value) => (node.props.capacity = Math.max(1, Math.floor(value))),
    );
    bindNumericInput(
      "propServiceTime",
      (value) => (node.props.serviceTime = Math.max(0.1, value)),
    );
    bindTextInput(
      "propProcedure",
      (value) => (node.props.procedure = value || "Recepción de trámite"),
    );
    document
      .getElementById("propProcessRole")
      ?.addEventListener("change", (event) => {
        node.props.processRole = [
          "credit_evaluation",
          "transaction_processing",
          "banking_services",
          "vault",
          "collections",
          "digital",
          "compliance",
        ].includes(event.target.value)
          ? event.target.value
          : "standard";
        renderProperties();
        renderNodes();
      });
    bindNumericInput(
      "propCreditApprovalRate",
      (value) => (node.props.creditApprovalRate = clamp(value, 0, 100)),
    );
    bindNumericInput(
      "propCreditMinIncome",
      (value) => (node.props.creditMinIncome = Math.max(0, value)),
    );
    bindNumericInput(
      "propCreditMaxDebtRatio",
      (value) => (node.props.creditMaxDebtRatio = clamp(value, 0, 100)),
    );
    bindNumericInput(
      "propCreditMinEmploymentMonths",
      (value) =>
        (node.props.creditMinEmploymentMonths = Math.max(0, Math.floor(value))),
    );
    bindNumericInput(
      "propCreditMaxIncomeMultiple",
      (value) => (node.props.creditMaxIncomeMultiple = Math.max(1, value)),
    );
    bindNumericInput(
      "propCreditAnnualInterestRate",
      (value) => (node.props.creditAnnualInterestRate = clamp(value, 0, 100)),
    );
    bindNumericInput(
      "propCreditTermMonths",
      (value) =>
        (node.props.creditTermMonths = clamp(Math.floor(value), 1, 360)),
    );
    node.props.creditRates = {
      ...NODE_TYPES.process.props.creditRates,
      ...(node.props.creditRates || {}),
    };
    node.props.creditTerms = {
      ...NODE_TYPES.process.props.creditTerms,
      ...(node.props.creditTerms || {}),
    };
    ["housing", "vehicle", "consumer", "business", "education"].forEach(
      (type) => {
        const cap = type.charAt(0).toUpperCase() + type.slice(1);
        bindNumericInput(
          "rate" + cap,
          (value) => (node.props.creditRates[type] = clamp(value, 0, 100)),
        );
        bindNumericInput(
          "term" + cap,
          (value) =>
            (node.props.creditTerms[type] = clamp(Math.floor(value), 1, 360)),
        );
      },
    );
    bindTextInput(
      "propShiftStart",
      (value) => (node.props.shiftStart = value || "08:00"),
    );
    bindTextInput(
      "propShiftEnd",
      (value) => (node.props.shiftEnd = value || "19:00"),
    );
    bindTextInput(
      "propLunchStart",
      (value) => (node.props.lunchStart = value || "13:00"),
    );
    bindNumericInput(
      "propLunchMinutes",
      (value) => (node.props.lunchMinutes = clamp(value, 0, 180)),
    );
    bindNumericInput(
      "propStaffCost",
      (value) => (node.props.staffCostPerHour = Math.max(0, value)),
    );
    bindNumericInput(
      "propCashMinimum",
      (value) => (node.props.cashMinimum = Math.max(0, value)),
    );
    bindNumericInput(
      "propCashMaximum",
      (value) =>
        (node.props.cashMaximum = Math.max(
          Number(node.props.cashMinimum) || 0,
          value,
        )),
    );
    bindNumericInput(
      "propTargetWait",
      (value) => (node.props.targetWaitMinutes = Math.max(0, value)),
    );
    bindNumericInput(
      "propAngerAfter",
      (value) => (node.props.angerAfterMinutes = Math.max(1, value)),
    );
    bindNumericInput(
      "propAbandonAfter",
      (value) => (node.props.abandonAfterMinutes = Math.max(1, value)),
    );
    bindNumericInput(
      "propAbandonProbability",
      (value) => (node.props.abandonProbability = clamp(value, 0, 100)),
    );
    bindTextArea(
      "propObservations",
      (value) => (node.props.observations = value),
    );
  }

  if (node.type === "decision") {
    bindTextInput(
      "propDepartment",
      (value) => (node.props.department = value || "Flujo"),
    );
    bindTextInput(
      "propProcedure",
      (value) => (node.props.procedure = value || "Asignación de ruta"),
    );
    document
      .getElementById("propRoutingMode")
      ?.addEventListener("change", (event) => {
        node.props.routingMode =
          event.target.value === "probability" ? "probability" : "transaction";
        renderNodes();
        renderEdges();
        renderProperties();
      });
  }

  if (node.type === "sink") {
    bindTextInput(
      "propDepartment",
      (value) => (node.props.department = value || "Cierre"),
    );
    bindTextInput(
      "propFinalStatus",
      (value) => (node.props.finalStatus = value || "Completado"),
    );
    bindTextInput(
      "propProcedure",
      (value) => (node.props.procedure = value || "Cierre de trámite"),
    );
  }

  document.getElementById("duplicateNodeBtn")?.addEventListener("click", () => {
    createNode(node.type, node.x + 34, node.y + 34, {
      name: node.name + " copia",
      props: clone(node.props),
    });
  });
  document
    .getElementById("deletePropertyBtn")
    ?.addEventListener("click", deleteSelected);
}

function renderEdgeProperties(edge) {
  const fromNode = getNode(edge.from);
  const toNode = getNode(edge.to);
  dom.selectionType.textContent = "Conexión";
  const isDecision = fromNode && fromNode.type === "decision";
  const routingMode = fromNode?.props?.routingMode || "probability";
  const selectedTypes = new Set(
    Array.isArray(edge.transactionTypes) ? edge.transactionTypes : [],
  );
  const transactionChecks = Object.entries(TRANSACTION_TYPES)
    .map(
      ([type, item]) => `
        <label style="display:flex;align-items:center;gap:8px;min-height:34px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.04);color:var(--text);font-size:10px;text-transform:none;letter-spacing:0;">
          <input class="edge-transaction-check" type="checkbox" value="${type}" ${selectedTypes.has(type) ? "checked" : ""} style="width:15px;height:15px;min-height:0;padding:0;">
          <span>${item.code} · ${item.label}</span>
        </label>
      `,
    )
    .join("");
  const isCreditEvaluation =
    fromNode?.type === "process" &&
    fromNode?.props?.processRole === "credit_evaluation";
  const selectedCreditOutcomes = new Set(
    Array.isArray(edge.creditOutcomes) ? edge.creditOutcomes : [],
  );
  const creditOutcomeChecks = [
    ["approved", "Crédito aprobado"],
    ["rejected", "Crédito rechazado"],
  ]
    .map(
      ([value, label]) => `
        <label style="display:flex;align-items:center;gap:8px;min-height:34px;padding:7px 9px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.04);color:var(--text);font-size:10px;text-transform:none;letter-spacing:0;">
          <input class="edge-credit-outcome-check" type="checkbox" value="${value}" ${selectedCreditOutcomes.has(value) ? "checked" : ""} style="width:15px;height:15px;min-height:0;padding:0;">
          <span>${label}</span>
        </label>
      `,
    )
    .join("");

  dom.propertiesContent.innerHTML = `
        <div class="field">
          <label>Origen</label>
          <input type="text" value="${escapeHtml(fromNode?.name || "No disponible")}" disabled>
        </div>
        <div class="field">
          <label>Destino</label>
          <input type="text" value="${escapeHtml(toNode?.name || "No disponible")}" disabled>
        </div>
        ${
          isDecision && routingMode === "probability"
            ? `
          <div class="field">
            <label for="propWeight">Peso probabilístico</label>
            <input id="propWeight" type="number" min="0" step="0.1" value="${Number(edge.weight) || 0}">
          </div>
          <div style="color:var(--muted);font-size:10px;line-height:1.5;">Los pesos se normalizan automáticamente entre todas las salidas del bloque.</div>
        `
            : isDecision && routingMode === "transaction"
              ? `
          <div class="field">
            <label>Trámites enviados por esta ruta</label>
            <div style="display:grid;gap:7px;">${transactionChecks}</div>
          </div>
          <div style="color:var(--muted);font-size:10px;line-height:1.5;">Si no selecciona ningún trámite, esta conexión funcionará como ruta para los casos restantes.</div>
        `
              : `
          <div class="field">
            <label>Ruta</label>
            <div style="padding:10px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.055);font-size:10px;color:var(--muted);line-height:1.55;">
              Esta conexión traslada personas desde un bloque al siguiente.
            </div>
          </div>
        `
        }
        ${
          isCreditEvaluation
            ? `
          <div class="field">
            <label>Resultado de crédito para esta ruta</label>
            <div style="display:grid;gap:7px;">${creditOutcomeChecks}</div>
          </div>
        `
            : ""
        }
        <div class="property-actions" style="grid-template-columns:1fr;">
          <button class="property-button danger" id="deletePropertyBtn">Eliminar conexión</button>
        </div>
      `;

  if (isDecision && routingMode === "probability") {
    bindNumericInput("propWeight", (value) => {
      edge.weight = Math.max(0, value);
      renderEdges();
    });
  }

  if (isDecision && routingMode === "transaction") {
    dom.propertiesContent
      .querySelectorAll(".edge-transaction-check")
      .forEach((input) => {
        input.addEventListener("change", () => {
          edge.transactionTypes = Array.from(
            dom.propertiesContent.querySelectorAll(
              ".edge-transaction-check:checked",
            ),
          )
            .map((item) => item.value)
            .filter((type) => TRANSACTION_TYPES[type]);
          renderEdges();
        });
      });
  }

  if (isCreditEvaluation) {
    dom.propertiesContent
      .querySelectorAll(".edge-credit-outcome-check")
      .forEach((input) => {
        input.addEventListener("change", () => {
          edge.creditOutcomes = Array.from(
            dom.propertiesContent.querySelectorAll(
              ".edge-credit-outcome-check:checked",
            ),
          )
            .map((item) => item.value)
            .filter((value) => value === "approved" || value === "rejected");
        });
      });
  }
  document
    .getElementById("deletePropertyBtn")
    ?.addEventListener("click", deleteSelected);
}

function ensureSourceAmountRanges(node) {
  sanitizeSourceAmountConfiguration(node);
}

function bindRangePair(node, prefix, collectionName, type, minimumAllowed = 0) {
  const minId = prefix + "Min";
  const maxId = prefix + "Max";
  const limit = rangeLimit(collectionName, type);
  const effectiveMinimum = Math.max(minimumAllowed, limit.min);
  bindNumericInput(minId, (value) => {
    const range = node.props[collectionName][type];
    range.min = roundUsd(clamp(value, effectiveMinimum, limit.max));
    if ((Number(range.max) || 0) < range.min) range.max = range.min;
    range.max = roundUsd(clamp(range.max, range.min, limit.max));
  });
  bindNumericInput(maxId, (value) => {
    const range = node.props[collectionName][type];
    range.max = roundUsd(
      clamp(value, Number(range.min) || effectiveMinimum, limit.max),
    );
  });
}

function bindNumericInput(id, callback) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) {
      callback(value);
      renderNodes();
      updateMetrics();
    }
  });
}

function bindTextInput(id, callback) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", (event) => {
    callback(event.target.value);
    renderNodes();
  });
}

function bindTextArea(id, callback) {
  const input = document.getElementById(id);
  if (!input) return;
  input.addEventListener("input", (event) => callback(event.target.value));
}

function deleteSelected() {
  if (!state.selected) {
    showToast("No hay ningún elemento seleccionado.", "warning");
    return;
  }
  stopSimulation(false, false);

  if (state.selected.kind === "node") {
    const nodeId = state.selected.id;
    state.nodes = state.nodes.filter((node) => node.id !== nodeId);
    state.edges = state.edges.filter(
      (edge) => edge.from !== nodeId && edge.to !== nodeId,
    );
    state.nodeRuntime.delete(nodeId);
    state.sourceSchedule.delete(nodeId);
  } else {
    state.edges = state.edges.filter((edge) => edge.id !== state.selected.id);
  }

  state.selected = null;
  renderAll();
  showToast("Elemento eliminado.");
}

function beginNodeDrag(event, nodeId) {
  if (event.button !== 0) return;
  if (event.target.closest(".mini-step")) return;

  const node = getNode(nodeId);
  if (!node) return;

  const point = clientToCanvas(event.clientX, event.clientY);
  state.draggingNode = nodeId;
  state.dragOffset.x = point.x - node.x;
  state.dragOffset.y = point.y - node.y;
  state.dragStart.x = event.clientX;
  state.dragStart.y = event.clientY;
  state.dragMoved = false;
  state.dragPointerId = event.pointerId;

  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.stopPropagation();
  event.preventDefault();
}

document.addEventListener(
  "pointermove",
  (event) => {
    if (!state.draggingNode || state.dragPointerId !== event.pointerId) return;

    const distance = Math.hypot(
      event.clientX - state.dragStart.x,
      event.clientY - state.dragStart.y,
    );

    if (!state.dragMoved && distance < 5) return;
    state.dragMoved = true;

    if (state.connectionMode) return;

    const node = getNode(state.draggingNode);
    if (!node) {
      state.draggingNode = null;
      return;
    }

    const point = clientToCanvas(event.clientX, event.clientY);
    node.x = clamp(point.x - state.dragOffset.x, 0, 2400 - 188);
    node.y = clamp(point.y - state.dragOffset.y, 0, 1400 - 108);

    const element = dom.nodesLayer.querySelector(`[data-node-id="${node.id}"]`);
    if (element) {
      element.style.left = node.x + "px";
      element.style.top = node.y + "px";
      element.style.cursor = "grabbing";
    }

    renderEdges();
    event.preventDefault();
  },
  { passive: false },
);

document.addEventListener("pointerup", (event) => {
  if (!state.draggingNode || state.dragPointerId !== event.pointerId) return;

  const nodeId = state.draggingNode;
  const moved = state.dragMoved;

  state.draggingNode = null;
  state.dragPointerId = null;
  state.dragMoved = false;

  if (state.connectionMode) {
    if (!moved) handleNodeClick(nodeId);
    return;
  }

  selectElement("node", nodeId);
  updateStatus(
    moved
      ? "Bloque movido y seleccionado. Edite sus características en el panel derecho."
      : "Bloque seleccionado. Edite sus características en el panel derecho.",
  );
});

document.addEventListener("pointercancel", () => {
  state.draggingNode = null;
  state.dragPointerId = null;
  state.dragMoved = false;
});

function clientToCanvas(clientX, clientY) {
  if (typeof dom.canvas.getBoxQuads === "function") {
    const quad = dom.canvas.getBoxQuads()[0];
    if (quad) {
      const horizontal = { x: quad.p2.x - quad.p1.x, y: quad.p2.y - quad.p1.y };
      const vertical = { x: quad.p4.x - quad.p1.x, y: quad.p4.y - quad.p1.y };
      const point = { x: clientX - quad.p1.x, y: clientY - quad.p1.y };
      const horizontalLength =
        horizontal.x * horizontal.x + horizontal.y * horizontal.y;
      const verticalLength = vertical.x * vertical.x + vertical.y * vertical.y;

      if (horizontalLength > 0 && verticalLength > 0) {
        return {
          x:
            ((point.x * horizontal.x + point.y * horizontal.y) /
              horizontalLength) *
            dom.canvas.offsetWidth,
          y:
            ((point.x * vertical.x + point.y * vertical.y) / verticalLength) *
            dom.canvas.offsetHeight,
        };
      }
    }
  }

  const rect = dom.canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / state.zoom,
    y: (clientY - rect.top) / state.zoom,
  };
}

document.querySelectorAll(".palette-item").forEach((item) => {
  item.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData(
      "application/x-simulator-node",
      item.dataset.type,
    );
    event.dataTransfer.effectAllowed = "copy";
  });

  /* En pantallas táctiles, un toque agrega el bloque al centro visible. */
  item.addEventListener("click", () => {
    if (window.innerWidth > 1100) return;
    const type = item.dataset.type;
    if (!NODE_TYPES[type]) return;

    const visibleCenterX =
      (dom.canvasWrap.scrollLeft + dom.canvasWrap.clientWidth / 2) / state.zoom;
    const visibleCenterY =
      (dom.canvasWrap.scrollTop + dom.canvasWrap.clientHeight / 2) / state.zoom;
    const offset = state.nodes.length % 5;
    createNode(
      type,
      clamp(visibleCenterX - 94 + offset * 18, 0, 2400 - 188),
      clamp(visibleCenterY - 54 + offset * 18, 0, 1400 - 108),
    );
    closeMobilePanels();
    showToast("Bloque agregado. Tóquelo para editar sus características.");
  });
});

dom.canvas.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  dom.canvas.classList.add("drag-over");
});

dom.canvas.addEventListener("dragleave", (event) => {
  if (!dom.canvas.contains(event.relatedTarget))
    dom.canvas.classList.remove("drag-over");
});

dom.canvas.addEventListener("drop", (event) => {
  event.preventDefault();
  dom.canvas.classList.remove("drag-over");
  const type = event.dataTransfer.getData("application/x-simulator-node");
  if (!NODE_TYPES[type]) return;
  const point = clientToCanvas(event.clientX, event.clientY);
  createNode(type, point.x - 94, point.y - 54);
  updateStatus("Bloque agregado al modelo.");
});

dom.canvas.addEventListener("click", (event) => {
  if (
    event.target === dom.canvas ||
    event.target === dom.nodesLayer ||
    event.target === dom.entityLayer
  )
    clearSelection();
});

function toggleConnectionMode() {
  state.connectionMode = !state.connectionMode;
  state.connectionOrigin = null;
  dom.connectBtn.classList.toggle("active", state.connectionMode);
  renderNodes();
  updateStatus(
    state.connectionMode
      ? "Modo Conectar activado. Seleccione el bloque de origen."
      : "Modo Conectar desactivado.",
  );
}

function initializeRuntime() {
  state.nodes
    .filter((node) => node.type === "source")
    .forEach(sanitizeSourceAmountConfiguration);
  state.nodeRuntime.clear();
  state.sourceSchedule.clear();
  state.nodes.forEach((node) => {
    state.nodeRuntime.set(node.id, {
      queue: [],
      busy: 0,
      completed: 0,
      entered: 0,
      rejected: 0,
    });
    if (node.type === "source")
      state.sourceSchedule.set(
        node.id,
        Math.max(0, Number(node.props.startAt) || 0),
      );
  });
  state.events = [];
  state.movingEntities = [];
  dom.entityLayer.innerHTML = "";
  state.nextEntityId = 1;
  state.nextEventId = 1;
  state.simTime = 0;
  state.nextHistoryTime = 0;
  state.scenario.currentCapital = Math.max(
    0,
    Number(state.scenario.initialCapital) || 0,
  );
  state.capitalLedger = [];
  resetAdvancedFinancialState();
  state.metrics = {
    created: 0,
    completed: 0,
    rejected: 0,
    maxQueue: 0,
    creditApproved: 0,
    creditRejected: 0,
    depositTotal: 0,
    withdrawalTotal: 0,
    creditDisbursed: 0,
    interestReceivable: 0,
    paymentTotal: 0,
    transferInTotal: 0,
    transferOutTotal: 0,
    delayedEvents: 0,
    angryUsers: 0,
    abandonedUsers: 0,
    satisfactionTotal: 0,
    satisfactionSamples: 0,
    promoters: 0,
    detractors: 0,
    staffBusyMinutes: 0,
    staffCapacityMinutes: 0,
    complianceFlags: 0,
    blockedOperations: 0,
    loanPaymentsReceived: 0,
    delinquentLoans: 0,
    history: [],
  };
  state.records = [];
  renderAll();
}

function validateModel() {
  const sources = state.nodes.filter((node) => node.type === "source");
  const sinks = state.nodes.filter((node) => node.type === "sink");
  if (sources.length === 0) {
    showToast("Agregue al menos una entrada.", "warning");
    return false;
  }
  if (sinks.length === 0) {
    showToast("Agregue al menos una salida.", "warning");
    return false;
  }

  const disconnected = state.nodes.filter((node) => {
    if (node.type === "sink") return getIncoming(node.id).length === 0;
    if (node.type === "source") return getOutgoing(node.id).length === 0;
    return (
      getIncoming(node.id).length === 0 || getOutgoing(node.id).length === 0
    );
  });

  if (disconnected.length > 0) {
    showToast("Existen bloques sin una ruta completa.", "warning");
    selectElement("node", disconnected[0].id);
    return false;
  }
  return true;
}

function startSimulation() {
  if (state.running && state.paused) {
    state.paused = false;
    state.lastFrame = performance.now();
    supabaseSync.markStatus("ejecutando");
    updateRunStatus();
    updateStatus("Simulación reanudada.");
    requestAnimationFrame(simulationFrame);
    return;
  }

  if (state.running) return;

  if (sessionEndMinutes() <= sessionStartMinutes()) {
    showToast(
      "La hora de finalización debe ser posterior a la hora de entrada.",
      "warning",
    );
    return;
  }

  if (simulationDaysCount() <= 0) {
    showToast(
      "El rango de fechas no contiene ningún día habilitado para simular.",
      "warning",
    );
    return;
  }

  if (!validateModel()) return;

  const continueExistingRun = Boolean(supabaseSync.runId);

  if (continueExistingRun) {
    // Continúa exactamente desde el minuto, colas, personas y capital actuales.
    // No reinicia el runtime ni crea otro simulacion_id.
    supabaseSync.markStatus("ejecutando");
  } else {
    // Solo una ejecución realmente nueva reinicia el runtime y obtiene UUID nuevo.
    initializeRuntime();
    supabaseSync.beginRun();
  }

  state.running = true;
  state.paused = false;
  state.lastFrame = performance.now();
  updateRunStatus();
  updateStatus(
    continueExistingRun
      ? "Simulación continuada desde el punto donde fue detenida."
      : "Simulación en ejecución.",
  );
  requestAnimationFrame(simulationFrame);
}

function pauseSimulation() {
  if (!state.running) {
    showToast("La simulación no está en ejecución.", "warning");
    return;
  }
  state.paused = true;
  supabaseSync.markStatus("pausada");
  updateRunStatus();
  updateStatus("Simulación pausada.");
}

function stopSimulation(resetTime = false, preserveRun = true) {
  state.running = false;
  state.paused = false;
  state.lastFrame = 0;

  if (supabaseSync.runId) {
    if (preserveRun && !resetTime) {
      // Detener no borra ni cierra la ejecución.
      // Guarda el estado actual y permite continuar con el mismo UUID.
      supabaseSync.markStatus("detenida");
    } else {
      // Reiniciar o sustituir el modelo cierra la ejecución actual,
      // pero sus datos permanecen en Supabase.
      void supabaseSync.finishRun(resetTime ? "reiniciada" : "detenida");
    }
  }

  if (resetTime) initializeRuntime();

  updateRunStatus();
  updateStatus(
    resetTime
      ? "Simulación reiniciada. La ejecución anterior permanece guardada."
      : preserveRun
        ? "Simulación detenida. Puede continuar sin perder información."
        : "Simulación detenida y guardada.",
  );
}

function resetSimulation() {
  stopSimulation(true, false);
}

function updateRunStatus() {
  if (state.running && !state.paused) {
    dom.statusDot.classList.add("running");
    dom.statusText.textContent = "Ejecutando";
    dom.playBtn.classList.add("active");
    dom.pauseBtn.classList.remove("active");
  } else if (state.running && state.paused) {
    dom.statusDot.classList.remove("running");
    dom.statusText.textContent = "Pausado";
    dom.playBtn.classList.remove("active");
    dom.pauseBtn.classList.add("active");
  } else {
    dom.statusDot.classList.remove("running");
    dom.statusText.textContent = "Detenido";
    dom.playBtn.classList.remove("active");
    dom.pauseBtn.classList.remove("active");
  }
}

function simulationFrame(timestamp) {
  if (!state.running || state.paused) return;
  const realDelta = Math.min(
    0.1,
    Math.max(0, (timestamp - state.lastFrame) / 1000),
  );
  state.lastFrame = timestamp;
  const targetTime = Math.min(
    simulationTotalMinutes(),
    state.simTime + realDelta * state.speed,
  );
  let guard = 0;

  while (state.simTime < targetTime && guard < 5000) {
    const step = Math.min(1, targetTime - state.simTime);
    state.simTime += step;
    processSimulationDayEvents();
    accumulateAdvancedMetrics(step);
    generateSourceEntities();
    processScheduledEvents();
    updateMovingEntities();
    updateWaitingMoods();
    processQueues();
    if (state.simTime >= state.nextHistoryTime) {
      recordHistory();
      state.nextHistoryTime = state.simTime + 10;
    }
    guard += 1;
  }

  renderNodes();
  updateMetrics();

  if (state.simTime >= simulationTotalMinutes()) {
    state.simTime = simulationTotalMinutes();
    finalizeAtClosing();
    return;
  }

  requestAnimationFrame(simulationFrame);
}

function generateSourceEntities() {
  state.nodes
    .filter((node) => node.type === "source")
    .forEach((node) => {
      const interval = Math.max(0.1, Number(node.props.interval) || 4);
      const maxEntities = Math.max(
        0,
        Math.floor(Number(node.props.maxEntities) || 0),
      );
      const runtime = ensureNodeRuntime(node);
      let nextTime = state.sourceSchedule.get(node.id);
      if (!Number.isFinite(nextTime))
        nextTime = Math.max(0, Number(node.props.startAt) || 0);
      let guard = 0;

      while (
        state.simTime >= nextTime &&
        (maxEntities === 0 || runtime.completed < maxEntities) &&
        guard < 100
      ) {
        const label = "P-" + String(state.nextEntityId).padStart(4, "0");
        const transactionType = chooseTransactionType(node.props);
        const transaction = getTransactionConfig(transactionType);
        const amountUsd = chooseTransactionAmount(transactionType, node.props);
        const creditType =
          transactionType === "credit" ? chooseCreditType(node.props) : "";
        const creditConfig = creditType ? CREDIT_TYPES[creditType] : null;
        const creditLimit =
          transactionType === "credit"
            ? transactionLimit("credit", creditType)
            : null;
        const configuredCreditRange =
          transactionType === "credit"
            ? normalizeConfiguredRange(
                node.props.creditAmountRanges?.[creditType],
                DEFAULT_CREDIT_AMOUNT_RANGES[creditType] || {
                  min: creditConfig.minAmount,
                  max: creditConfig.maxAmount,
                },
                creditLimit.min,
                creditLimit.max,
              )
            : null;
        const rawEffectiveAmount =
          transactionType === "credit" &&
          (node.props.amountMode || "automatic") === "automatic"
            ? randomAmount(configuredCreditRange.min, configuredCreditRange.max)
            : amountUsd;
        const effectiveAmount = sanitizeTransactionAmount(
          transactionType,
          rawEffectiveAmount,
          creditType,
        );
        const creditProfile =
          transactionType === "credit" ? createCreditProfile() : null;
        const entity = {
          id: state.nextEntityId++,
          label,
          personType: node.props.personType || "Ciudadano",
          hasAppointment: Math.random() * 100 < state.scenario.appointmentRate,
          priorityLevel:
            Math.random() * 100 < state.scenario.priorityRate
              ? "priority"
              : "standard",
          serviceChannel:
            Math.random() * 100 < state.scenario.digitalShare
              ? "Digital"
              : "Presencial",
          complianceFlag: effectiveAmount >= state.scenario.amlThreshold,
          transactionType,
          transactionLabel: transaction.label,
          transactionCode: transaction.code,
          transactionColor: transaction.color,
          amountUsd: effectiveAmount,
          creditType,
          creditTypeLabel: creditConfig?.label || "",
          createdAt: nextTime,
          createdDate: formatDateIso(simulationDate(nextTime)),
          mood: "calm",
          becameAngryAt: null,
          totalWaitMinutes: 0,
          totalServiceMinutes: 0,
          delayEvents: 0,
          abandonEvaluated: false,
          queueEnteredAt: null,
          route: [],
          steps: [],
          timeline: [],
          creditProfile,
          creditOutcome: "",
          creditReason: "",
          creditAnnualInterestRate: 0,
          creditTermMonths: 0,
          creditMonthlyPayment: 0,
          creditTotalInterest: 0,
          creditTotalPayable: 0,
          operationOutcome: "",
          operationReason: "",
          transferDirection:
            transactionType === "transfer"
              ? Math.random() < 0.5
                ? "incoming"
                : "outgoing"
              : "",
          capitalEffect: 0,
          capitalBefore: null,
          capitalAfter: null,
          capitalMovement: "",
          financialPosted: false,
          finalStatus: "En proceso",
        };
        runtime.completed += 1;
        state.metrics.created += 1;
        registerVisit(entity, node, "Ingreso");
        routeFromNode(node, entity);
        nextTime += interval;
        guard += 1;
      }
      state.sourceSchedule.set(node.id, nextTime);
    });
}

function createCreditProfile() {
  const monthlyIncome = randomAmount(450, 5000);
  const currentMonthlyDebt = randomAmount(0, Math.max(50, monthlyIncome * 0.7));
  const employmentMonths = Math.floor(randomAmount(1, 120));
  const documentsComplete = Math.random() >= 0.12;
  const historyRandom = Math.random();
  const creditHistory =
    historyRandom < 0.12
      ? "Negativo"
      : historyRandom < 0.38
        ? "Regular"
        : "Bueno";
  return {
    monthlyIncome,
    currentMonthlyDebt,
    employmentMonths,
    documentsComplete,
    creditHistory,
  };
}

function calculateCreditTerms(principal, annualRate, termMonths) {
  const amount = Math.max(0, Number(principal) || 0);
  const annual = clamp(Number(annualRate) || 0, 0, 100);
  const months = clamp(Math.floor(Number(termMonths) || 1), 1, 360);
  const monthlyRate = annual / 100 / 12;
  let monthlyPayment = amount / months;
  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment =
      (amount * (monthlyRate * factor)) / Math.max(0.0000001, factor - 1);
  }
  const totalPayable = monthlyPayment * months;
  return {
    annualRate,
    termMonths: months,
    monthlyPayment,
    totalInterest: Math.max(0, totalPayable - amount),
    totalPayable,
  };
}

function postCapitalMovement(entity, amount, movementType, description) {
  if (entity.financialPosted) return true;
  const effect = roundUsd(Number(amount) || 0);
  const before = roundUsd(
    Math.max(0, Number(state.scenario.currentCapital) || 0),
  );
  if (effect < 0 && roundUsd(before + effect) < 0) return false;
  const after = roundUsd(Math.max(0, before + effect));
  state.scenario.currentCapital = after;
  entity.financialPosted = true;
  entity.capitalEffect = effect;
  entity.capitalBefore = before;
  entity.capitalAfter = after;
  entity.capitalMovement = description || movementType;
  state.capitalLedger.unshift({
    personId: entity.label,
    transactionType: entity.transactionType,
    movementType,
    description: entity.capitalMovement,
    amount: effect,
    before,
    after,
    minute: Number(state.simTime.toFixed(1)),
    date: formatDateIso(simulationDate()),
    clock: simulationClock(),
    dateTime: simulationDateTime(),
  });
  if (state.capitalLedger.length > 500) state.capitalLedger.pop();
  entity.timeline.push({
    event: "Movimiento de capital",
    date: formatDateIso(simulationDate()),
    clock: simulationClock(),
    dateTime: simulationDateTime(),
    minute: Number(state.simTime.toFixed(1)),
    movement: entity.capitalMovement,
    effect,
    capitalBefore: before,
    capitalAfter: after,
  });
  updateScenarioUi();
  updateMetrics();
  supabaseSync.requestSync();
  return true;
}

function processFinancialTransaction(entity, node) {
  if (
    entity.financialPosted ||
    entity.transactionType === "credit" ||
    entity.transactionType === "inquiry" ||
    entity.transactionType === "account" ||
    entity.transactionType === "card"
  )
    return;
  const amount = sanitizeTransactionAmount(
    entity.transactionType,
    entity.amountUsd,
    entity.creditType,
  );
  entity.amountUsd = amount;
  let effect = 0;
  let description = entity.transactionLabel || "Transacción";

  const commission =
    (amount * clamp(Number(state.scenario.commissionRate) || 0, 0, 100)) / 100;
  if (entity.complianceFlag) {
    state.metrics.complianceFlags += 1;
    entity.timeline.push({
      event: "Revisión de cumplimiento",
      dateTime: simulationDateTime(),
      amount,
      reason: "Monto igual o superior al umbral configurado",
    });
  }

  if (entity.transactionType === "deposit") {
    effect = amount;
    state.metrics.depositTotal += amount;
    state.financial.clientDeposits += amount;
    state.financial.cashDesk += amount;
  } else if (entity.transactionType === "withdrawal") {
    if (state.financial.clientDeposits < amount) {
      entity.operationOutcome = "rejected";
      entity.operationReason =
        "Saldo agregado de depósitos insuficiente para respaldar el retiro";
      entity.finalStatus = "Operación rechazada";
      state.metrics.rejected += 1;
      return;
    }
    if (!transferVaultToCashDesk(amount)) {
      entity.operationOutcome = "rejected";
      entity.operationReason = "Efectivo insuficiente en cajas y bóveda";
      entity.finalStatus = "Operación rechazada";
      state.metrics.rejected += 1;
      return;
    }
    effect = -amount;
    state.financial.clientDeposits = Math.max(
      0,
      state.financial.clientDeposits - amount,
    );
    state.financial.cashDesk = Math.max(0, state.financial.cashDesk - amount);
  } else if (entity.transactionType === "payment") {
    effect = amount;
    state.metrics.paymentTotal += amount;
    state.financial.commissionIncome += commission;
  } else if (entity.transactionType === "transfer") {
    effect = entity.transferDirection === "incoming" ? amount : -amount;
    description =
      entity.transferDirection === "incoming"
        ? "Transferencia entrante"
        : "Transferencia saliente";
    state.financial.commissionIncome += commission;
  } else if (entity.transactionType === "insurance") {
    effect = amount;
    description = "Prima de seguro recibida";
    state.financial.commissionIncome += commission;
  } else if (entity.transactionType === "investment") {
    effect = amount;
    description = "Fondo de inversión recibido";
    state.financial.investmentLiability += amount;
  }

  if (
    !postCapitalMovement(entity, effect, entity.transactionType, description)
  ) {
    entity.operationOutcome = "rejected";
    entity.operationReason =
      "Liquidez disponible insuficiente para completar la operación";
    entity.finalStatus = "Operación rechazada";
    state.metrics.rejected += 1;
    if (entity.transactionType === "withdrawal")
      state.metrics.withdrawalTotal += 0;
    entity.timeline.push({
      event: "Operación rechazada",
      clock: simulationClock(),
      minute: Number(state.simTime.toFixed(1)),
      reason: entity.operationReason,
    });
    return;
  }

  entity.operationOutcome = "completed";
  entity.operationReason = "Operación procesada correctamente";
  if (entity.transactionType === "withdrawal")
    state.metrics.withdrawalTotal += amount;
  if (entity.transactionType === "transfer") {
    if (entity.transferDirection === "incoming")
      state.metrics.transferInTotal += amount;
    else state.metrics.transferOutTotal += amount;
  }
}

function processBankingService(entity) {
  if (entity.operationOutcome || entity.transactionType === "credit") return;
  if (["account", "card"].includes(entity.transactionType)) {
    entity.operationOutcome = "completed";
    entity.operationReason =
      entity.transactionType === "account"
        ? "Cuenta bancaria aperturada"
        : "Solicitud de tarjeta procesada";
  } else if (["insurance", "investment"].includes(entity.transactionType)) {
    processFinancialTransaction(entity, null);
  }
}

function evaluateCredit(entity, node) {
  const profile = entity.creditProfile || createCreditProfile();
  entity.creditProfile = profile;
  const minIncome = Math.max(0, Number(node.props.creditMinIncome ?? 600));
  const maxDebtRatio = clamp(
    Number(node.props.creditMaxDebtRatio ?? 40),
    0,
    100,
  );
  const minEmploymentMonths = Math.max(
    0,
    Number(node.props.creditMinEmploymentMonths ?? 6),
  );
  const maxIncomeMultiple = Math.max(
    1,
    Number(node.props.creditMaxIncomeMultiple ?? 12),
  );
  const approvalRate = clamp(
    Number(node.props.creditApprovalRate ?? 75),
    0,
    100,
  );
  const creditType = CREDIT_TYPES[entity.creditType]
    ? entity.creditType
    : "consumer";
  const annualRate = clamp(
    Number(
      node.props.creditRates?.[creditType] ??
        CREDIT_TYPES[creditType].defaultRate,
    ),
    0,
    100,
  );
  const termMonths = clamp(
    Math.floor(
      Number(
        node.props.creditTerms?.[creditType] ??
          CREDIT_TYPES[creditType].defaultTerm,
      ),
    ),
    1,
    360,
  );
  entity.amountUsd = sanitizeTransactionAmount(
    "credit",
    entity.amountUsd,
    entity.creditType,
  );
  const terms = calculateCreditTerms(entity.amountUsd, annualRate, termMonths);

  entity.creditAnnualInterestRate = terms.annualRate;
  entity.creditTermMonths = terms.termMonths;
  entity.creditMonthlyPayment = terms.monthlyPayment;
  entity.creditTotalInterest = terms.totalInterest;
  entity.creditTotalPayable = terms.totalPayable;

  const projectedDebtRatio =
    ((profile.currentMonthlyDebt + terms.monthlyPayment) /
      Math.max(1, profile.monthlyIncome)) *
    100;
  let reason = "";
  if (!profile.documentsComplete) reason = "Documentación incompleta";
  else if (profile.creditHistory === "Negativo")
    reason = "Historial crediticio negativo";
  else if (profile.monthlyIncome < minIncome)
    reason = "Ingreso mensual insuficiente";
  else if (projectedDebtRatio > maxDebtRatio)
    reason = "La cuota estimada supera la capacidad de pago";
  else if (profile.employmentMonths < minEmploymentMonths)
    reason = "Antigüedad laboral insuficiente";
  else if (entity.amountUsd > profile.monthlyIncome * maxIncomeMultiple)
    reason = "Monto solicitado elevado respecto del ingreso";
  else if (
    entity.amountUsd > Math.max(0, Number(state.scenario.currentCapital) || 0)
  )
    reason = "Fondos disponibles insuficientes para desembolsar el crédito";
  else if (Math.random() * 100 > approvalRate)
    reason = "Política interna de riesgo";

  if (reason) {
    entity.creditOutcome = "rejected";
    entity.creditReason = reason;
    entity.operationOutcome = "rejected";
    entity.operationReason = reason;
    entity.finalStatus = "Crédito rechazado";
    state.metrics.creditRejected += 1;
  } else {
    entity.creditOutcome = "approved";
    entity.creditReason = "Cumple los criterios simulados";
    entity.operationOutcome = "completed";
    entity.operationReason = "Crédito aprobado y desembolsado";
    entity.finalStatus = "Crédito aprobado";
    state.metrics.creditApproved += 1;
    state.metrics.creditDisbursed += Math.max(0, Number(entity.amountUsd) || 0);
    state.metrics.interestReceivable += terms.totalInterest;
    state.financial.loanPortfolio += Math.max(0, Number(entity.amountUsd) || 0);
    state.loanAccounts.push({
      id: uid("loan"),
      personId: entity.label,
      creditType: entity.creditType,
      principal: Math.max(0, Number(entity.amountUsd) || 0),
      outstandingPrincipal: Math.max(0, Number(entity.amountUsd) || 0),
      annualRate: terms.annualRate,
      termMonths: terms.termMonths,
      monthlyPayment: terms.monthlyPayment,
      startDate: formatDateIso(simulationDate()),
      installmentsProcessed: 0,
      overdueAmount: 0,
      status: "current",
    });
    postCapitalMovement(
      entity,
      -Math.max(0, Number(entity.amountUsd) || 0),
      "credit_disbursement",
      "Desembolso de crédito",
    );
  }

  entity.timeline.push({
    event: "Evaluación de crédito",
    date: formatDateIso(simulationDate()),
    clock: simulationClock(),
    dateTime: simulationDateTime(),
    creditType: entity.creditType,
    creditTypeLabel: entity.creditTypeLabel,
    minute: Number(state.simTime.toFixed(1)),
    outcome: entity.creditOutcome,
    reason: entity.creditReason,
    annualInterestRate: terms.annualRate,
    termMonths: terms.termMonths,
    monthlyPayment: Number(terms.monthlyPayment.toFixed(2)),
    totalInterest: Number(terms.totalInterest.toFixed(2)),
    totalPayable: Number(terms.totalPayable.toFixed(2)),
    projectedDebtRatio: Number(projectedDebtRatio.toFixed(2)),
  });
  supabaseSync.requestSync();
}

function finalizeAtClosing() {
  const collected = new Map();
  state.movingEntities.forEach((move) =>
    collected.set(move.entity.label, move.entity),
  );
  state.events.forEach((event) => {
    if (event.payload?.entity)
      collected.set(event.payload.entity.label, event.payload.entity);
  });
  state.nodeRuntime.forEach((runtime, nodeId) => {
    const node = getNode(nodeId);
    runtime.queue.forEach((entity) => {
      if (entity.queueEnteredAt !== null && node) {
        registerWaitResult(entity, node, state.simTime - entity.queueEnteredAt);
        entity.queueEnteredAt = null;
      }
      collected.set(entity.label, entity);
    });
  });

  collected.forEach((entity) => {
    if (!state.records.some((record) => record.personId === entity.label)) {
      entity.finalStatus = "Pendiente al cierre";
      if (entity.transactionType === "credit") {
        entity.creditReason =
          entity.creditReason ||
          "Periodo finalizado antes de completar la evaluación";
      } else {
        entity.operationReason =
          entity.operationReason ||
          "Periodo finalizado antes de completar el trámite";
      }
      saveRecord(entity, { props: { finalStatus: "Pendiente al cierre" } });
    }
  });

  state.events = [];
  state.movingEntities.forEach((move) => move.element.remove());
  state.movingEntities = [];
  state.nodeRuntime.forEach((runtime) => {
    runtime.queue = [];
    runtime.busy = 0;
  });
  state.running = false;
  state.paused = false;
  void supabaseSync.finishRun("finalizada");
  updateRunStatus();
  renderNodes();
  updateMetrics();
  updateStatus(
    "Periodo finalizado el " +
      formatDisplayDate(simulationDate()) +
      " a las " +
      state.scenario.closingTime +
      ". Los trámites pendientes fueron registrados.",
  );
  showToast("El periodo de simulación finalizó.", "success");
}

function scheduleEvent(time, type, payload) {
  state.events.push({ id: state.nextEventId++, time, type, payload });
  state.events.sort((a, b) => a.time - b.time || a.id - b.id);
}

function processScheduledEvents() {
  let guard = 0;
  while (
    state.events.length > 0 &&
    state.events[0].time <= state.simTime &&
    guard < 1000
  ) {
    const event = state.events.shift();
    if (event.type === "processComplete")
      completeProcess(event.payload.nodeId, event.payload.entity);
    guard += 1;
  }
}

function updateMovingEntities() {
  const completedMoves = [];
  state.movingEntities.forEach((move) => {
    const progress = clamp(
      (state.simTime - move.startTime) / Math.max(0.001, move.duration),
      0,
      1,
    );
    const point = cubicPoint(move.p0, move.p1, move.p2, move.p3, progress);
    move.element.style.left = point.x + "px";
    move.element.style.top = point.y + "px";
    if (progress >= 1) completedMoves.push(move);
  });

  completedMoves.forEach((move) => {
    move.element.remove();
    state.movingEntities = state.movingEntities.filter((item) => item !== move);
    acceptEntity(move.toNodeId, move.entity);
  });
}

function registerWaitResult(entity, node, waited) {
  const wait = Math.max(0, Number(waited) || 0);
  entity.totalWaitMinutes = (Number(entity.totalWaitMinutes) || 0) + wait;
  const target = Math.max(0, Number(node?.props?.targetWaitMinutes ?? 5));
  if (wait > target) {
    entity.delayEvents = (Number(entity.delayEvents) || 0) + 1;
    state.metrics.delayedEvents += 1;
    entity.timeline.push({
      event: "Demora superior al objetivo",
      date: formatDateIso(simulationDate()),
      clock: simulationClock(),
      waitedMinutes: Number(wait.toFixed(1)),
      targetMinutes: target,
      area: node?.name || "Área",
    });
  }
}

function updateWaitingMoods() {
  state.nodes
    .filter((node) => node.type === "queue" || node.type === "process")
    .forEach((node) => {
      const runtime = ensureNodeRuntime(node);
      const angerAfter = Math.max(
        1,
        Number(node.props.angerAfterMinutes ?? 12),
      );
      const abandonAfter = Math.max(
        angerAfter,
        Number(node.props.abandonAfterMinutes ?? 30),
      );
      const abandonProbability = clamp(
        Number(node.props.abandonProbability ?? 25),
        0,
        100,
      );
      const remaining = [];

      runtime.queue.forEach((entity) => {
        const entered = Number(entity.queueEnteredAt);
        const waited = Number.isFinite(entered)
          ? Math.max(0, state.simTime - entered)
          : 0;
        entity.currentWaitMinutes = waited;

        if (waited >= angerAfter && entity.mood !== "angry") {
          entity.mood = "angry";
          entity.becameAngryAt = Number(state.simTime.toFixed(1));
          state.metrics.angryUsers += 1;
          entity.timeline.push({
            event: "Usuario molesto por demora",
            date: formatDateIso(simulationDate()),
            clock: simulationClock(),
            waitedMinutes: Number(waited.toFixed(1)),
            area: node.name,
          });
        }

        if (waited >= abandonAfter && !entity.abandonEvaluated) {
          entity.abandonEvaluated = true;
          if (Math.random() * 100 < abandonProbability) {
            registerWaitResult(entity, node, waited);
            entity.finalStatus = "Abandonó por demora";
            entity.operationOutcome = "abandoned";
            entity.operationReason = `Esperó ${formatNumber(waited, 1)} minutos en ${node.name}`;
            state.metrics.abandonedUsers += 1;
            state.metrics.rejected += 1;
            state.metrics.completed += 1;
            entity.timeline.push({
              event: "Abandono por demora",
              date: formatDateIso(simulationDate()),
              clock: simulationClock(),
              waitedMinutes: Number(waited.toFixed(1)),
              area: node.name,
            });
            saveRecord(entity, {
              props: { finalStatus: "Abandonó por demora" },
            });
            return;
          }
        }

        remaining.push(entity);
      });

      runtime.queue = remaining;
    });
}

function processQueues() {
  state.nodes
    .filter((node) => node.type === "queue")
    .forEach((node) => attemptDispatchQueue(node));
}

function routeFromNode(node, entity) {
  const outgoing = getOutgoing(node.id);
  if (outgoing.length === 0) {
    state.metrics.rejected += 1;
    state.metrics.completed += 1;
    entity.finalStatus = "Sin destino";
    entity.operationOutcome = entity.operationOutcome || "rejected";
    entity.operationReason =
      entity.operationReason ||
      `No existe una conexión de salida desde ${node.name}`;
    entity.timeline.push({
      event: "Trámite finalizado sin destino",
      date: formatDateIso(simulationDate()),
      clock: simulationClock(),
      area: node.name,
      reason: entity.operationReason,
    });
    saveRecord(entity, { props: { finalStatus: "Sin destino" } });
    showToast(
      `La persona ${entity.label} quedó sin destino desde "${node.name}".`,
      "error",
    );
    return;
  }
  let edge = outgoing[0];
  if (node.type === "decision" && outgoing.length > 1) {
    edge = chooseDecisionEdge(node, outgoing, entity);
  } else if (
    node.type === "process" &&
    node.props.processRole === "credit_evaluation" &&
    entity.transactionType === "credit" &&
    entity.creditOutcome
  ) {
    edge =
      outgoing.find(
        (item) =>
          Array.isArray(item.creditOutcomes) &&
          item.creditOutcomes.includes(entity.creditOutcome),
      ) ||
      outgoing.find(
        (item) =>
          !Array.isArray(item.creditOutcomes) ||
          item.creditOutcomes.length === 0,
      ) ||
      outgoing[0];
  }
  animateEntity(node.id, edge.to, entity);
}

function chooseDecisionEdge(node, edges, entity) {
  if ((node.props.routingMode || "probability") === "transaction") {
    const exact = edges.find(
      (edge) =>
        Array.isArray(edge.transactionTypes) &&
        edge.transactionTypes.includes(entity.transactionType),
    );
    if (exact) return exact;

    const fallback = edges.find(
      (edge) =>
        !Array.isArray(edge.transactionTypes) ||
        edge.transactionTypes.length === 0,
    );
    if (fallback) return fallback;
  }
  return chooseWeightedEdge(edges);
}

function chooseWeightedEdge(edges) {
  const weighted = edges.map((edge) => ({
    edge,
    weight: Math.max(0, Number(edge.weight) || 0),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return edges[Math.floor(Math.random() * edges.length)];
  let random = Math.random() * total;
  for (const item of weighted) {
    random -= item.weight;
    if (random <= 0) return item.edge;
  }
  return weighted[weighted.length - 1].edge;
}

function animateEntity(fromNodeId, toNodeId, entity) {
  const fromNode = getNode(fromNodeId);
  const toNode = getNode(toNodeId);
  if (!fromNode || !toNode) {
    state.metrics.rejected += 1;
    return;
  }
  const start = nodeCenter(fromNode);
  const end = nodeCenter(toNode);
  const distance = Math.abs(end.x - start.x);
  const bend = Math.max(70, distance * 0.45);
  const direction = end.x >= start.x ? 1 : -1;
  const element = document.createElement("div");
  element.className = "entity" + (entity.mood === "angry" ? " angry" : "");
  element.textContent = entity.mood === "angry" ? "😠" : "👤";
  element.dataset.code = `${entity.transactionCode || "TR"} · ${compactCurrency(entity.amountUsd)}`;
  element.style.setProperty(
    "--transaction-color",
    entity.transactionColor || "#3a8bfd",
  );
  element.title = `${entity.label} · ${entity.transactionLabel || "Trámite financiero"}${entity.creditTypeLabel ? " · " + entity.creditTypeLabel : ""} · ${formatCurrency(entity.amountUsd)} · ${entity.mood === "angry" ? "Molesto" : "Tranquilo"}`;
  element.style.left = start.x + "px";
  element.style.top = start.y + "px";
  dom.entityLayer.appendChild(element);
  state.movingEntities.push({
    element,
    entity,
    toNodeId,
    startTime: state.simTime,
    duration: 1,
    p0: start,
    p1: { x: start.x + bend * direction, y: start.y },
    p2: { x: end.x - bend * direction, y: end.y },
    p3: end,
  });
}

function registerVisit(entity, node, stageLabel = "Paso") {
  entity.route.push(node.name);
  const eventData = {
    nodeId: node.id,
    nodeName: node.name,
    type: node.type,
    department: node.props.department || "",
    procedure: node.props.procedure || node.props.finalStatus || "",
    stage: stageLabel,
    time: Number(state.simTime.toFixed(1)),
    date: formatDateIso(simulationDate()),
    clock: simulationClock(),
    dateTime: simulationDateTime(),
  };
  entity.steps.push(eventData);
  entity.timeline = Array.isArray(entity.timeline) ? entity.timeline : [];
  entity.timeline.push({
    event: stageLabel,
    date: eventData.date,
    dateTime: eventData.dateTime,
    area: node.name,
    department: eventData.department,
    procedure: eventData.procedure,
    minute: eventData.time,
    clock: eventData.clock,
  });
  // Guarda cada cambio de etapa en Supabase sin esperar al cierre.
  supabaseSync.requestSync();
}

function acceptEntity(nodeId, entity) {
  const node = getNode(nodeId);
  if (!node) {
    state.metrics.rejected += 1;
    return;
  }
  const runtime = ensureNodeRuntime(node);
  runtime.entered += 1;
  registerVisit(entity, node, NODE_TYPES[node.type].label);

  if (node.type === "queue") {
    const capacity = Math.max(1, Number(node.props.capacity) || 999);
    if (runtime.queue.length >= capacity) {
      runtime.rejected += 1;
      state.metrics.rejected += 1;
      state.metrics.completed += 1;
      entity.finalStatus = "Cola llena";
      entity.operationOutcome = "rejected";
      entity.operationReason = `La cola ${node.name} alcanzó su capacidad máxima`;
      entity.timeline.push({
        event: "Rechazo por cola llena",
        date: formatDateIso(simulationDate()),
        clock: simulationClock(),
        area: node.name,
        reason: entity.operationReason,
      });
      saveRecord(entity, { props: { finalStatus: "Cola llena" } });
      showToast(`La cola "${node.name}" alcanzó su capacidad.`, "error");
      return;
    }
    entity.queueEnteredAt = state.simTime;
    entity.currentQueueNodeId = node.id;
    enqueueEntity(runtime, entity);
    state.metrics.maxQueue = Math.max(
      state.metrics.maxQueue,
      runtime.queue.length,
    );
    attemptDispatchQueue(node);
    return;
  }

  if (node.type === "process") {
    startOrQueueProcess(node, entity);
    return;
  }

  if (node.type === "decision") {
    runtime.completed += 1;
    routeFromNode(node, entity);
    return;
  }

  if (node.type === "sink") {
    runtime.completed += 1;
    state.metrics.completed += 1;
    entity.finalStatus = node.props.finalStatus || "Completado";
    saveRecord(entity, node);
    return;
  }

  routeFromNode(node, entity);
}

function saveRecord(entity, sinkNode) {
  const startMinute = Number(entity.createdAt.toFixed(1));
  const endMinute = Number(state.simTime.toFixed(1));
  const profile = entity.creditProfile || null;
  const satisfactionScore = calculateSatisfaction(entity);
  const satisfactionCategory = npsCategory(satisfactionScore);
  state.metrics.satisfactionTotal += satisfactionScore;
  state.metrics.satisfactionSamples += 1;
  if (satisfactionCategory === "Promotor") state.metrics.promoters += 1;
  if (satisfactionCategory === "Detractor") state.metrics.detractors += 1;
  const record = {
    personId: entity.label,
    personType: entity.personType,
    hasAppointment: entity.hasAppointment ? "Sí" : "No",
    priorityLevel:
      entity.priorityLevel === "priority" ? "Prioritario" : "Regular",
    serviceChannel: entity.serviceChannel || "Presencial",
    complianceFlag: entity.complianceFlag ? "Sí" : "No",
    satisfactionScore,
    satisfactionCategory,
    transactionType: entity.transactionType,
    transactionLabel:
      entity.transactionLabel ||
      getTransactionConfig(entity.transactionType).label,
    transactionCode:
      entity.transactionCode ||
      getTransactionConfig(entity.transactionType).code,
    amountUsd: sanitizeTransactionAmount(
      entity.transactionType,
      entity.amountUsd,
      entity.creditType,
    ),
    creditType: entity.creditType || "",
    creditTypeLabel: entity.creditTypeLabel || "",
    startTime: startMinute,
    endTime: endMinute,
    startDate: formatDateIso(simulationDate(startMinute)),
    endDate: formatDateIso(simulationDate(endMinute)),
    startClock: simulationClock(startMinute),
    endClock: simulationClock(endMinute),
    startDateTime: simulationDateTime(startMinute),
    endDateTime: simulationDateTime(endMinute),
    durationMinutes: Math.max(0, Number((endMinute - startMinute).toFixed(1))),
    waitingMinutes: Number((entity.totalWaitMinutes || 0).toFixed(1)),
    delayEvents: Number(entity.delayEvents || 0),
    serviceMinutes: Number((entity.totalServiceMinutes || 0).toFixed(1)),
    mood: entity.mood === "angry" ? "Molesto" : "Tranquilo",
    becameAngryAt: entity.becameAngryAt,
    finalStatus:
      ["rejected", "abandoned"].includes(entity.operationOutcome) ||
      entity.creditOutcome === "rejected"
        ? entity.finalStatus || "Operación rechazada"
        : sinkNode.props.finalStatus || entity.finalStatus || "Completado",
    creditOutcome: entity.creditOutcome || "",
    creditReason: entity.creditReason || "",
    monthlyIncome: profile ? Number(profile.monthlyIncome.toFixed(2)) : "",
    currentMonthlyDebt: profile
      ? Number(profile.currentMonthlyDebt.toFixed(2))
      : "",
    employmentMonths: profile ? profile.employmentMonths : "",
    documentsComplete: profile ? (profile.documentsComplete ? "Sí" : "No") : "",
    creditHistory: profile ? profile.creditHistory : "",
    creditAnnualInterestRate: Number(entity.creditAnnualInterestRate || 0),
    creditTermMonths: Number(entity.creditTermMonths || 0),
    creditMonthlyPayment: Number(entity.creditMonthlyPayment || 0),
    creditTotalInterest: Number(entity.creditTotalInterest || 0),
    creditTotalPayable: Number(entity.creditTotalPayable || 0),
    operationOutcome: entity.operationOutcome || "",
    operationReason: entity.operationReason || "",
    transferDirection: entity.transferDirection || "",
    capitalEffect: Number(entity.capitalEffect || 0),
    capitalBefore:
      entity.capitalBefore === null ? "" : Number(entity.capitalBefore || 0),
    capitalAfter:
      entity.capitalAfter === null ? "" : Number(entity.capitalAfter || 0),
    capitalMovement: entity.capitalMovement || "",
    route: entity.route.join(" → "),
    areasVisited: entity.route.length,
    steps: clone(entity.steps),
    timeline: clone(entity.timeline || []),
  };
  // Conserve todos los registros de la ejecución.
  // El panel visual muestra solo los últimos ocho, pero la exportación incluye el historial completo.
  state.records.unshift(record);
  renderRecords();
  supabaseSync.requestSync();
}

function attemptDispatchQueue(queueNode) {
  const runtime = ensureNodeRuntime(queueNode);
  const outgoing = getOutgoing(queueNode.id);
  if (runtime.queue.length === 0 || outgoing.length === 0) return;
  let guard = 0;

  while (runtime.queue.length > 0 && guard < 100) {
    const edge = outgoing[0];
    const target = getNode(edge.to);
    if (!target) break;
    if (target.type === "process" && !processHasCapacity(target)) break;
    const entity = runtime.queue.shift();
    if (entity.queueEnteredAt !== null) {
      registerWaitResult(
        entity,
        queueNode,
        state.simTime - entity.queueEnteredAt,
      );
      entity.queueEnteredAt = null;
    }
    routeFromNode(queueNode, entity);
    runtime.completed += 1;
    guard += 1;
    if (target.type !== "process") break;
  }
}

function processHasCapacity(node) {
  const runtime = ensureNodeRuntime(node);
  const capacity = Math.max(1, Number(node.props.capacity) || 1);
  return isNodeOnShift(node) && runtime.busy < capacity;
}

function startOrQueueProcess(node, entity) {
  const runtime = ensureNodeRuntime(node);
  const capacity = Math.max(1, Number(node.props.capacity) || 1);
  if (isNodeOnShift(node) && runtime.busy < capacity) {
    startProcess(node, entity);
    return;
  }
  entity.queueEnteredAt = state.simTime;
  entity.currentQueueNodeId = node.id;
  enqueueEntity(runtime, entity);
  state.metrics.maxQueue = Math.max(
    state.metrics.maxQueue,
    runtime.queue.length,
  );
}

function startProcess(node, entity) {
  const runtime = ensureNodeRuntime(node);
  const serviceTime = Math.max(0.1, Number(node.props.serviceTime) || 6);
  runtime.busy += 1;
  entity.totalServiceMinutes =
    (Number(entity.totalServiceMinutes) || 0) + serviceTime;
  scheduleEvent(state.simTime + serviceTime, "processComplete", {
    nodeId: node.id,
    entity,
  });
  // Registra inmediatamente el inicio de la atención.
  supabaseSync.requestSync();
}

function completeProcess(nodeId, entity) {
  const node = getNode(nodeId);
  if (!node) return;
  const runtime = ensureNodeRuntime(node);
  runtime.busy = Math.max(0, runtime.busy - 1);
  runtime.completed += 1;
  if (
    node.props.processRole === "credit_evaluation" &&
    entity.transactionType === "credit" &&
    !entity.creditOutcome
  ) {
    evaluateCredit(entity, node);
  }
  if (
    node.props.processRole === "transaction_processing" &&
    !entity.financialPosted
  ) {
    processFinancialTransaction(entity, node);
  }
  if (
    node.props.processRole === "banking_services" ||
    node.props.processRole === "digital"
  ) {
    processBankingService(entity);
  }
  if (node.props.processRole === "compliance" && entity.complianceFlag) {
    entity.operationReason =
      entity.operationReason || "Operación revisada por cumplimiento";
    entity.timeline.push({
      event: "Cumplimiento aprobado",
      dateTime: simulationDateTime(),
      amount: entity.amountUsd,
    });
  }
  if (node.props.processRole === "collections") {
    const overdue = state.loanAccounts.filter(
      (loan) => loan.status === "overdue",
    );
    overdue.forEach((loan) => {
      if (Math.random() * 100 < state.scenario.recoveryRate) {
        const recovered = Math.min(
          loan.overdueAmount,
          Math.max(0, Number(loan.monthlyPayment) || 0),
        );
        loan.overdueAmount = Math.max(0, loan.overdueAmount - recovered);
        state.financial.overduePortfolio = Math.max(
          0,
          state.financial.overduePortfolio - recovered,
        );
        state.financial.recoveredTotal += recovered;
        state.scenario.currentCapital += recovered;
        if (loan.overdueAmount <= 0.01) loan.status = "current";
      }
    });
  }
  if (node.props.processRole === "vault") {
    balanceCashDesk();
  }
  entity.timeline = Array.isArray(entity.timeline) ? entity.timeline : [];
  entity.timeline.push({
    event: "Fin de atención",
    date: formatDateIso(simulationDate()),
    dateTime: simulationDateTime(),
    area: node.name,
    department: node.props.department || "",
    procedure: node.props.procedure || "",
    minute: Number(state.simTime.toFixed(1)),
    clock: simulationClock(),
  });
  // Registra inmediatamente la finalización del proceso.
  supabaseSync.requestSync();
  routeFromNode(node, entity);

  while (runtime.queue.length > 0 && processHasCapacity(node)) {
    const nextEntity = runtime.queue.shift();
    if (nextEntity.queueEnteredAt !== null) {
      registerWaitResult(
        nextEntity,
        node,
        state.simTime - nextEntity.queueEnteredAt,
      );
      nextEntity.queueEnteredAt = null;
    }
    startProcess(node, nextEntity);
  }

  getIncoming(nodeId).forEach((edge) => {
    const source = getNode(edge.from);
    if (source && source.type === "queue") attemptDispatchQueue(source);
  });
}

function recordHistory() {
  state.metrics.history.push({
    time: state.simTime,
    completed: state.metrics.completed,
  });
  if (state.metrics.history.length > 60) state.metrics.history.shift();
  renderChart();
}

function renderChart() {
  const history = state.metrics.history;
  if (history.length < 2) {
    dom.chartLine.setAttribute("d", "");
    dom.chartArea.setAttribute("d", "");
    return;
  }
  const width = 280;
  const height = 120;
  const padding = 8;
  const minTime = history[0].time;
  const maxTime = history[history.length - 1].time;
  const maxValue = Math.max(1, ...history.map((item) => item.completed));
  const points = history.map((item) => ({
    x:
      padding +
      ((item.time - minTime) / Math.max(0.001, maxTime - minTime)) *
        (width - padding * 2),
    y: height - padding - (item.completed / maxValue) * (height - padding * 2),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  dom.chartLine.setAttribute("d", line);
  dom.chartArea.setAttribute("d", area);
}

function updateMetrics() {
  const wip = Math.max(
    0,
    state.metrics.created - state.metrics.completed - state.metrics.rejected,
  );
  if (dom.metricDate)
    dom.metricDate.textContent = formatDisplayDate(simulationDate());
  dom.metricTime.textContent = simulationClock();
  dom.metricCreated.textContent = state.metrics.created.toLocaleString("es-EC");
  dom.metricCompleted.textContent =
    state.metrics.completed.toLocaleString("es-EC");
  dom.metricWip.textContent = wip.toLocaleString("es-EC");
  dom.metricMaxQueue.textContent =
    state.metrics.maxQueue.toLocaleString("es-EC");
  dom.metricStaff.textContent = totalStaff().toLocaleString("es-EC");
  const currentCapital = Math.max(
    0,
    Number(state.scenario.currentCapital) || 0,
  );
  const netChange =
    currentCapital - Math.max(0, Number(state.scenario.initialCapital) || 0);
  if (dom.metricCapital)
    dom.metricCapital.textContent = compactCurrency(currentCapital);
  if (dom.metricNetChange) {
    dom.metricNetChange.textContent =
      (netChange >= 0 ? "+" : "") + compactCurrency(netChange);
    dom.metricNetChange.classList.toggle("metric-positive", netChange > 0);
    dom.metricNetChange.classList.toggle("metric-negative", netChange < 0);
  }
  if (dom.metricCreditDisbursed)
    dom.metricCreditDisbursed.textContent = compactCurrency(
      state.metrics.creditDisbursed,
    );
  if (dom.metricInterestReceivable)
    dom.metricInterestReceivable.textContent = compactCurrency(
      state.metrics.interestReceivable,
    );
  if (dom.metricCreditApproved)
    dom.metricCreditApproved.textContent =
      state.metrics.creditApproved.toLocaleString("es-EC");
  if (dom.metricCreditRejected)
    dom.metricCreditRejected.textContent =
      state.metrics.creditRejected.toLocaleString("es-EC");
  if (dom.metricDeposits)
    dom.metricDeposits.textContent = compactCurrency(
      state.metrics.depositTotal,
    );
  if (dom.metricWithdrawals)
    dom.metricWithdrawals.textContent = compactCurrency(
      state.metrics.withdrawalTotal,
    );
  if (dom.metricDelayed)
    dom.metricDelayed.textContent =
      state.metrics.delayedEvents.toLocaleString("es-EC");
  if (dom.metricAngry)
    dom.metricAngry.textContent =
      state.metrics.angryUsers.toLocaleString("es-EC");
  if (dom.metricAbandoned)
    dom.metricAbandoned.textContent =
      state.metrics.abandonedUsers.toLocaleString("es-EC");
  if (dom.metricCashDesk)
    dom.metricCashDesk.textContent = compactCurrency(state.financial.cashDesk);
  if (dom.metricVaultCash)
    dom.metricVaultCash.textContent = compactCurrency(
      state.financial.vaultCash,
    );
  if (dom.metricClientDeposits)
    dom.metricClientDeposits.textContent = compactCurrency(
      state.financial.clientDeposits,
    );
  if (dom.metricLoanPortfolio)
    dom.metricLoanPortfolio.textContent = compactCurrency(
      state.financial.loanPortfolio,
    );
  if (dom.metricOverduePortfolio)
    dom.metricOverduePortfolio.textContent = compactCurrency(
      state.financial.overduePortfolio,
    );
  if (dom.metricRecovered)
    dom.metricRecovered.textContent = compactCurrency(
      state.financial.recoveredTotal,
    );
  if (dom.metricCommissionIncome)
    dom.metricCommissionIncome.textContent = compactCurrency(
      state.financial.commissionIncome,
    );
  if (dom.metricStaffCost)
    dom.metricStaffCost.textContent = compactCurrency(
      state.financial.staffCost,
    );
  if (dom.metricEquity)
    dom.metricEquity.textContent = compactCurrency(estimatedEquity());
  const satisfaction = state.metrics.satisfactionSamples
    ? state.metrics.satisfactionTotal / state.metrics.satisfactionSamples
    : 0;
  const nps = state.metrics.satisfactionSamples
    ? ((state.metrics.promoters - state.metrics.detractors) /
        state.metrics.satisfactionSamples) *
      100
    : 0;
  const utilization = state.metrics.staffCapacityMinutes
    ? (state.metrics.staffBusyMinutes / state.metrics.staffCapacityMinutes) *
      100
    : 0;
  if (dom.metricSatisfaction)
    dom.metricSatisfaction.textContent = satisfaction
      ? formatNumber(satisfaction, 1) + "/5"
      : "—";
  if (dom.metricNps)
    dom.metricNps.textContent = state.metrics.satisfactionSamples
      ? formatNumber(nps, 0)
      : "—";
  if (dom.metricUtilization)
    dom.metricUtilization.textContent = formatNumber(utilization, 0) + "%";
  if (dom.metricComplianceFlags)
    dom.metricComplianceFlags.textContent =
      state.metrics.complianceFlags.toLocaleString("es-EC");
  dom.clockStatus.textContent = simulationDateTime() + " h";
  renderDecisionInsights();
}

function renderRecords() {
  dom.recordsCount.textContent = state.records.length.toLocaleString("es-EC");
  dom.recordsList.innerHTML = "";
  if (state.records.length === 0) {
    dom.recordsList.innerHTML = `<div class="record-item"><strong>Sin registros</strong><span>Los trámites finalizados aparecerán aquí.</span></div>`;
    return;
  }
  state.records.slice(0, 8).forEach((record) => {
    const item = document.createElement("div");
    item.className = "record-item";
    item.innerHTML = `
          <strong>${escapeHtml(record.personId)} · ${escapeHtml(record.finalStatus)}</strong>
          <span><b>Usuario:</b> ${escapeHtml(record.personType)} · ${escapeHtml(record.priorityLevel || "Regular")} · ${escapeHtml(record.serviceChannel || "Presencial")}</span>
          <span><b>Cita:</b> ${escapeHtml(record.hasAppointment || "No")} · <b>Satisfacción:</b> ${formatNumber(record.satisfactionScore || 0, 1)}/5 (${escapeHtml(record.satisfactionCategory || "—")})</span>
          <span><b>Trámite:</b> ${escapeHtml(record.transactionLabel || "No especificado")}</span>
          <span><b>Monto USD:</b> ${escapeHtml(formatCurrency(record.amountUsd || 0))}</span>
          ${record.creditTypeLabel ? `<span><b>Tipo de crédito:</b> ${escapeHtml(record.creditTypeLabel)}</span>` : ""}
          <span><b>Entrada:</b> ${escapeHtml(record.startDateTime || (record.startDate || "") + " " + record.startClock)}</span>
          <span><b>Salida:</b> ${escapeHtml(record.endDateTime || (record.endDate || "") + " " + record.endClock)}</span>
          <span><b>Espera / atención:</b> ${formatNumber(record.waitingMinutes || 0, 1)} min / ${formatNumber(record.serviceMinutes || 0, 1)} min · <b>Demoras:</b> ${record.delayEvents || 0}</span>
          <span><b>Estado emocional:</b> ${escapeHtml(record.mood || "Tranquilo")}</span>
          ${record.creditOutcome ? `<span><b>Resultado de crédito:</b> ${record.creditOutcome === "approved" ? "Aprobado" : "Rechazado"}</span>` : ""}
          ${record.creditReason ? `<span><b>Motivo:</b> ${escapeHtml(record.creditReason)}</span>` : ""}
          ${record.operationReason && !record.creditReason ? `<span><b>Resultado:</b> ${escapeHtml(record.operationReason)}</span>` : ""}
          ${record.monthlyIncome !== "" ? `<span><b>Ingreso / deuda:</b> ${formatCurrency(record.monthlyIncome)} / ${formatCurrency(record.currentMonthlyDebt)}</span>` : ""}
          ${record.creditOutcome === "approved" ? `<span><b>Tasa / plazo:</b> ${formatNumber(record.creditAnnualInterestRate, 1)}% anual · ${record.creditTermMonths} meses</span><span><b>Cuota / interés:</b> ${formatCurrency(record.creditMonthlyPayment)} / ${formatCurrency(record.creditTotalInterest)}</span>` : ""}
          ${record.capitalAfter !== "" ? `<span><b>Efecto en capital:</b> ${record.capitalEffect >= 0 ? "+" : ""}${formatCurrency(record.capitalEffect)} · saldo ${formatCurrency(record.capitalAfter)}</span>` : ""}
          ${record.transferDirection ? `<span><b>Dirección:</b> ${record.transferDirection === "incoming" ? "Entrante" : "Saliente"}</span>` : ""}
          <span><b>Ruta:</b> ${escapeHtml(record.route)}</span>
          <span><b>Horario:</b> ${escapeHtml(record.startClock || simulationClock(record.startTime))} → ${escapeHtml(record.endClock || simulationClock(record.endTime))} · ${formatNumber(record.durationMinutes ?? record.endTime - record.startTime, 1)} min</span>
        `;
    dom.recordsList.appendChild(item);
  });
}

function updateModelStatus() {
  dom.statusSelection.textContent =
    state.nodes.length + " bloques · " + state.edges.length + " conexiones";
}

function updateEmptyState() {
  dom.emptyState.classList.toggle("hidden", state.nodes.length > 0);
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function downloadText(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function saveModel() {
  const payload = {
    version: 13,
    savedAt: new Date().toISOString(),
    scenario: state.scenario,
    financial: state.financial,
    scenarioSnapshots: state.scenarioSnapshots,
    nodes: state.nodes,
    edges: state.edges,
  };
  const saved = safeStorage.set(
    "simuladorBancarioNeodatV13",
    JSON.stringify(payload),
  );
  if (saved) {
    showToast("Modelo guardado en este navegador.");
    updateStatus("Modelo guardado.");
    return;
  }
  downloadJson(payload, "modelo-simulacion-tramites-respaldo.json");
  showToast(
    "El navegador bloqueó el almacenamiento. Se descargó un respaldo JSON.",
    "warning",
  );
  updateStatus("Respaldo JSON generado.");
}

function exportModel() {
  const payload = {
    version: 13,
    exportedAt: new Date().toISOString(),
    scenario: state.scenario,
    financial: state.financial,
    scenarioSnapshots: state.scenarioSnapshots,
    nodes: state.nodes,
    edges: state.edges,
  };
  downloadJson(payload, "modelo-simulacion-tramites.json");
  showToast("Modelo exportado.");
}

function exportRecords() {
  if (state.records.length === 0) {
    showToast("No existen registros para exportar.", "warning");
    return;
  }
  const rows = [
    [
      "persona",
      "tipo_usuario",
      "con_cita",
      "prioridad",
      "canal",
      "revision_cumplimiento",
      "satisfaccion_1_5",
      "categoria_nps",
      "tramite_financiero",
      "codigo_tramite",
      "monto_usd",
      "tipo_credito",
      "fecha_ingreso",
      "hora_ingreso",
      "fecha_salida",
      "hora_salida",
      "duracion_minutos",
      "espera_minutos",
      "eventos_demora",
      "atencion_minutos",
      "estado_emocional",
      "estado_final",
      "resultado_credito",
      "motivo_credito",
      "ingreso_mensual_usd",
      "deuda_mensual_usd",
      "antiguedad_laboral_meses",
      "documentos_completos",
      "historial_crediticio",
      "tasa_interes_anual_pct",
      "plazo_meses",
      "cuota_mensual_usd",
      "interes_total_usd",
      "total_pagar_usd",
      "resultado_operacion",
      "motivo_operacion",
      "direccion_transferencia",
      "efecto_capital_usd",
      "capital_antes_usd",
      "capital_despues_usd",
      "movimiento_capital",
      "areas_visitadas",
      "ruta",
      "detalle_etapas",
    ],
  ];
  state.records.forEach((record) => {
    rows.push([
      record.personId,
      record.personType,
      record.hasAppointment || "No",
      record.priorityLevel || "Regular",
      record.serviceChannel || "Presencial",
      record.complianceFlag || "No",
      Number(record.satisfactionScore || 0).toFixed(1),
      record.satisfactionCategory || "",
      record.transactionLabel || "No especificado",
      record.transactionCode || "",
      Number(record.amountUsd || 0).toFixed(2),
      record.creditTypeLabel || "",
      record.startDate || formatDateIso(simulationDate(record.startTime)),
      record.startClock || simulationClock(record.startTime),
      record.endDate || formatDateIso(simulationDate(record.endTime)),
      record.endClock || simulationClock(record.endTime),
      Number(record.durationMinutes || 0).toFixed(1),
      Number(record.waitingMinutes || 0).toFixed(1),
      record.delayEvents || 0,
      Number(record.serviceMinutes || 0).toFixed(1),
      record.mood || "Tranquilo",
      record.finalStatus,
      record.creditOutcome === "approved"
        ? "Aprobado"
        : record.creditOutcome === "rejected"
          ? "Rechazado"
          : "",
      record.creditReason || "",
      record.monthlyIncome,
      record.currentMonthlyDebt,
      record.employmentMonths,
      record.documentsComplete,
      record.creditHistory,
      Number(record.creditAnnualInterestRate || 0).toFixed(2),
      record.creditTermMonths || "",
      Number(record.creditMonthlyPayment || 0).toFixed(2),
      Number(record.creditTotalInterest || 0).toFixed(2),
      Number(record.creditTotalPayable || 0).toFixed(2),
      record.operationOutcome || "",
      record.operationReason || "",
      record.transferDirection || "",
      Number(record.capitalEffect || 0).toFixed(2),
      record.capitalBefore === ""
        ? ""
        : Number(record.capitalBefore || 0).toFixed(2),
      record.capitalAfter === ""
        ? ""
        : Number(record.capitalAfter || 0).toFixed(2),
      record.capitalMovement || "",
      record.areasVisited || 0,
      record.route,
      JSON.stringify(record.timeline || []),
    ]);
  });
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  downloadText(csv, "registros-simulacion.csv", "text/csv;charset=utf-8");
  showToast(
    `${state.records.length.toLocaleString("es-EC")} registros exportados.`,
  );
}

function importModel(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result));
      applyModel(payload);
      showToast("Modelo importado correctamente.");
    } catch (error) {
      showToast("El archivo JSON no es válido.", "error");
    }
  };
  reader.readAsText(file);
}

function upgradeDirectCashierRouting(payload) {
  const upgraded = clone(payload);
  const nodes = Array.isArray(upgraded.nodes) ? upgraded.nodes : [];
  let edges = Array.isArray(upgraded.edges) ? upgraded.edges : [];
  const nodeIds = new Set(nodes.map((node) => node.id));
  const hasDefaultFlow = [
    "source-entry",
    "queue-reception",
    "process-reception",
    "decision-flow",
    "process-cashier",
    "sink-success",
  ].every((id) => nodeIds.has(id));

  if (!hasDefaultFlow || nodeIds.has("decision-entry")) {
    return upgraded;
  }

  nodes.push({
    id: "decision-entry",
    type: "decision",
    name: "Clasificación inicial",
    x: 320,
    y: 320,
    props: {
      department: "Ingreso",
      procedure: "Derivación directa a Caja o Recepción",
      routingMode: "transaction",
      color: "#8b6df6",
    },
  });

  const positions = {
    "source-entry": [70, 320],
    "queue-reception": [570, 320],
    "process-reception": [820, 320],
    "decision-flow": [1070, 320],
    "process-credit": [1330, 110],
    "process-service": [1330, 310],
    "process-banking-services": [1330, 510],
    "process-cashier": [570, 600],
    "process-archive": [1550, 310],
    "sink-success": [1710, 310],
    "sink-exit": [1330, 730],
  };

  nodes.forEach((node) => {
    if (positions[node.id]) {
      node.x = positions[node.id][0];
      node.y = positions[node.id][1];
    }
  });

  edges = edges.filter(
    (edge) =>
      !(
        (edge.from === "source-entry" && edge.to === "queue-reception") ||
        (edge.from === "decision-flow" && edge.to === "process-cashier") ||
        (edge.from === "process-cashier" && edge.to === "process-archive")
      ),
  );

  edges.push(
    {
      id: "e-entry",
      from: "source-entry",
      to: "decision-entry",
      weight: 1,
      transactionTypes: [],
    },
    {
      id: "e-entry-cash-queue",
      from: "decision-entry",
      to: "queue-cashier",
      weight: 8,
      transactionTypes: ["deposit", "withdrawal", "transfer", "payment"],
    },
    {
      id: "e-cash-queue-service",
      from: "queue-cashier",
      to: "process-cashier",
      weight: 1,
    },
    {
      id: "e-entry-reception",
      from: "decision-entry",
      to: "queue-reception",
      weight: 2,
      transactionTypes: [
        "credit",
        "inquiry",
        "account",
        "card",
        "insurance",
        "investment",
      ],
    },
    {
      id: "e-cash-finish",
      from: "process-cashier",
      to: "sink-success",
      weight: 1,
      transactionTypes: [],
    },
  );

  upgraded.nodes = nodes;
  upgraded.edges = edges;
  upgraded.version = Math.max(14, Number(upgraded.version) || 0);
  return upgraded;
}

function upgradeRealisticCashierFlow(payload) {
  const upgraded = clone(payload);
  const nodes = Array.isArray(upgraded.nodes) ? upgraded.nodes : [];
  let edges = Array.isArray(upgraded.edges) ? upgraded.edges : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const source = nodeById.get("source-entry");
  const entryDecision = nodeById.get("decision-entry");
  const cashier = nodeById.get("process-cashier");
  const receptionQueue = nodeById.get("queue-reception");

  const oldDefaultWeights = {
    credit: 12,
    deposit: 24,
    withdrawal: 20,
    transfer: 12,
    payment: 15,
    inquiry: 10,
    account: 3,
    card: 2,
    insurance: 1,
    investment: 1,
  };
  const realisticWeights = {
    credit: 7,
    deposit: 28,
    withdrawal: 23,
    transfer: 10,
    payment: 18,
    inquiry: 8,
    account: 2,
    card: 2,
    insurance: 1,
    investment: 1,
  };

  if (source) {
    source.props = source.props || {};
    const current = source.props.transactionWeights || {};
    const usesOldDefaults = Object.keys(oldDefaultWeights).every(
      (key) =>
        Number(current[key] ?? oldDefaultWeights[key]) ===
        oldDefaultWeights[key],
    );
    if (!source.props.transactionWeights || usesOldDefaults) {
      source.props.transactionWeights = clone(realisticWeights);
    }
  }

  if (!entryDecision || !cashier || !receptionQueue) {
    upgraded.nodes = nodes;
    upgraded.edges = edges;
    return upgraded;
  }

  entryDecision.props = entryDecision.props || {};
  entryDecision.props.routingMode = "transaction";
  entryDecision.props.procedure =
    "Derivación directa: operaciones de caja o atención especializada";

  let cashierQueue = nodeById.get("queue-cashier");
  if (!cashierQueue) {
    cashierQueue = {
      id: "queue-cashier",
      type: "queue",
      name: "Espera Caja",
      x: 570,
      y: 620,
      props: {
        capacity: 50,
        department: "Caja",
        procedure: "Fila para depósitos, retiros, pagos y transferencias",
        targetWaitMinutes: 4,
        angerAfterMinutes: 10,
        abandonAfterMinutes: 30,
        abandonProbability: 20,
        color: "#f2a93b",
      },
    };
    nodes.push(cashierQueue);
    nodeById.set(cashierQueue.id, cashierQueue);
  } else {
    cashierQueue.name = cashierQueue.name || "Espera Caja";
    cashierQueue.props = {
      capacity: 50,
      department: "Caja",
      procedure: "Fila para depósitos, retiros, pagos y transferencias",
      targetWaitMinutes: 4,
      angerAfterMinutes: 10,
      abandonAfterMinutes: 30,
      abandonProbability: 20,
      color: "#f2a93b",
      ...(cashierQueue.props || {}),
    };
  }

  cashierQueue.x = 570;
  cashierQueue.y = 620;
  cashier.x = 820;
  cashier.y = 620;
  cashier.props = cashier.props || {};
  cashier.props.department = cashier.props.department || "Tesorería";
  cashier.props.procedure = "Depósitos, retiros, pagos y transferencias";
  cashier.props.processRole = "transaction_processing";
  if (Number(cashier.props.capacity) === 2) cashier.props.capacity = 4;
  if (Number(cashier.props.serviceTime) === 4) cashier.props.serviceTime = 3;

  edges = edges.filter(
    (edge) =>
      !(
        (edge.from === "decision-entry" &&
          (edge.to === "process-cashier" || edge.to === "queue-cashier")) ||
        (edge.from === "queue-cashier" && edge.to === "process-cashier")
      ),
  );

  const receptionEdge = edges.find(
    (edge) => edge.from === "decision-entry" && edge.to === "queue-reception",
  );
  if (receptionEdge) {
    receptionEdge.weight = 2;
    receptionEdge.transactionTypes = [
      "credit",
      "inquiry",
      "account",
      "card",
      "insurance",
      "investment",
    ];
  } else {
    edges.push({
      id: "e-entry-reception",
      from: "decision-entry",
      to: "queue-reception",
      weight: 2,
      transactionTypes: [
        "credit",
        "inquiry",
        "account",
        "card",
        "insurance",
        "investment",
      ],
    });
  }

  edges.push(
    {
      id: "e-entry-cash-queue",
      from: "decision-entry",
      to: "queue-cashier",
      weight: 8,
      transactionTypes: ["deposit", "withdrawal", "transfer", "payment"],
    },
    {
      id: "e-cash-queue-service",
      from: "queue-cashier",
      to: "process-cashier",
      weight: 1,
      transactionTypes: [],
    },
  );

  upgraded.nodes = nodes;
  upgraded.edges = edges;
  upgraded.version = Math.max(16, Number(upgraded.version) || 0);
  return upgraded;
}

function upgradeNormalDollarRanges(payload) {
  const upgraded = clone(payload);
  if (Array.isArray(upgraded.nodes)) {
    upgraded.nodes.forEach((node) => {
      if (node.type !== "source") return;
      node.props = { ...clone(NODE_TYPES.source.props), ...(node.props || {}) };
      sanitizeSourceAmountConfiguration(node);
    });
  }
  upgraded.version = Math.max(17, Number(upgraded.version) || 0);
  return upgraded;
}

function applyModel(payload) {
  if (
    !payload ||
    !Array.isArray(payload.nodes) ||
    !Array.isArray(payload.edges)
  )
    throw new Error("Formato inválido.");
  payload = upgradeDirectCashierRouting(payload);
  payload = upgradeRealisticCashierFlow(payload);
  payload = upgradeNormalDollarRanges(payload);
  stopSimulation(false, false);
  state.scenario = {
    businessName: String(
      payload.scenario?.businessName || "Entidad financiera",
    ),
    initialCapital: Math.max(
      0,
      Number(payload.scenario?.initialCapital ?? 1000000) || 0,
    ),
    currentCapital: Math.max(
      0,
      Number(payload.scenario?.initialCapital ?? 1000000) || 0,
    ),
    startDate: String(
      payload.scenario?.startDate || new Date().toISOString().slice(0, 10),
    ),
    endDate: String(
      payload.scenario?.endDate ||
        calculateEndDate(
          String(
            payload.scenario?.startDate ||
              new Date().toISOString().slice(0, 10),
          ),
          payload.scenario?.simulationUnit === "months" ? "months" : "days",
          clamp(
            Math.floor(Number(payload.scenario?.simulationLength) || 1),
            1,
            365,
          ),
        ),
    ),
    simulationUnit:
      payload.scenario?.simulationUnit === "months" ? "months" : "days",
    simulationLength: clamp(
      Math.floor(Number(payload.scenario?.simulationLength) || 1),
      1,
      365,
    ),
    operatingDays: Array.isArray(payload.scenario?.operatingDays)
      ? payload.scenario.operatingDays
      : [0, 1, 2, 3, 4, 5, 6],
    openingTime: String(payload.scenario?.openingTime || "08:00"),
    closingTime: String(payload.scenario?.closingTime || "19:00"),
    minimumReserve: Math.max(
      0,
      Number(payload.scenario?.minimumReserve ?? 250000) || 0,
    ),
    initialVaultCash: Math.max(
      0,
      Number(payload.scenario?.initialVaultCash ?? 300000) || 0,
    ),
    initialCashDesk: Math.max(
      0,
      Number(payload.scenario?.initialCashDesk ?? 100000) || 0,
    ),
    commissionRate: clamp(
      Number(payload.scenario?.commissionRate ?? 1.5),
      0,
      100,
    ),
    monthlyDefaultRate: clamp(
      Number(payload.scenario?.monthlyDefaultRate ?? 8),
      0,
      100,
    ),
    recoveryRate: clamp(Number(payload.scenario?.recoveryRate ?? 45), 0, 100),
    appointmentRate: clamp(
      Number(payload.scenario?.appointmentRate ?? 25),
      0,
      100,
    ),
    priorityRate: clamp(Number(payload.scenario?.priorityRate ?? 10), 0, 100),
    digitalShare: clamp(Number(payload.scenario?.digitalShare ?? 20), 0, 100),
    dailyOutageRate: clamp(
      Number(payload.scenario?.dailyOutageRate ?? 3),
      0,
      100,
    ),
    outageMinutes: clamp(Number(payload.scenario?.outageMinutes ?? 20), 1, 240),
    amlThreshold: Math.max(
      0,
      Number(payload.scenario?.amlThreshold ?? 10000) || 0,
    ),
  };
  state.scenarioSnapshots = Array.isArray(payload.scenarioSnapshots)
    ? payload.scenarioSnapshots.slice(0, 8)
    : state.scenarioSnapshots;
  state.nodes = payload.nodes
    .filter((node) => NODE_TYPES[node.type])
    .map((node) => ({
      id: node.id || uid("node"),
      type: node.type,
      name: node.name || NODE_TYPES[node.type].defaultName,
      x: clamp(Number(node.x) || 0, 0, 2400 - 188),
      y: clamp(Number(node.y) || 0, 0, 1400 - 108),
      props: { ...clone(NODE_TYPES[node.type].props), ...(node.props || {}) },
    }));

  state.nodes.forEach((node) => {
    if (node.type === "source") sanitizeSourceAmountConfiguration(node);
  });

  const validNodeIds = new Set(state.nodes.map((node) => node.id));
  state.edges = payload.edges
    .filter((edge) => validNodeIds.has(edge.from) && validNodeIds.has(edge.to))
    .map((edge) => ({
      id: edge.id || uid("edge"),
      from: edge.from,
      to: edge.to,
      weight: Math.max(0, Number(edge.weight) || 0),
      transactionTypes: Array.isArray(edge.transactionTypes)
        ? edge.transactionTypes.filter((type) => TRANSACTION_TYPES[type])
        : [],
      creditOutcomes: Array.isArray(edge.creditOutcomes)
        ? edge.creditOutcomes.filter(
            (value) => value === "approved" || value === "rejected",
          )
        : [],
    }));

  state.selected = null;
  state.connectionOrigin = null;
  initializeRuntime();
  updateScenarioUi();
  fitView();
  updateStatus("Modelo cargado.");
}

function loadExampleModel(showNotification = true) {
  const example = {
    version: 16,
    scenario: {
      businessName: "Entidad financiera",
      initialCapital: 1000000,
      currentCapital: 1000000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: calculateEndDate(
        new Date().toISOString().slice(0, 10),
        "days",
        5,
      ),
      simulationUnit: "days",
      simulationLength: 5,
      operatingDays: [0, 1, 2, 3, 4, 5, 6],
      openingTime: "08:00",
      closingTime: "19:00",
      minimumReserve: 250000,
      initialVaultCash: 300000,
      initialCashDesk: 100000,
      commissionRate: 1.5,
      monthlyDefaultRate: 8,
      recoveryRate: 45,
      appointmentRate: 25,
      priorityRate: 10,
      digitalShare: 20,
      dailyOutageRate: 3,
      outageMinutes: 20,
      amlThreshold: 10000,
    },
    nodes: [
      {
        id: "source-entry",
        type: "source",
        name: "Ingreso principal",
        x: 70,
        y: 320,
        props: {
          interval: 4,
          startAt: 0,
          maxEntities: 0,
          personType: "Cliente",
          transactionMode: "mixed",
          transactionType: "credit",
          amountMode: "automatic",
          amountFixed: 200,
          amountMin: 20,
          amountMax: 2000,
          transactionWeights: {
            credit: 7,
            deposit: 28,
            withdrawal: 23,
            transfer: 10,
            payment: 18,
            inquiry: 8,
            account: 2,
            card: 2,
            insurance: 1,
            investment: 1,
          },
          creditTypeWeights: {
            housing: 18,
            vehicle: 22,
            consumer: 35,
            business: 15,
            education: 10,
          },
        },
      },
      {
        id: "decision-entry",
        type: "decision",
        name: "Clasificación inicial",
        x: 320,
        y: 320,
        props: {
          department: "Ingreso",
          procedure:
            "Derivación directa: operaciones de caja o atención especializada",
          routingMode: "transaction",
          color: "#8b6df6",
        },
      },
      {
        id: "queue-reception",
        type: "queue",
        name: "Espera recepción",
        x: 570,
        y: 320,
        props: {
          capacity: 30,
          department: "Recepción",
          procedure: "Fila inicial",
          targetWaitMinutes: 5,
          angerAfterMinutes: 8,
          abandonAfterMinutes: 25,
          abandonProbability: 25,
        },
      },
      {
        id: "process-reception",
        type: "process",
        name: "Recepción",
        x: 820,
        y: 320,
        props: {
          serviceTime: 5,
          capacity: 1,
          department: "Atención al usuario",
          procedure: "Registro y orientación",
          observations: "Punto de entrada",
          targetWaitMinutes: 5,
          angerAfterMinutes: 8,
          abandonAfterMinutes: 25,
          abandonProbability: 25,
        },
      },
      {
        id: "decision-flow",
        type: "decision",
        name: "Derivación de trámite",
        x: 1070,
        y: 320,
        props: {
          department: "Flujo",
          procedure: "Asignar siguiente área",
          routingMode: "transaction",
        },
      },
      {
        id: "process-credit",
        type: "process",
        name: "Crédito",
        x: 1330,
        y: 110,
        props: {
          serviceTime: 8,
          capacity: 2,
          department: "Departamento de crédito",
          procedure: "Evaluación de solicitud",
          observations: "",
          processRole: "credit_evaluation",
          creditApprovalRate: 75,
          creditMinIncome: 600,
          creditMaxDebtRatio: 40,
          creditMinEmploymentMonths: 6,
          creditMaxIncomeMultiple: 12,
          creditAnnualInterestRate: 14,
          creditTermMonths: 24,
          creditRates: {
            housing: 9.5,
            vehicle: 13.5,
            consumer: 16.5,
            business: 15,
            education: 11.5,
          },
          creditTerms: {
            housing: 180,
            vehicle: 60,
            consumer: 36,
            business: 48,
            education: 60,
          },
          targetWaitMinutes: 5,
          angerAfterMinutes: 12,
          abandonAfterMinutes: 35,
          abandonProbability: 25,
        },
      },
      {
        id: "process-service",
        type: "process",
        name: "Servicio al cliente",
        x: 1330,
        y: 310,
        props: {
          serviceTime: 6,
          capacity: 3,
          department: "Servicio al cliente",
          procedure: "Consulta y actualización",
          observations: "",
          processRole: "transaction_processing",
        },
      },
      {
        id: "queue-cashier",
        type: "queue",
        name: "Espera Caja",
        x: 570,
        y: 620,
        props: {
          capacity: 50,
          department: "Caja",
          procedure: "Fila para depósitos, retiros, pagos y transferencias",
          targetWaitMinutes: 4,
          angerAfterMinutes: 10,
          abandonAfterMinutes: 30,
          abandonProbability: 20,
          color: "#f2a93b",
        },
      },
      {
        id: "process-cashier",
        type: "process",
        name: "Caja",
        x: 820,
        y: 620,
        props: {
          serviceTime: 3,
          capacity: 4,
          department: "Tesorería",
          procedure: "Depósitos, retiros, pagos y transferencias",
          observations: "",
          processRole: "transaction_processing",
        },
      },
      {
        id: "process-banking-services",
        type: "process",
        name: "Servicios bancarios",
        x: 1330,
        y: 510,
        props: {
          serviceTime: 7,
          capacity: 2,
          department: "Servicios bancarios",
          procedure: "Cuentas, tarjetas, seguros e inversiones",
          observations: "Área especializada",
          processRole: "banking_services",
          targetWaitMinutes: 5,
          angerAfterMinutes: 12,
          abandonAfterMinutes: 35,
          abandonProbability: 25,
          color: "#2563eb",
        },
      },
      {
        id: "process-archive",
        type: "process",
        name: "Archivo",
        x: 1550,
        y: 310,
        props: {
          serviceTime: 3,
          capacity: 1,
          department: "Archivo",
          procedure: "Cierre y resguardo",
          observations: "",
        },
      },
      {
        id: "sink-success",
        type: "sink",
        name: "Trámite completado",
        x: 1710,
        y: 310,
        props: {
          finalStatus: "Completado",
          department: "Cierre",
          procedure: "Registro final",
        },
      },
      {
        id: "sink-exit",
        type: "sink",
        name: "Crédito rechazado / salida alterna",
        x: 1330,
        y: 730,
        props: {
          finalStatus: "No completado",
          department: "Cierre",
          procedure: "Crédito rechazado o trámite no concluido",
        },
      },
    ],
    edges: [
      { id: "e-entry", from: "source-entry", to: "decision-entry", weight: 1 },
      {
        id: "e-entry-cash",
        from: "decision-entry",
        to: "process-cashier",
        weight: 3,
        transactionTypes: ["deposit", "withdrawal", "payment"],
      },
      {
        id: "e-entry-reception",
        from: "decision-entry",
        to: "queue-reception",
        weight: 7,
        transactionTypes: [
          "credit",
          "transfer",
          "inquiry",
          "account",
          "card",
          "insurance",
          "investment",
        ],
      },
      { id: "e2", from: "queue-reception", to: "process-reception", weight: 1 },
      { id: "e3", from: "process-reception", to: "decision-flow", weight: 1 },
      {
        id: "e4",
        from: "decision-flow",
        to: "process-credit",
        weight: 4,
        transactionTypes: ["credit"],
      },
      {
        id: "e5",
        from: "decision-flow",
        to: "process-service",
        weight: 3,
        transactionTypes: ["inquiry"],
      },
      {
        id: "e6s",
        from: "decision-flow",
        to: "process-banking-services",
        weight: 2,
        transactionTypes: ["account", "card", "insurance", "investment"],
      },
      {
        id: "e7",
        from: "decision-flow",
        to: "sink-exit",
        weight: 1,
        transactionTypes: [],
      },
      {
        id: "e8",
        from: "process-credit",
        to: "process-archive",
        weight: 1,
        creditOutcomes: ["approved"],
      },
      {
        id: "e8r",
        from: "process-credit",
        to: "sink-exit",
        weight: 1,
        creditOutcomes: ["rejected"],
      },
      { id: "e9", from: "process-service", to: "process-archive", weight: 1 },
      { id: "e10", from: "process-cashier", to: "sink-success", weight: 1 },
      {
        id: "e10s",
        from: "process-banking-services",
        to: "process-archive",
        weight: 1,
      },
      { id: "e11", from: "process-archive", to: "sink-success", weight: 1 },
    ],
  };
  applyModel(example);
  if (showNotification) showToast("Modelo de ejemplo cargado.");
}

function clearModel() {
  stopSimulation(false, false);
  state.nodes = [];
  state.edges = [];
  state.selected = null;
  state.connectionOrigin = null;
  initializeRuntime();
  updateStatus("Lienzo vacío.");
  showToast("Modelo eliminado del lienzo.");
}

function setZoom(value) {
  const minimumZoom = 0.1;
  state.zoom = clamp(value, minimumZoom, 1.6);
  dom.canvas.style.transform = `scale(${state.zoom})`;
  dom.canvasWrap.firstElementChild.style.marginRight =
    (state.zoom - 1) * 2400 + "px";
  dom.canvasWrap.firstElementChild.style.marginBottom =
    (state.zoom - 1) * 1400 + "px";
  dom.zoomLabel.textContent = Math.round(state.zoom * 100) + "%";
}

function fitView() {
  const availableWidth = dom.canvasWrap.clientWidth - 40;
  const availableHeight = dom.canvasWrap.clientHeight - 40;
  if (state.nodes.length === 0) {
    setZoom(Math.min(1, availableWidth / 1200, availableHeight / 700));
    dom.canvasWrap.scrollTo({ left: 0, top: 0 });
    return;
  }
  const minX = Math.min(...state.nodes.map((node) => node.x));
  const minY = Math.min(...state.nodes.map((node) => node.y));
  const maxX = Math.max(...state.nodes.map((node) => node.x + 188));
  const maxY = Math.max(...state.nodes.map((node) => node.y + 108));
  const modelWidth = Math.max(420, maxX - minX + 160);
  const modelHeight = Math.max(260, maxY - minY + 160);
  const effectiveWidth = document.body.classList.contains("force-landscape")
    ? window.innerHeight
    : window.innerWidth;
  const readableZoom =
    effectiveWidth <= 700 ? 0.58 : effectiveWidth <= 1100 ? 0.66 : 0.74;
  const zoom = Math.max(
    readableZoom,
    Math.min(1.2, availableWidth / modelWidth, availableHeight / modelHeight),
  );
  setZoom(zoom);
  window.requestAnimationFrame(() => {
    dom.canvasWrap.scrollTo({
      left: Math.max(0, (minX - 80) * state.zoom),
      top: Math.max(0, (minY - 80) * state.zoom),
      behavior: "smooth",
    });
  });
}

dom.businessNameInput?.addEventListener("input", (event) => {
  state.scenario.businessName = event.target.value || "Entidad financiera";
  updateScenarioUi();
});

dom.initialCapitalInput?.addEventListener("change", (event) => {
  if (state.running) {
    showToast(
      "Detenga la simulación antes de cambiar el capital inicial.",
      "warning",
    );
    event.target.value = String(state.scenario.initialCapital);
    return;
  }
  state.scenario.initialCapital = Math.max(0, Number(event.target.value) || 0);
  state.scenario.currentCapital = state.scenario.initialCapital;
  updateScenarioUi();
  updateMetrics();
});

dom.openingTimeInput?.addEventListener("change", (event) => {
  const value = event.target.value;
  if (
    timeStringToMinutes(value) >=
    timeStringToMinutes(state.scenario.closingTime)
  ) {
    showToast(
      "La hora de entrada debe ser anterior a la hora de finalización.",
      "warning",
    );
    updateScenarioUi();
    return;
  }
  state.scenario.openingTime = value;
  updateScenarioUi();
  updateMetrics();
});

dom.closingTimeInput?.addEventListener("change", (event) => {
  const value = event.target.value;
  if (
    timeStringToMinutes(value) <=
    timeStringToMinutes(state.scenario.openingTime)
  ) {
    showToast(
      "La hora de finalización debe ser posterior a la hora de entrada.",
      "warning",
    );
    updateScenarioUi();
    return;
  }
  state.scenario.closingTime = value;
  updateScenarioUi();
  updateMetrics();
});

dom.simulationStartDateInput?.addEventListener("change", (event) => {
  if (state.running) {
    showToast("Detenga la simulación antes de cambiar la fecha.", "warning");
    updateScenarioUi();
    return;
  }
  state.scenario.startDate =
    event.target.value || new Date().toISOString().slice(0, 10);
  state.scenario.endDate = calculateEndDate(
    state.scenario.startDate,
    state.scenario.simulationUnit,
    state.scenario.simulationLength,
  );
  updateScenarioUi();
  updateMetrics();
});

dom.simulationEndDateInput?.addEventListener("change", (event) => {
  if (state.running) {
    showToast(
      "Detenga la simulación antes de cambiar la fecha final.",
      "warning",
    );
    updateScenarioUi();
    return;
  }
  const value = event.target.value || state.scenario.startDate;
  if (parseLocalDate(value) < parseLocalDate(state.scenario.startDate)) {
    showToast(
      "La fecha de finalización no puede ser anterior a la fecha de inicio.",
      "warning",
    );
    updateScenarioUi();
    return;
  }
  state.scenario.endDate = value;
  const calendarDays =
    Math.floor(
      (parseLocalDate(value) - parseLocalDate(state.scenario.startDate)) /
        86400000,
    ) + 1;
  state.scenario.simulationUnit = "days";
  state.scenario.simulationLength = clamp(calendarDays, 1, 365);
  updateScenarioUi();
  updateMetrics();
});

dom.simulationUnitInput?.addEventListener("change", (event) => {
  if (state.running) {
    showToast("Detenga la simulación antes de cambiar el periodo.", "warning");
    updateScenarioUi();
    return;
  }
  state.scenario.simulationUnit =
    event.target.value === "months" ? "months" : "days";
  if (
    state.scenario.simulationUnit === "months" &&
    state.scenario.simulationLength > 12
  )
    state.scenario.simulationLength = 1;
  state.scenario.endDate = calculateEndDate(
    state.scenario.startDate,
    state.scenario.simulationUnit,
    state.scenario.simulationLength,
  );
  updateScenarioUi();
  updateMetrics();
});

dom.simulationLengthInput?.addEventListener("change", (event) => {
  if (state.running) {
    showToast("Detenga la simulación antes de cambiar la duración.", "warning");
    updateScenarioUi();
    return;
  }
  const max = state.scenario.simulationUnit === "months" ? 12 : 365;
  state.scenario.simulationLength = clamp(
    Math.floor(Number(event.target.value) || 1),
    1,
    max,
  );
  state.scenario.endDate = calculateEndDate(
    state.scenario.startDate,
    state.scenario.simulationUnit,
    state.scenario.simulationLength,
  );
  updateScenarioUi();
  updateMetrics();
});

dom.weekdaySelector?.addEventListener("change", (event) => {
  const input = event.target.closest('input[type="checkbox"]');
  if (!input) return;
  if (state.running) {
    showToast(
      "Detenga la simulación antes de cambiar los días habilitados.",
      "warning",
    );
    updateScenarioUi();
    return;
  }
  const selected = [
    ...dom.weekdaySelector.querySelectorAll('input[type="checkbox"]:checked'),
  ].map((item) => Number(item.value));
  if (selected.length === 0) {
    input.checked = true;
    showToast("Debe mantener al menos un día habilitado.", "warning");
    return;
  }
  state.scenario.operatingDays = selected;
  updateScenarioUi();
  updateMetrics();
});

document
  .getElementById("addBankingServicesBtn")
  ?.addEventListener("click", () => {
    const node = createNode("process", 1180, 650, {
      name: "Servicios bancarios",
      props: {
        ...clone(NODE_TYPES.process.props),
        department: "Servicios bancarios",
        procedure: "Cuentas, tarjetas, seguros e inversiones",
        processRole: "banking_services",
        serviceTime: 7,
        capacity: 2,
        color: "#2563eb",
      },
    });
    if (node) {
      fitView();
      showToast("Área de servicios bancarios agregada.");
    }
  });

function bindScenarioNumberInput(element, key, options = {}) {
  element?.addEventListener("change", (event) => {
    if (state.running && options.lockDuringRun) {
      showToast(
        "Detenga la simulación antes de cambiar este valor.",
        "warning",
      );
      updateScenarioUi();
      return;
    }
    let value = Number(event.target.value);
    if (!Number.isFinite(value)) value = options.defaultValue ?? 0;
    if (Number.isFinite(options.min)) value = Math.max(options.min, value);
    if (Number.isFinite(options.max)) value = Math.min(options.max, value);
    state.scenario[key] = value;
    if (key === "initialVaultCash" && !state.running)
      state.financial.vaultCash = value;
    if (key === "initialCashDesk" && !state.running)
      state.financial.cashDesk = value;
    updateScenarioUi();
    updateMetrics();
  });
}

bindScenarioNumberInput(dom.minimumReserveInput, "minimumReserve", {
  min: 0,
  defaultValue: 250000,
});
bindScenarioNumberInput(dom.vaultCashInput, "initialVaultCash", {
  min: 0,
  defaultValue: 300000,
  lockDuringRun: true,
});
bindScenarioNumberInput(dom.cashDeskInput, "initialCashDesk", {
  min: 0,
  defaultValue: 100000,
  lockDuringRun: true,
});
bindScenarioNumberInput(dom.commissionRateInput, "commissionRate", {
  min: 0,
  max: 100,
  defaultValue: 1.5,
});
bindScenarioNumberInput(dom.defaultRiskInput, "monthlyDefaultRate", {
  min: 0,
  max: 100,
  defaultValue: 8,
});
bindScenarioNumberInput(dom.recoveryRateInput, "recoveryRate", {
  min: 0,
  max: 100,
  defaultValue: 45,
});
bindScenarioNumberInput(dom.appointmentRateInput, "appointmentRate", {
  min: 0,
  max: 100,
  defaultValue: 25,
});
bindScenarioNumberInput(dom.priorityRateInput, "priorityRate", {
  min: 0,
  max: 100,
  defaultValue: 10,
});
bindScenarioNumberInput(dom.digitalShareInput, "digitalShare", {
  min: 0,
  max: 100,
  defaultValue: 20,
});
bindScenarioNumberInput(dom.outageRateInput, "dailyOutageRate", {
  min: 0,
  max: 100,
  defaultValue: 3,
});
bindScenarioNumberInput(dom.outageMinutesInput, "outageMinutes", {
  min: 1,
  max: 240,
  defaultValue: 20,
});
bindScenarioNumberInput(dom.amlThresholdInput, "amlThreshold", {
  min: 0,
  defaultValue: 10000,
});

document
  .getElementById("saveScenarioSnapshotBtn")
  ?.addEventListener("click", saveScenarioSnapshot);
document
  .getElementById("compareScenariosBtn")
  ?.addEventListener("click", () => {
    renderScenarioComparison();
    dom.comparisonModal?.classList.add("open");
  });
document.getElementById("clearScenariosBtn")?.addEventListener("click", () => {
  state.scenarioSnapshots = [];
  safeStorage.remove("simuladorBancarioNeodatScenariosV13");
  renderSnapshotList();
  showToast("Comparaciones eliminadas.");
});
document
  .getElementById("closeComparisonBtn")
  ?.addEventListener("click", () =>
    dom.comparisonModal?.classList.remove("open"),
  );
dom.comparisonModal?.addEventListener("click", (event) => {
  if (event.target === dom.comparisonModal)
    dom.comparisonModal.classList.remove("open");
});

function addAdvancedArea(role, name, department, procedure, color) {
  const index = state.nodes.filter((node) => node.type === "process").length;
  createNode("process", 1120 + (index % 3) * 230, 120 + (index % 4) * 170, {
    name,
    props: {
      ...clone(NODE_TYPES.process.props),
      processRole: role,
      department,
      procedure,
      color,
    },
  });
  showToast(`${name} agregada. Conéctela al flujo donde corresponda.`);
}

document
  .getElementById("addVaultAreaBtn")
  ?.addEventListener("click", () =>
    addAdvancedArea(
      "vault",
      "Bóveda y caja",
      "Tesorería",
      "Abastecimiento y retiro de efectivo",
      "#0f766e",
    ),
  );
document
  .getElementById("addCollectionsAreaBtn")
  ?.addEventListener("click", () =>
    addAdvancedArea(
      "collections",
      "Cobranza",
      "Recuperación de cartera",
      "Gestión de cuotas vencidas",
      "#b45309",
    ),
  );
document
  .getElementById("addDigitalAreaBtn")
  ?.addEventListener("click", () =>
    addAdvancedArea(
      "digital",
      "Canal digital",
      "Banca digital",
      "Operaciones web y móviles",
      "#2563eb",
    ),
  );
document
  .getElementById("addComplianceAreaBtn")
  ?.addEventListener("click", () =>
    addAdvancedArea(
      "compliance",
      "Cumplimiento",
      "Riesgo y cumplimiento",
      "Revisión de operaciones inusuales",
      "#7c3aed",
    ),
  );

dom.playBtn.addEventListener("click", startSimulation);
document
  .getElementById("quickRunBtn")
  .addEventListener("click", startSimulation);
dom.pauseBtn.addEventListener("click", pauseSimulation);
dom.stopBtn.addEventListener("click", () => stopSimulation(false));
dom.resetBtn.addEventListener("click", resetSimulation);
dom.connectBtn.addEventListener("click", toggleConnectionMode);
dom.deleteBtn.addEventListener("click", deleteSelected);
dom.speedSelect.addEventListener("change", (event) => {
  state.speed = Number(event.target.value) || 1;
  updateStatus("Velocidad ajustada a " + state.speed + "×.");
});

document.getElementById("saveBtn").addEventListener("click", saveModel);
document.getElementById("exportBtn").addEventListener("click", exportModel);
document
  .getElementById("exportRecordsBtn")
  .addEventListener("click", exportRecords);
document.getElementById("mobileSaveBtn")?.addEventListener("click", saveModel);
document
  .getElementById("mobileExportBtn")
  ?.addEventListener("click", exportModel);
document
  .getElementById("mobileRecordsBtn")
  ?.addEventListener("click", exportRecords);
document
  .getElementById("loadExampleBtn")
  .addEventListener("click", loadExampleModel);
document.getElementById("clearModelBtn").addEventListener("click", clearModel);
document.getElementById("importInput").addEventListener("change", (event) => {
  importModel(event.target.files?.[0]);
  event.target.value = "";
});

document
  .getElementById("zoomInBtn")
  .addEventListener("click", () => setZoom(state.zoom + 0.1));
document
  .getElementById("zoomOutBtn")
  .addEventListener("click", () => setZoom(state.zoom - 0.1));
document.getElementById("fitBtn").addEventListener("click", fitView);

const sidebarToggleBtn = document.getElementById("openPaletteBtn");
const propertiesToggleBtn = document.getElementById("openPropertiesBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const closePropertiesBtn = document.getElementById("closePropertiesBtn");

function isDrawerMode() {
  return window.innerWidth <= 1100;
}

function updatePanelBackdrop() {
  const visible =
    isDrawerMode() &&
    (dom.sidebar.classList.contains("open") ||
      dom.properties.classList.contains("open"));
  dom.panelBackdrop?.classList.toggle("visible", visible);
  dom.panelBackdrop?.setAttribute("aria-hidden", String(!visible));
  document.body.style.overflow = visible ? "hidden" : "";
}

function updatePanelToggleState() {
  const sidebarActive = isDrawerMode()
    ? dom.sidebar.classList.contains("open")
    : !dom.app.classList.contains("sidebar-collapsed");
  const propertiesActive = isDrawerMode()
    ? dom.properties.classList.contains("open")
    : !dom.app.classList.contains("properties-collapsed");

  sidebarToggleBtn?.setAttribute("aria-pressed", String(sidebarActive));
  propertiesToggleBtn?.setAttribute("aria-pressed", String(propertiesActive));
  sidebarToggleBtn?.setAttribute(
    "title",
    sidebarActive ? "Ocultar panel izquierdo" : "Mostrar panel izquierdo",
  );
  propertiesToggleBtn?.setAttribute(
    "title",
    propertiesActive ? "Ocultar panel derecho" : "Mostrar panel derecho",
  );
}

function closeMobilePanels() {
  dom.sidebar.classList.remove("open");
  dom.properties.classList.remove("open");
  updatePanelBackdrop();
  updatePanelToggleState();
}

function toggleSidebarPanel() {
  if (isDrawerMode()) {
    const willOpen = !dom.sidebar.classList.contains("open");
    dom.sidebar.classList.toggle("open", willOpen);
    dom.properties.classList.remove("open");
  } else {
    dom.app.classList.toggle("sidebar-collapsed");
    safeStorage.set(
      "simuladorBancarioPanelIzquierdoOculto",
      String(dom.app.classList.contains("sidebar-collapsed")),
    );
  }
  updatePanelBackdrop();
  updatePanelToggleState();
  window.setTimeout(() => fitView(), 240);
}

function togglePropertiesPanel() {
  if (isDrawerMode()) {
    const willOpen = !dom.properties.classList.contains("open");
    dom.properties.classList.toggle("open", willOpen);
    dom.sidebar.classList.remove("open");
  } else {
    dom.app.classList.toggle("properties-collapsed");
    safeStorage.set(
      "simuladorBancarioPanelDerechoOculto",
      String(dom.app.classList.contains("properties-collapsed")),
    );
  }
  updatePanelBackdrop();
  updatePanelToggleState();
  window.setTimeout(() => fitView(), 240);
}

sidebarToggleBtn?.addEventListener("click", toggleSidebarPanel);
propertiesToggleBtn?.addEventListener("click", togglePropertiesPanel);
closeSidebarBtn?.addEventListener("click", closeMobilePanels);
closePropertiesBtn?.addEventListener("click", closeMobilePanels);
dom.panelBackdrop?.addEventListener("click", closeMobilePanels);

document.addEventListener("keydown", (event) => {
  if (event.key === "Delete" || event.key === "Backspace") {
    const tag = document.activeElement?.tagName;
    if (tag !== "INPUT" && tag !== "TEXTAREA") {
      event.preventDefault();
      deleteSelected();
    }
  }
  if (event.key === "Escape") {
    if (
      isDrawerMode() &&
      (dom.sidebar.classList.contains("open") ||
        dom.properties.classList.contains("open"))
    ) {
      closeMobilePanels();
      return;
    }
    state.connectionOrigin = null;
    state.connectionMode = false;
    dom.connectBtn.classList.remove("active");
    clearSelection();
    updateStatus("Selección cancelada.");
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveModel();
  }
});

function updateAutomaticLandscape() {
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 920;
  const portrait = window.innerHeight > window.innerWidth;

  /*
        No se rota todo el documento con CSS: esa técnica bloquea el desplazamiento,
        los formularios y la selección en varios navegadores móviles. La interfaz
        permanece interactiva en vertical y aprovecha más espacio al girar el equipo.
      */
  document.body.classList.remove("force-landscape");
  document.body.classList.toggle("mobile-portrait", smallScreen && portrait);
  document.body.classList.toggle("mobile-landscape", smallScreen && !portrait);

  window.requestAnimationFrame(() => {
    updatePanelBackdrop();
    updatePanelToggleState();
  });
}

async function requestLandscapeMode() {
  document.body.classList.remove("force-landscape");
  fitView();
  showToast("Modelo centrado. Puede desplazarse y editarlo con normalidad.");
}

window.addEventListener("resize", () => {
  updateAutomaticLandscape();
  if (Math.max(window.innerWidth, window.innerHeight) > 1100) {
    dom.sidebar.classList.remove("open");
    dom.properties.classList.remove("open");
    dom.panelBackdrop?.classList.remove("visible");
    document.body.style.overflow = "";
  }
  updatePanelBackdrop();
  updatePanelToggleState();
});

document.getElementById("mobileDockConfig")?.addEventListener("click", () => {
  dom.properties.classList.remove("open");
  dom.sidebar.classList.toggle("open");
  updatePanelBackdrop();
});

document.getElementById("mobileDockEdit")?.addEventListener("click", () => {
  dom.sidebar.classList.remove("open");
  if (!state.selected) {
    showToast("Toque un bloque o una conexión para editarlo.", "warning");
    return;
  }
  dom.properties.classList.add("open");
  updatePanelBackdrop();
});

document.getElementById("mobileDockRun")?.addEventListener("click", () => {
  if (state.running && !state.paused) {
    pauseSimulation();
  } else {
    startSimulation();
  }
});

document
  .getElementById("mobileDockReset")
  ?.addEventListener("click", resetSimulation);
document
  .getElementById("mobileDockLandscape")
  ?.addEventListener("click", requestLandscapeMode);

function initializeApp() {
  supabaseSync.initialize();
  updateAutomaticLandscape();
  const leftHidden =
    safeStorage.get("simuladorBancarioPanelIzquierdoOculto") === "true";
  const rightHidden =
    safeStorage.get("simuladorBancarioPanelDerechoOculto") === "true";
  dom.app.classList.toggle("sidebar-collapsed", leftHidden);
  dom.app.classList.toggle("properties-collapsed", rightHidden);
  updatePanelToggleState();
  updatePanelBackdrop();
  populateScheduleSelectors();
  try {
    const savedScenarios = safeStorage.get(
      "simuladorBancarioNeodatScenariosV13",
    );
    state.scenarioSnapshots = savedScenarios ? JSON.parse(savedScenarios) : [];
  } catch (error) {
    state.scenarioSnapshots = [];
  }
  renderSnapshotList();
  updateRunStatus();
  updateScenarioUi();
  loadExampleModel(false);
  const saved =
    safeStorage.get("simuladorBancarioNeodatV13") ||
    safeStorage.get("simuladorBancarioNeodatV12");
  if (saved) {
    try {
      const savedModel = JSON.parse(saved);
      const hasNodes =
        Array.isArray(savedModel?.nodes) && savedModel.nodes.length > 0;
      const hasEdges =
        Array.isArray(savedModel?.edges) && savedModel.edges.length > 0;
      const hasSource =
        hasNodes && savedModel.nodes.some((node) => node?.type === "source");
      const hasSink =
        hasNodes && savedModel.nodes.some((node) => node?.type === "sink");

      if (hasNodes && hasEdges && hasSource && hasSink) {
        applyModel(savedModel);
        showToast("Se cargó el último modelo guardado.");
        return;
      }

      safeStorage.remove("simuladorBancarioNeodatV13");
      safeStorage.remove("simuladorBancarioNeodatV12");
    } catch (error) {
      safeStorage.remove("simuladorBancarioNeodatV13");
      safeStorage.remove("simuladorBancarioNeodatV12");
    }
  }
  updateStatus("Modelo de demostración listo para ejecutar.");
  showToast("Simulador cargado correctamente.");
}

window.addEventListener("orientationchange", () => {
  window.setTimeout(() => {
    updateAutomaticLandscape();
    fitView();
  }, 180);
});

initializeApp();

window.FlowSimTramites = {
  state,
  start: startSimulation,
  pause: pauseSimulation,
  stop: () => stopSimulation(false),
  reset: resetSimulation,
  save: saveModel,
  exportModel,
  exportRecords,
  saveScenarioSnapshot,
  compareScenarios: () => {
    renderScenarioComparison();
    dom.comparisonModal?.classList.add("open");
  },
  loadExample: loadExampleModel,
  supabase: supabaseSync,
};
