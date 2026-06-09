import type { RiskLevel } from "@/lib/fraud-data";

export type CaseType =
  | "account_takeover"
  | "unauthorized_transaction"
  | "app_scam"
  | "merchant_fraud"
  | "aml_suspicious"
  | "card_testing"
  | "customer_risk"
  | "false_positive_review";

export const caseTypeLabel: Record<CaseType, string> = {
  account_takeover: "Account Takeover",
  unauthorized_transaction: "Unauthorized Transaction",
  app_scam: "APP Scam",
  merchant_fraud: "Merchant Fraud",
  aml_suspicious: "AML Suspicious",
  card_testing: "Card Testing",
  customer_risk: "Customer Risk",
  false_positive_review: "False Positive Review",
};

export type Decision =
  | "allowed"
  | "otp_required"
  | "held_for_review"
  | "blocked"
  | "reversed"
  | "sent_to_compliance";

export const decisionLabel: Record<Decision, string> = {
  allowed: "Allowed",
  otp_required: "OTP Required",
  held_for_review: "Held for Review",
  blocked: "Blocked",
  reversed: "Reversed",
  sent_to_compliance: "Sent to Compliance",
};

export type RecommendedAction =
  | "allow"
  | "verify_customer"
  | "hold_transaction"
  | "block_transaction"
  | "freeze_account"
  | "escalate_compliance"
  | "review_thresholds";

export const actionLabel: Record<RecommendedAction, string> = {
  allow: "Allow",
  verify_customer: "Verify Customer",
  hold_transaction: "Hold Transaction",
  block_transaction: "Block Transaction",
  freeze_account: "Freeze Account",
  escalate_compliance: "Escalate to Compliance",
  review_thresholds: "Review Thresholds",
};

export type SLAStatus = "on_time" | "warning" | "breached";

export interface LiveTransaction {
  id: string;
  time: string; // ISO
  customer: string;
  customerId: string;
  amount: number;
  channel: "UPI" | "IMPS" | "NEFT" | "RTGS" | "Card";
  counterparty: string;
  counterpartyType: "merchant" | "beneficiary";
  decision: Decision;
  risk: RiskLevel;
  riskScore: number;
  mainReason: string;
  evidence: string[];
  recommendedAction: RecommendedAction;
  customerBaseline: string;
  whatChanged: string;
}

export interface FraudAlert {
  id: string;
  caseType: CaseType;
  customer: string;
  customerId: string;
  amount: number;
  channel: string;
  counterparty: string;
  mainReason: string;
  evidence: string[];
  risk: RiskLevel;
  decision: Decision;
  recommendedAction: RecommendedAction;
  slaMinutesLeft: number;
  assignedTo: string | null;
  openedAt: string;
  similarPriorCases: number;
  loginActivity: string;
  deviceIp: string;
  linkedTxns: string[];
}

export type CaseOutcome = "fraud" | "genuine" | "suspicious" | "inconclusive";

export interface ReviewCase {
  id: string;
  caseType: CaseType;
  customer: string;
  customerId: string;
  amount: number;
  priority: "p1" | "p2" | "p3";
  risk: RiskLevel;
  mainReason: string;
  evidenceCount: number;
  evidence: string[];
  recommendedAction: RecommendedAction;
  slaMinutesLeft: number;
  assignedTo: string;
  status: "pending" | "in_progress" | "verification_pending" | "resolved";
  verificationPending: boolean;
  channel: string;
  customerImpact: string;
}

export interface MerchantRisk {
  id: string;
  name: string;
  category: string;
  kyc: "verified" | "under_review" | "failed";
  onboardingDays: number;
  txnVolume: number;
  uniqueCustomers: number;
  avgTicket: number;
  chargebackRate: number; // %
  reversalRate: number; // %
  linkedCases: number;
  customersAffected: number;
  volumeSpike: number; // x baseline
  mainConcern: string;
  evidence: string[];
  risk: RiskLevel;
  exposure: number;
  recommendedAction: RecommendedAction;
}

/* ---------- mock data ---------- */

const now = Date.now();
const iso = (mAgo: number) => new Date(now - mAgo * 60_000).toISOString();

export const liveTransactions: LiveTransaction[] = [
  {
    id: "TXN-10241",
    time: iso(0.5),
    customer: "Rajesh Iyer",
    customerId: "CUST_88431",
    amount: 95000,
    channel: "IMPS",
    counterparty: "BEN_103",
    counterpartyType: "beneficiary",
    decision: "held_for_review",
    risk: "high",
    riskScore: 82,
    mainReason: "New beneficiary after failed login attempts",
    evidence: ["New device", "4 failed logins", "Recent beneficiary", "Unusual time", "Amount 8x normal"],
    recommendedAction: "hold_transaction",
    customerBaseline: "Avg IMPS ₹12,000 · Active 09:00–21:00 IST",
    whatChanged: "Login from new device at 02:14, then ₹95,000 to first-seen beneficiary.",
  },
  {
    id: "TXN-10240",
    time: iso(1),
    customer: "Priya Nair",
    customerId: "CUST_44012",
    amount: 4200,
    channel: "UPI",
    counterparty: "MERCHANT_FoodCo",
    counterpartyType: "merchant",
    decision: "allowed",
    risk: "low",
    riskScore: 14,
    mainReason: "Routine merchant payment",
    evidence: ["Trusted device", "Verified merchant", "In normal pattern"],
    recommendedAction: "allow",
    customerBaseline: "Pays this merchant weekly",
    whatChanged: "Nothing material — within pattern.",
  },
  {
    id: "TXN-10239",
    time: iso(2),
    customer: "Anita Sharma",
    customerId: "CUST_77120",
    amount: 22500,
    channel: "Card",
    counterparty: "MERCHANT_QuickElec",
    counterpartyType: "merchant",
    decision: "otp_required",
    risk: "medium",
    riskScore: 54,
    mainReason: "Card-not-present from new device",
    evidence: ["New device", "City mismatch", "Above normal amount"],
    recommendedAction: "verify_customer",
    customerBaseline: "Mostly low-value CNP, Bengaluru",
    whatChanged: "CNP attempt from Mumbai on unseen device.",
  },
  {
    id: "TXN-10238",
    time: iso(3),
    customer: "Vikram Mehta",
    customerId: "CUST_55009",
    amount: 590000,
    channel: "IMPS",
    counterparty: "ACC_X1",
    counterpartyType: "beneficiary",
    decision: "blocked",
    risk: "critical",
    riskScore: 96,
    mainReason: "Rapid in-out movement (mule indicator)",
    evidence: ["Funds received 2 min ago", "Rapid fund movement", "Suspicious IP", "Account frozen earlier"],
    recommendedAction: "freeze_account",
    customerBaseline: "Frozen — should not transact",
    whatChanged: "Attempted IMPS payout despite freeze flag.",
  },
  {
    id: "TXN-10237",
    time: iso(4),
    customer: "Meera Kapoor",
    customerId: "CUST_22118",
    amount: 49500,
    channel: "UPI",
    counterparty: "BEN_201",
    counterpartyType: "beneficiary",
    decision: "sent_to_compliance",
    risk: "high",
    riskScore: 74,
    mainReason: "Structuring pattern under reporting threshold",
    evidence: ["Structuring pattern", "Repeated cadence", "Similar sizing"],
    recommendedAction: "escalate_compliance",
    customerBaseline: "Salaried, irregular UPI deposits",
    whatChanged: "11th deposit just below ₹50k in 4 days.",
  },
  {
    id: "TXN-10236",
    time: iso(5),
    customer: "Sandeep Roy",
    customerId: "CUST_33781",
    amount: 1100,
    channel: "UPI",
    counterparty: "MERCHANT_TeaCo",
    counterpartyType: "merchant",
    decision: "allowed",
    risk: "low",
    riskScore: 8,
    mainReason: "Routine activity",
    evidence: ["Trusted device", "Verified merchant"],
    recommendedAction: "allow",
    customerBaseline: "Daily small UPI payments",
    whatChanged: "Nothing.",
  },
  {
    id: "TXN-10235",
    time: iso(6),
    customer: "Neha Gupta",
    customerId: "CUST_91002",
    amount: 175000,
    channel: "NEFT",
    counterparty: "Hospital_Apollo",
    counterpartyType: "merchant",
    decision: "held_for_review",
    risk: "medium",
    riskScore: 58,
    mainReason: "High value to first-seen payee — possibly genuine hospital",
    evidence: ["First-seen payee", "Above normal amount", "Possible false positive"],
    recommendedAction: "verify_customer",
    customerBaseline: "Salary ₹2L/mo, no medical history",
    whatChanged: "Large NEFT to hospital — verify with customer.",
  },
  {
    id: "TXN-10234",
    time: iso(7),
    customer: "Arjun Verma",
    customerId: "CUST_61444",
    amount: 250,
    channel: "Card",
    counterparty: "MERCHANT_OnlineXYZ",
    counterpartyType: "merchant",
    decision: "blocked",
    risk: "high",
    riskScore: 79,
    mainReason: "Card testing pattern",
    evidence: ["Card testing", "5 declined attempts", "Suspicious IP"],
    recommendedAction: "block_transaction",
    customerBaseline: "Rare card use",
    whatChanged: "Burst of low-value card attempts on foreign IP.",
  },
];

export const fraudAlerts: FraudAlert[] = [
  {
    id: "ALT-5201",
    caseType: "account_takeover",
    customer: "Rajesh Iyer",
    customerId: "CUST_88431",
    amount: 95000,
    channel: "IMPS",
    counterparty: "BEN_103",
    mainReason: "New device after failed logins, transfer to first-seen beneficiary",
    evidence: ["New device", "4 failed logins", "Recent beneficiary", "Unusual time", "MFA failed"],
    risk: "critical",
    decision: "held_for_review",
    recommendedAction: "freeze_account",
    slaMinutesLeft: 18,
    assignedTo: "priya.k",
    openedAt: iso(42),
    similarPriorCases: 2,
    loginActivity: "4 failed → 1 success at 02:11 IST",
    deviceIp: "Android · Mumbai · 49.207.x.x (high-risk ASN)",
    linkedTxns: ["TXN-10241", "TXN-10220"],
  },
  {
    id: "ALT-5200",
    caseType: "merchant_fraud",
    customer: "Multiple (24 customers)",
    customerId: "—",
    amount: 1840000,
    channel: "Card",
    counterparty: "MERCHANT_QuickElec",
    mainReason: "Merchant chargeback cluster — 24 customers in 48h",
    evidence: ["Merchant spike", "High chargeback rate", "Many customers affected", "New merchant"],
    risk: "high",
    decision: "sent_to_compliance",
    recommendedAction: "escalate_compliance",
    slaMinutesLeft: 95,
    assignedTo: null,
    openedAt: iso(120),
    similarPriorCases: 0,
    loginActivity: "n/a",
    deviceIp: "n/a",
    linkedTxns: ["TXN-10239", "TXN-10232", "TXN-10228"],
  },
  {
    id: "ALT-5199",
    caseType: "aml_suspicious",
    customer: "Anita Sharma",
    customerId: "CUST_77120",
    amount: 540000,
    channel: "UPI/Cash",
    counterparty: "ACC_T1 (self-target)",
    mainReason: "Structuring across 11 linked transactions",
    evidence: ["Structuring pattern", "Repeated cadence", "Similar sizing", "Below threshold"],
    risk: "high",
    decision: "sent_to_compliance",
    recommendedAction: "escalate_compliance",
    slaMinutesLeft: 240,
    assignedTo: "amit.s",
    openedAt: iso(360),
    similarPriorCases: 1,
    loginActivity: "Normal",
    deviceIp: "Known device",
    linkedTxns: ["TXN_S100", "TXN_S105"],
  },
  {
    id: "ALT-5198",
    caseType: "unauthorized_transaction",
    customer: "Vikram Mehta",
    customerId: "CUST_55009",
    amount: 590000,
    channel: "IMPS",
    counterparty: "ACC_X1",
    mainReason: "Customer confirmed unauthorized payment",
    evidence: ["Customer confirmed fraud", "Rapid fund movement", "Account frozen earlier"],
    risk: "critical",
    decision: "blocked",
    recommendedAction: "freeze_account",
    slaMinutesLeft: -15,
    assignedTo: "priya.k",
    openedAt: iso(180),
    similarPriorCases: 3,
    loginActivity: "Customer reported via app",
    deviceIp: "Stolen credentials suspected",
    linkedTxns: ["TXN-10238"],
  },
  {
    id: "ALT-5197",
    caseType: "card_testing",
    customer: "Arjun Verma",
    customerId: "CUST_61444",
    amount: 1250,
    channel: "Card",
    counterparty: "MERCHANT_OnlineXYZ",
    mainReason: "Burst of low-value card attempts from foreign IP",
    evidence: ["Card testing", "5 declined attempts", "Suspicious IP", "MFA failed"],
    risk: "high",
    decision: "blocked",
    recommendedAction: "block_transaction",
    slaMinutesLeft: 55,
    assignedTo: null,
    openedAt: iso(60),
    similarPriorCases: 0,
    loginActivity: "No login (guest card)",
    deviceIp: "Foreign IP · proxy ASN",
    linkedTxns: ["TXN-10234"],
  },
  {
    id: "ALT-5196",
    caseType: "false_positive_review",
    customer: "Neha Gupta",
    customerId: "CUST_91002",
    amount: 175000,
    channel: "NEFT",
    counterparty: "Hospital_Apollo",
    mainReason: "Likely genuine hospital payment — held by amount rule",
    evidence: ["Possible false positive", "Trusted device", "Verified merchant"],
    risk: "medium",
    decision: "held_for_review",
    recommendedAction: "verify_customer",
    slaMinutesLeft: 12,
    assignedTo: "ravi.m",
    openedAt: iso(35),
    similarPriorCases: 6,
    loginActivity: "Normal",
    deviceIp: "Trusted",
    linkedTxns: ["TXN-10235"],
  },
  {
    id: "ALT-5195",
    caseType: "app_scam",
    customer: "Sunita Rao",
    customerId: "CUST_70212",
    amount: 320000,
    channel: "IMPS",
    counterparty: "BEN_998",
    mainReason: "Customer initiated transfer after suspicious phone call",
    evidence: ["Customer-initiated", "First-seen beneficiary", "Unusual amount"],
    risk: "high",
    decision: "held_for_review",
    recommendedAction: "verify_customer",
    slaMinutesLeft: 30,
    assignedTo: null,
    openedAt: iso(45),
    similarPriorCases: 0,
    loginActivity: "Customer logged in normally",
    deviceIp: "Trusted device",
    linkedTxns: ["TXN-10230"],
  },
];

export const reviewCases: ReviewCase[] = [
  {
    id: "CASE-3301",
    caseType: "account_takeover",
    customer: "Rajesh Iyer",
    customerId: "CUST_88431",
    amount: 95000,
    priority: "p1",
    risk: "critical",
    mainReason: "Account takeover suspected — new device + failed logins",
    evidenceCount: 5,
    evidence: ["New device", "4 failed logins", "Recent beneficiary", "Unusual time", "MFA failed"],
    recommendedAction: "freeze_account",
    slaMinutesLeft: 18,
    assignedTo: "priya.k",
    status: "in_progress",
    verificationPending: true,
    channel: "IMPS",
    customerImpact: "Outbound transfers temporarily blocked",
  },
  {
    id: "CASE-3300",
    caseType: "merchant_fraud",
    customer: "MERCHANT_QuickElec cluster",
    customerId: "MERCH_QE",
    amount: 1840000,
    priority: "p1",
    risk: "high",
    mainReason: "Chargeback cluster across 24 customers",
    evidenceCount: 4,
    evidence: ["Merchant spike", "High chargeback rate", "Many customers affected", "New merchant"],
    recommendedAction: "escalate_compliance",
    slaMinutesLeft: 95,
    assignedTo: "unassigned",
    status: "pending",
    verificationPending: false,
    channel: "Card",
    customerImpact: "24 customer refunds pending",
  },
  {
    id: "CASE-3299",
    caseType: "false_positive_review",
    customer: "Neha Gupta",
    customerId: "CUST_91002",
    amount: 175000,
    priority: "p2",
    risk: "medium",
    mainReason: "Likely genuine hospital payment held",
    evidenceCount: 3,
    evidence: ["Possible false positive", "Trusted device", "Verified merchant"],
    recommendedAction: "verify_customer",
    slaMinutesLeft: 12,
    assignedTo: "ravi.m",
    status: "verification_pending",
    verificationPending: true,
    channel: "NEFT",
    customerImpact: "Customer waiting on hospital payment",
  },
  {
    id: "CASE-3298",
    caseType: "aml_suspicious",
    customer: "Anita Sharma",
    customerId: "CUST_77120",
    amount: 540000,
    priority: "p2",
    risk: "high",
    mainReason: "Structuring across 11 deposits",
    evidenceCount: 4,
    evidence: ["Structuring pattern", "Repeated cadence", "Similar sizing", "Below threshold"],
    recommendedAction: "escalate_compliance",
    slaMinutesLeft: 240,
    assignedTo: "amit.s",
    status: "in_progress",
    verificationPending: false,
    channel: "UPI/Cash",
    customerImpact: "Account flagged for SAR review",
  },
  {
    id: "CASE-3297",
    caseType: "unauthorized_transaction",
    customer: "Vikram Mehta",
    customerId: "CUST_55009",
    amount: 590000,
    priority: "p1",
    risk: "critical",
    mainReason: "Customer confirmed unauthorized payout",
    evidenceCount: 3,
    evidence: ["Customer confirmed fraud", "Rapid fund movement", "Stolen credentials suspected"],
    recommendedAction: "freeze_account",
    slaMinutesLeft: -15,
    assignedTo: "priya.k",
    status: "in_progress",
    verificationPending: false,
    channel: "IMPS",
    customerImpact: "Funds in dispute",
  },
  {
    id: "CASE-3296",
    caseType: "app_scam",
    customer: "Sunita Rao",
    customerId: "CUST_70212",
    amount: 320000,
    priority: "p2",
    risk: "high",
    mainReason: "Suspected APP scam — customer-initiated transfer",
    evidenceCount: 3,
    evidence: ["Customer-initiated", "First-seen beneficiary", "Unusual amount"],
    recommendedAction: "verify_customer",
    slaMinutesLeft: 30,
    assignedTo: "unassigned",
    status: "pending",
    verificationPending: true,
    channel: "IMPS",
    customerImpact: "Transfer on hold pending customer confirmation",
  },
];

export const merchants: MerchantRisk[] = [
  {
    id: "MERCH_QE",
    name: "QuickElec Online",
    category: "Electronics retail",
    kyc: "under_review",
    onboardingDays: 21,
    txnVolume: 482,
    uniqueCustomers: 412,
    avgTicket: 18400,
    chargebackRate: 8.4,
    reversalRate: 5.1,
    linkedCases: 12,
    customersAffected: 24,
    volumeSpike: 6.2,
    mainConcern: "Chargeback cluster across many customers",
    evidence: ["New merchant", "Sudden volume spike", "High chargeback rate", "Many customers affected", "KYC under review"],
    risk: "critical",
    exposure: 1840000,
    recommendedAction: "escalate_compliance",
  },
  {
    id: "MERCH_OXYZ",
    name: "OnlineXYZ Store",
    category: "Misc e-commerce",
    kyc: "verified",
    onboardingDays: 95,
    txnVolume: 2104,
    uniqueCustomers: 1820,
    avgTicket: 1250,
    chargebackRate: 2.1,
    reversalRate: 3.4,
    linkedCases: 6,
    customersAffected: 11,
    volumeSpike: 3.1,
    mainConcern: "Card testing cluster from foreign IPs",
    evidence: ["Reversal cluster", "Card testing pattern", "Suspicious IP"],
    risk: "high",
    exposure: 240000,
    recommendedAction: "review_thresholds",
  },
  {
    id: "MERCH_TRV",
    name: "TravelBookr",
    category: "Travel/booking",
    kyc: "verified",
    onboardingDays: 720,
    txnVolume: 6210,
    uniqueCustomers: 5114,
    avgTicket: 22400,
    chargebackRate: 1.4,
    reversalRate: 1.1,
    linkedCases: 2,
    customersAffected: 3,
    volumeSpike: 1.2,
    mainConcern: "Within normal range — monitor",
    evidence: ["Verified merchant", "Stable volume"],
    risk: "low",
    exposure: 18000,
    recommendedAction: "allow",
  },
  {
    id: "MERCH_GRO",
    name: "GroceriesNow",
    category: "Grocery",
    kyc: "verified",
    onboardingDays: 410,
    txnVolume: 12480,
    uniqueCustomers: 9810,
    avgTicket: 820,
    chargebackRate: 0.6,
    reversalRate: 0.8,
    linkedCases: 0,
    customersAffected: 0,
    volumeSpike: 1.0,
    mainConcern: "Healthy merchant",
    evidence: ["Verified merchant"],
    risk: "low",
    exposure: 0,
    recommendedAction: "allow",
  },
  {
    id: "MERCH_COLL",
    name: "PayCollect Pro",
    category: "Payment aggregator",
    kyc: "under_review",
    onboardingDays: 11,
    txnVolume: 312,
    uniqueCustomers: 84,
    avgTicket: 142000,
    chargebackRate: 4.8,
    reversalRate: 2.9,
    linkedCases: 4,
    customersAffected: 9,
    volumeSpike: 4.1,
    mainConcern: "AML collection pattern, customer complaints rising",
    evidence: ["New merchant", "KYC under review", "AML collection pattern", "Customer complaints increasing", "High-risk category"],
    risk: "high",
    exposure: 980000,
    recommendedAction: "freeze_account",
  },
];

/* helpers */
export const slaStatus = (m: number): SLAStatus =>
  m < 0 ? "breached" : m <= 20 ? "warning" : "on_time";

export const slaLabel = (m: number) => {
  if (m < 0) return `Breached ${Math.abs(Math.round(m))}m ago`;
  if (m < 60) return `${Math.round(m)}m left`;
  const h = Math.floor(m / 60);
  const rem = Math.round(m % 60);
  return `${h}h ${rem}m left`;
};

export const riskOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/* aggregate KPIs */
export const opsKpis = () => {
  const openCritical = fraudAlerts.filter((a) => a.risk === "critical" || a.risk === "high").length;
  const moneyAtRisk = fraudAlerts.reduce((s, a) => s + (a.decision !== "allowed" ? a.amount : 0), 0);
  const slaAtRisk = fraudAlerts.filter((a) => a.slaMinutesLeft <= 20).length;
  const amlPending = fraudAlerts.filter((a) => a.caseType === "aml_suspicious").length;
  const reviewPending = reviewCases.filter((c) => c.status !== "resolved").length;
  const verificationPending = reviewCases.filter((c) => c.verificationPending).length;
  const falsePositives = fraudAlerts.filter((a) => a.caseType === "false_positive_review").length;
  return {
    openCritical,
    moneyAtRisk,
    slaAtRisk,
    amlPending,
    reviewPending,
    verificationPending,
    falsePositives,
  };
};