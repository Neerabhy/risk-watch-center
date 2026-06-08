export type MonitoringStatus =
  | "monitoring"
  | "review_required"
  | "freeze_recommended"
  | "frozen"
  | "closed";

export type AccountStatus = "active" | "frozen" | "closed";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Recommendation =
  | "continue_monitoring"
  | "hold_and_review"
  | "freeze_recommended"
  | "close_account";

export interface TimelineEvent {
  id: string;
  date: string;
  type:
    | "trigger"
    | "risky_event"
    | "status_change"
    | "recommendation"
    | "investigation"
    | "reviewer_action";
  title: string;
  detail: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  channel: string;
  authStatus: "passed" | "failed" | "step_up";
  decision: "allowed" | "held" | "declined";
  fraudLabel: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
  reason: string;
}

export interface MonitoredAccount {
  customerName: string;
  customerId: string;
  accountId: string;
  accountStatus: AccountStatus;
  monitoringStatus: MonitoringStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  riskEventCount: number;
  lastRiskyTxn: string;
  lastActivity: string;
  triggerTxnId: string;
  recommendation: Recommendation;
  exposure: number;
  reason: string;
  // detail
  balance: number;
  openDate: string;
  kyc: "verified" | "pending" | "failed";
  city: string;
  numAccounts: number;
  totalTxns: number;
  fraudTxns: number;
  authIssues: number;
  avgIpRisk: number;
  recentDeviceChanges: number;
  timeline: TimelineEvent[];
  transactions: Transaction[];
  signals: { label: string; severity: RiskLevel; detail: string }[];
  investigation: {
    recommendation: string;
    reasons: string[];
    evidenceTxnIds: string[];
    nextSteps: string[];
  };
  audit: { date: string; actor: string; action: string; note?: string }[];
}

const txns = (seed: number): Transaction[] =>
  Array.from({ length: 8 }).map((_, i) => {
    const flagged = i % 3 === 0;
    return {
      id: `TXN_${seed}${(1000 + i).toString()}`,
      date: new Date(Date.now() - (i + 1) * 36e5 * (seed % 5 + 1)).toISOString(),
      amount: Math.round((10000 + (i * seed * 1337) % 290000)),
      channel: ["UPI", "NEFT", "IMPS", "RTGS", "Card"][i % 5],
      authStatus: i % 4 === 0 ? "failed" : i % 5 === 0 ? "step_up" : "passed",
      decision: flagged ? (i % 6 === 0 ? "declined" : "held") : "allowed",
      fraudLabel: flagged,
      riskLevel: flagged ? (i % 4 === 0 ? "critical" : "high") : i % 2 === 0 ? "medium" : "low",
      riskScore: flagged ? 78 + (i % 20) : 30 + (i % 30),
      reason: flagged
        ? "New device + high-risk IP + unusual amount"
        : "Routine activity within profile",
    };
  });

export const monitoredAccounts: MonitoredAccount[] = [
  {
    customerName: "Rajesh Iyer",
    customerId: "CUST_88431",
    accountId: "ACC_001",
    accountStatus: "active",
    monitoringStatus: "freeze_recommended",
    riskScore: 87,
    riskLevel: "critical",
    riskEventCount: 5,
    lastRiskyTxn: "TXN_99214",
    lastActivity: new Date(Date.now() - 2 * 36e5).toISOString(),
    triggerTxnId: "TXN_88001",
    recommendation: "freeze_recommended",
    exposure: 1144000,
    reason:
      "5 risky events in 19 hours, channel hopping NEFT→IMPS, fan-out to 6 receivers via BEN_103.",
    balance: 218400,
    openDate: "2021-04-12",
    kyc: "verified",
    city: "Mumbai",
    numAccounts: 3,
    totalTxns: 412,
    fraudTxns: 7,
    authIssues: 4,
    avgIpRisk: 0.74,
    recentDeviceChanges: 3,
    timeline: [
      { id: "t1", date: "2026-06-07T08:00:00Z", type: "trigger", title: "Placed under monitoring", detail: "Allow-with-monitoring on TXN_88001 (₹2.1L NEFT to BEN_103)." },
      { id: "t2", date: "2026-06-07T11:14:00Z", type: "risky_event", title: "Risky transfer", detail: "₹1.9L IMPS to new receiver ACC_R02." },
      { id: "t3", date: "2026-06-07T15:42:00Z", type: "risky_event", title: "Channel hop", detail: "Switched NEFT → IMPS; high-risk IP." },
      { id: "t4", date: "2026-06-07T22:09:00Z", type: "recommendation", title: "Freeze recommended", detail: "5 risky events threshold crossed." },
      { id: "t5", date: "2026-06-08T03:11:00Z", type: "investigation", title: "Investigation run", detail: "Agent recommended hold + compliance escalation." },
    ],
    transactions: txns(1),
    signals: [
      { label: "Repeated fraud labels", severity: "critical", detail: "5 fraud-labeled txns in 19h." },
      { label: "Channel hopping", severity: "high", detail: "NEFT → IMPS switch within burst window." },
      { label: "High-risk IP", severity: "high", detail: "Avg IP risk 0.74 over last 24h." },
      { label: "New device activity", severity: "medium", detail: "3 device changes in 7 days." },
      { label: "Fan-out beneficiaries", severity: "critical", detail: "6 receiver accounts via BEN_103." },
    ],
    investigation: {
      recommendation: "Freeze account and escalate to compliance",
      reasons: [
        "5 fraud-labeled transactions inside a 19-hour window",
        "Same beneficiary BEN_103 reused across 6 distinct receivers",
        "Channel switched from NEFT to IMPS during burst",
        "Average IP risk score 0.74 (>0.6 threshold)",
      ],
      evidenceTxnIds: ["TXN_88001", "TXN_99214", "TXN_99217", "TXN_99221"],
      nextSteps: [
        "Freeze account pending compliance review",
        "Notify AML team about fan-out cluster",
        "Hold all outbound transfers > ₹50k for 72h",
      ],
    },
    audit: [
      { date: "2026-06-08T03:11:00Z", actor: "agent.investigation", action: "Investigation run", note: "Score 87" },
      { date: "2026-06-07T22:09:00Z", actor: "system", action: "Freeze recommended" },
      { date: "2026-06-07T08:00:00Z", actor: "system", action: "Placed under monitoring" },
    ],
  },
  {
    customerName: "Anita Sharma",
    customerId: "CUST_77120",
    accountId: "ACC_002",
    accountStatus: "active",
    monitoringStatus: "review_required",
    riskScore: 64,
    riskLevel: "high",
    riskEventCount: 3,
    lastRiskyTxn: "TXN_71200",
    lastActivity: new Date(Date.now() - 5 * 36e5).toISOString(),
    triggerTxnId: "TXN_70044",
    recommendation: "hold_and_review",
    exposure: 384000,
    reason: "3 high-risk card-not-present txns, 2 step-up auths failed.",
    balance: 92300,
    openDate: "2022-09-30",
    kyc: "verified",
    city: "Bengaluru",
    numAccounts: 1,
    totalTxns: 188,
    fraudTxns: 3,
    authIssues: 2,
    avgIpRisk: 0.58,
    recentDeviceChanges: 2,
    timeline: [
      { id: "t1", date: "2026-06-05T13:00:00Z", type: "trigger", title: "Placed under monitoring", detail: "TXN_70044 allowed with monitoring (step-up passed late)." },
      { id: "t2", date: "2026-06-06T09:30:00Z", type: "risky_event", title: "Failed step-up", detail: "Card CNP attempted on new device." },
      { id: "t3", date: "2026-06-07T18:11:00Z", type: "recommendation", title: "Review required", detail: "Threshold crossed (3 risky events)." },
    ],
    transactions: txns(2),
    signals: [
      { label: "Failed step-up auth", severity: "high", detail: "2 failed OTP verifications in 24h." },
      { label: "New device activity", severity: "medium", detail: "Device id changed twice." },
    ],
    investigation: {
      recommendation: "Hold and review with customer outreach",
      reasons: ["3 risky CNP txns", "2 failed step-up auths"],
      evidenceTxnIds: ["TXN_70044", "TXN_71200"],
      nextSteps: ["Customer callback", "Force device re-binding"],
    },
    audit: [
      { date: "2026-06-07T18:11:00Z", actor: "system", action: "Marked review required" },
      { date: "2026-06-05T13:00:00Z", actor: "system", action: "Placed under monitoring" },
    ],
  },
  {
    customerName: "Vikram Mehta",
    customerId: "CUST_55009",
    accountId: "ACC_003",
    accountStatus: "frozen",
    monitoringStatus: "frozen",
    riskScore: 92,
    riskLevel: "critical",
    riskEventCount: 7,
    lastRiskyTxn: "TXN_55432",
    lastActivity: new Date(Date.now() - 28 * 36e5).toISOString(),
    triggerTxnId: "TXN_55000",
    recommendation: "close_account",
    exposure: 2340000,
    reason: "Frozen after 7 risky events; suspected mule behavior.",
    balance: 0,
    openDate: "2023-01-08",
    kyc: "verified",
    city: "Delhi",
    numAccounts: 2,
    totalTxns: 96,
    fraudTxns: 11,
    authIssues: 6,
    avgIpRisk: 0.81,
    recentDeviceChanges: 5,
    timeline: [
      { id: "t1", date: "2026-06-01T10:00:00Z", type: "trigger", title: "Placed under monitoring", detail: "Trigger TXN_55000." },
      { id: "t2", date: "2026-06-04T14:00:00Z", type: "reviewer_action", title: "Account frozen", detail: "Analyst priya.k froze outbound transfers." },
    ],
    transactions: txns(3),
    signals: [
      { label: "Mule pattern", severity: "critical", detail: "Funds in / funds out within minutes." },
      { label: "Repeated high IP risk", severity: "critical", detail: "IP risk 0.81 sustained." },
    ],
    investigation: {
      recommendation: "Close account; refer to law enforcement liaison",
      reasons: ["Sustained mule behavior", "7 fraud-labeled txns"],
      evidenceTxnIds: ["TXN_55000", "TXN_55432"],
      nextSteps: ["Close account", "File SAR", "Notify counterparty banks"],
    },
    audit: [
      { date: "2026-06-04T14:00:00Z", actor: "priya.k", action: "Account frozen" },
      { date: "2026-06-01T10:00:00Z", actor: "system", action: "Placed under monitoring" },
    ],
  },
  {
    customerName: "Priyanka Nair",
    customerId: "CUST_44012",
    accountId: "ACC_004",
    accountStatus: "active",
    monitoringStatus: "monitoring",
    riskScore: 41,
    riskLevel: "medium",
    riskEventCount: 1,
    lastRiskyTxn: "TXN_44091",
    lastActivity: new Date(Date.now() - 12 * 36e5).toISOString(),
    triggerTxnId: "TXN_44012",
    recommendation: "continue_monitoring",
    exposure: 76000,
    reason: "Single anomalous IMPS at midnight; otherwise stable profile.",
    balance: 184000,
    openDate: "2020-02-14",
    kyc: "verified",
    city: "Pune",
    numAccounts: 1,
    totalTxns: 612,
    fraudTxns: 1,
    authIssues: 0,
    avgIpRisk: 0.31,
    recentDeviceChanges: 0,
    timeline: [
      { id: "t1", date: "2026-06-06T23:50:00Z", type: "trigger", title: "Placed under monitoring", detail: "Midnight IMPS to unseen receiver." },
    ],
    transactions: txns(4),
    signals: [{ label: "Unusual time-of-day", severity: "medium", detail: "23:50 IST IMPS, off-pattern." }],
    investigation: {
      recommendation: "Continue monitoring",
      reasons: ["Single off-pattern event", "Low baseline IP risk"],
      evidenceTxnIds: ["TXN_44012"],
      nextSteps: ["Re-evaluate in 7 days"],
    },
    audit: [{ date: "2026-06-06T23:50:00Z", actor: "system", action: "Placed under monitoring" }],
  },
  {
    customerName: "Sandeep Roy",
    customerId: "CUST_33781",
    accountId: "ACC_005",
    accountStatus: "active",
    monitoringStatus: "monitoring",
    riskScore: 38,
    riskLevel: "medium",
    riskEventCount: 1,
    lastRiskyTxn: "TXN_33920",
    lastActivity: new Date(Date.now() - 40 * 36e5).toISOString(),
    triggerTxnId: "TXN_33920",
    recommendation: "continue_monitoring",
    exposure: 52000,
    reason: "Card CNP from new geo; OTP passed.",
    balance: 67200,
    openDate: "2019-08-23",
    kyc: "verified",
    city: "Kolkata",
    numAccounts: 2,
    totalTxns: 1042,
    fraudTxns: 0,
    authIssues: 1,
    avgIpRisk: 0.42,
    recentDeviceChanges: 1,
    timeline: [{ id: "t1", date: "2026-06-06T18:00:00Z", type: "trigger", title: "Placed under monitoring", detail: "CNP from new geo." }],
    transactions: txns(5),
    signals: [{ label: "Geo anomaly", severity: "medium", detail: "First-time merchant geo." }],
    investigation: {
      recommendation: "Continue monitoring",
      reasons: ["First-time geo, OTP passed"],
      evidenceTxnIds: ["TXN_33920"],
      nextSteps: ["Re-evaluate in 14 days"],
    },
    audit: [{ date: "2026-06-06T18:00:00Z", actor: "system", action: "Placed under monitoring" }],
  },
  {
    customerName: "Meera Kapoor",
    customerId: "CUST_22118",
    accountId: "ACC_006",
    accountStatus: "closed",
    monitoringStatus: "closed",
    riskScore: 95,
    riskLevel: "critical",
    riskEventCount: 9,
    lastRiskyTxn: "TXN_22510",
    lastActivity: new Date(Date.now() - 240 * 36e5).toISOString(),
    triggerTxnId: "TXN_22001",
    recommendation: "close_account",
    exposure: 4120000,
    reason: "Account closed after SAR filed.",
    balance: 0,
    openDate: "2022-11-02",
    kyc: "verified",
    city: "Hyderabad",
    numAccounts: 1,
    totalTxns: 312,
    fraudTxns: 14,
    authIssues: 8,
    avgIpRisk: 0.88,
    recentDeviceChanges: 6,
    timeline: [
      { id: "t1", date: "2026-05-18T10:00:00Z", type: "trigger", title: "Placed under monitoring", detail: "Trigger TXN_22001." },
      { id: "t2", date: "2026-05-25T15:00:00Z", type: "reviewer_action", title: "Account closed", detail: "Compliance closed account after SAR." },
    ],
    transactions: txns(6),
    signals: [{ label: "Confirmed mule", severity: "critical", detail: "Compliance confirmed mule behavior." }],
    investigation: {
      recommendation: "Closed",
      reasons: ["SAR filed, account closed"],
      evidenceTxnIds: ["TXN_22001", "TXN_22510"],
      nextSteps: ["Archive case"],
    },
    audit: [
      { date: "2026-05-25T15:00:00Z", actor: "compliance.team", action: "Account closed" },
      { date: "2026-05-18T10:00:00Z", actor: "system", action: "Placed under monitoring" },
    ],
  },
];

/* -------------------- AML -------------------- */

export type AmlPatternType =
  | "fan_out"
  | "same_beneficiary_spread"
  | "structuring"
  | "rapid_fund_movement"
  | "circular_transfers"
  | "mule_behavior"
  | "dormant_reactivation"
  | "high_risk_counterparty";

export interface AmlEdge {
  id: string;
  from: string;
  to: string;
  amount: number;
  channel: string;
  time: string;
  txnId: string;
  flagged?: boolean;
}

export interface AmlNode {
  id: string;
  label: string;
  type: "source" | "beneficiary" | "receiver";
  sublabel?: string;
}

export interface AmlCluster {
  patternId: string;
  customerName: string;
  customerId: string;
  accountId: string;
  patternType: AmlPatternType;
  patternLabel: string;
  patternSummary: string;
  exposure: number;
  txnCount: number;
  counterparties: number;
  timeWindow: string;
  channels: string[];
  amlScore: number;
  riskLevel: RiskLevel;
  complianceRequired: boolean;
  signals: { label: string; detail: string }[];
  nodes: AmlNode[];
  edges: AmlEdge[];
  evidence: { txnId: string; amount: number; receiver: string; channel: string; type: string }[];
  agent: {
    recommendation: string;
    riskLevel: RiskLevel;
    summary: string;
    reasons: string[];
    evidenceTxnIds: string[];
    nextSteps: string[];
  };
}

export const amlClusters: AmlCluster[] = [
  {
    patternId: "AML_PAT_001",
    customerName: "Rajesh Iyer",
    customerId: "CUST_88431",
    accountId: "ACC_001",
    patternType: "fan_out",
    patternLabel: "Fan-out layering via shared beneficiary",
    patternSummary:
      "ACC_001 sent 6 transfers totaling ₹11.44L to 6 receivers via BEN_103 in 19h; channels hopped NEFT→IMPS.",
    exposure: 1144000,
    txnCount: 6,
    counterparties: 6,
    timeWindow: "19h",
    channels: ["NEFT", "IMPS"],
    amlScore: 89,
    riskLevel: "critical",
    complianceRequired: true,
    signals: [
      { label: "Fan-out transfers", detail: "ACC_001 sent funds to 6 receiver accounts." },
      { label: "Same beneficiary", detail: "All transfers used BEN_103 while spreading to multiple receivers." },
      { label: "Channel hopping", detail: "Switched from NEFT to IMPS mid-burst." },
      { label: "Burst window", detail: "6 suspicious transfers within 19 hours." },
      { label: "Repeated high-value", detail: "All transfers ≥ ₹1.5L." },
      { label: "Similar sizing", detail: "Transfer amounts clustered ₹1.7L–₹2.1L." },
    ],
    nodes: [
      { id: "ACC_001", label: "ACC_001", type: "source", sublabel: "Rajesh Iyer" },
      { id: "BEN_103", label: "BEN_103", type: "beneficiary", sublabel: "Shared payee" },
      { id: "ACC_R01", label: "ACC_R01", type: "receiver", sublabel: "First-seen" },
      { id: "ACC_R02", label: "ACC_R02", type: "receiver", sublabel: "First-seen" },
      { id: "ACC_R03", label: "ACC_R03", type: "receiver", sublabel: "Reused" },
      { id: "ACC_R04", label: "ACC_R04", type: "receiver", sublabel: "First-seen" },
      { id: "ACC_R05", label: "ACC_R05", type: "receiver", sublabel: "Reused" },
      { id: "ACC_R06", label: "ACC_R06", type: "receiver", sublabel: "First-seen" },
    ],
    edges: [
      { id: "e0", from: "ACC_001", to: "BEN_103", amount: 1144000, channel: "via", time: "2026-06-07", txnId: "—", flagged: true },
      { id: "e1", from: "BEN_103", to: "ACC_R01", amount: 210000, channel: "NEFT", time: "08:00", txnId: "TXN_88001", flagged: true },
      { id: "e2", from: "BEN_103", to: "ACC_R02", amount: 190000, channel: "IMPS", time: "11:14", txnId: "TXN_99214", flagged: true },
      { id: "e3", from: "BEN_103", to: "ACC_R03", amount: 175000, channel: "IMPS", time: "13:42", txnId: "TXN_99217", flagged: true },
      { id: "e4", from: "BEN_103", to: "ACC_R04", amount: 198000, channel: "IMPS", time: "15:09", txnId: "TXN_99221", flagged: true },
      { id: "e5", from: "BEN_103", to: "ACC_R05", amount: 181000, channel: "NEFT", time: "21:30", txnId: "TXN_99229", flagged: true },
      { id: "e6", from: "BEN_103", to: "ACC_R06", amount: 190000, channel: "IMPS", time: "02:55", txnId: "TXN_99244", flagged: true },
    ],
    evidence: [
      { txnId: "TXN_88001", amount: 210000, receiver: "ACC_R01", channel: "NEFT", type: "fan-out" },
      { txnId: "TXN_99214", amount: 190000, receiver: "ACC_R02", channel: "IMPS", type: "fan-out" },
      { txnId: "TXN_99221", amount: 198000, receiver: "ACC_R04", channel: "IMPS", type: "fan-out" },
    ],
    agent: {
      recommendation: "Compliance escalation",
      riskLevel: "critical",
      summary:
        "Source account ACC_001 layered ₹11.44L through shared beneficiary BEN_103 across 6 receivers in 19h with channel hopping. Pattern is consistent with fan-out money mule layering.",
      reasons: [
        "6 AML-labeled transactions over 19h",
        "Total suspicious exposure ₹11.44L",
        "6 distinct receiver accounts",
        "Same beneficiary BEN_103 used across all transfers",
        "Channel switched NEFT → IMPS during burst",
        "Repeated high-value amounts in tight ₹1.7L–₹2.1L band",
      ],
      evidenceTxnIds: ["TXN_88001", "TXN_99214", "TXN_99217", "TXN_99221", "TXN_99229", "TXN_99244"],
      nextSteps: [
        "File SAR with FIU-IND",
        "Freeze ACC_001 outbound transfers",
        "Notify counterparty banks of ACC_R01–R06",
        "Open enhanced due diligence on BEN_103",
      ],
    },
  },
  {
    patternId: "AML_PAT_002",
    customerName: "Vikram Mehta",
    customerId: "CUST_55009",
    accountId: "ACC_003",
    patternType: "rapid_fund_movement",
    patternLabel: "Rapid in-out (mule behavior)",
    patternSummary:
      "ACC_003 received ₹23.4L from 3 sources and dispersed within 7 minutes to 4 receivers via IMPS.",
    exposure: 2340000,
    txnCount: 7,
    counterparties: 7,
    timeWindow: "7m",
    channels: ["IMPS", "UPI"],
    amlScore: 94,
    riskLevel: "critical",
    complianceRequired: true,
    signals: [
      { label: "Rapid in-out", detail: "Funds dispersed within 7 minutes of receipt." },
      { label: "Mule indicator", detail: "Net flow near zero, sustained over 5 days." },
      { label: "Multiple sources", detail: "3 sender accounts feeding ACC_003." },
    ],
    nodes: [
      { id: "ACC_S1", label: "ACC_S1", type: "source", sublabel: "Sender" },
      { id: "ACC_S2", label: "ACC_S2", type: "source", sublabel: "Sender" },
      { id: "ACC_S3", label: "ACC_S3", type: "source", sublabel: "Sender" },
      { id: "ACC_003", label: "ACC_003", type: "beneficiary", sublabel: "Mule" },
      { id: "ACC_X1", label: "ACC_X1", type: "receiver", sublabel: "Receiver" },
      { id: "ACC_X2", label: "ACC_X2", type: "receiver", sublabel: "Receiver" },
      { id: "ACC_X3", label: "ACC_X3", type: "receiver", sublabel: "Receiver" },
      { id: "ACC_X4", label: "ACC_X4", type: "receiver", sublabel: "Receiver" },
    ],
    edges: [
      { id: "e1", from: "ACC_S1", to: "ACC_003", amount: 800000, channel: "IMPS", time: "10:00", txnId: "TXN_M01", flagged: true },
      { id: "e2", from: "ACC_S2", to: "ACC_003", amount: 760000, channel: "IMPS", time: "10:02", txnId: "TXN_M02", flagged: true },
      { id: "e3", from: "ACC_S3", to: "ACC_003", amount: 780000, channel: "IMPS", time: "10:03", txnId: "TXN_M03", flagged: true },
      { id: "e4", from: "ACC_003", to: "ACC_X1", amount: 590000, channel: "IMPS", time: "10:05", txnId: "TXN_M04", flagged: true },
      { id: "e5", from: "ACC_003", to: "ACC_X2", amount: 580000, channel: "IMPS", time: "10:05", txnId: "TXN_M05", flagged: true },
      { id: "e6", from: "ACC_003", to: "ACC_X3", amount: 590000, channel: "UPI", time: "10:06", txnId: "TXN_M06", flagged: true },
      { id: "e7", from: "ACC_003", to: "ACC_X4", amount: 580000, channel: "UPI", time: "10:07", txnId: "TXN_M07", flagged: true },
    ],
    evidence: [
      { txnId: "TXN_M01", amount: 800000, receiver: "ACC_003", channel: "IMPS", type: "inflow" },
      { txnId: "TXN_M04", amount: 590000, receiver: "ACC_X1", channel: "IMPS", type: "outflow" },
      { txnId: "TXN_M06", amount: 590000, receiver: "ACC_X3", channel: "UPI", type: "outflow" },
    ],
    agent: {
      recommendation: "Compliance escalation + freeze",
      riskLevel: "critical",
      summary:
        "ACC_003 displays textbook mule behavior: ₹23.4L received from 3 sources and fully dispersed within 7 minutes to 4 receivers.",
      reasons: [
        "7 AML-labeled transactions in 7-minute window",
        "Total suspicious exposure ₹23.4L",
        "Net flow ≈ 0 over the day",
        "Mixed IMPS/UPI channels",
      ],
      evidenceTxnIds: ["TXN_M01", "TXN_M02", "TXN_M03", "TXN_M04", "TXN_M05", "TXN_M06", "TXN_M07"],
      nextSteps: ["Freeze ACC_003", "File SAR", "Alert receiver banks"],
    },
  },
  {
    patternId: "AML_PAT_003",
    customerName: "Anita Sharma",
    customerId: "CUST_77120",
    accountId: "ACC_002",
    patternType: "structuring",
    patternLabel: "Structuring under reporting threshold",
    patternSummary:
      "ACC_002 made 11 deposits of ₹48k–₹49.5k across 4 days, all just under the ₹50k threshold.",
    exposure: 540000,
    txnCount: 11,
    counterparties: 1,
    timeWindow: "4d",
    channels: ["Cash", "UPI"],
    amlScore: 71,
    riskLevel: "high",
    complianceRequired: true,
    signals: [
      { label: "Below-threshold sizing", detail: "All deposits ₹48k–₹49.5k (limit ₹50k)." },
      { label: "Repeated cadence", detail: "2–3 deposits/day for 4 consecutive days." },
    ],
    nodes: [
      { id: "ACC_002", label: "ACC_002", type: "source", sublabel: "Anita Sharma" },
      { id: "BEN_201", label: "BEN_201", type: "beneficiary", sublabel: "Self-deposit" },
      { id: "ACC_T1", label: "ACC_T1", type: "receiver", sublabel: "Self target" },
    ],
    edges: Array.from({ length: 11 }).map((_, i) => ({
      id: `s${i}`,
      from: "ACC_002",
      to: "ACC_T1",
      amount: 48000 + (i * 150) % 1500,
      channel: i % 2 === 0 ? "Cash" : "UPI",
      time: `Day ${Math.floor(i / 3) + 1}`,
      txnId: `TXN_S${100 + i}`,
      flagged: true,
    })),
    evidence: [
      { txnId: "TXN_S100", amount: 48000, receiver: "ACC_T1", channel: "Cash", type: "structured" },
      { txnId: "TXN_S105", amount: 49500, receiver: "ACC_T1", channel: "UPI", type: "structured" },
    ],
    agent: {
      recommendation: "AML investigation",
      riskLevel: "high",
      summary: "Structuring pattern: 11 deposits just below ₹50k threshold.",
      reasons: ["All txns ₹48k–₹49.5k", "Consistent daily cadence", "Same self-target account"],
      evidenceTxnIds: ["TXN_S100", "TXN_S105"],
      nextSteps: ["File CTR review", "Customer outreach for source-of-funds"],
    },
  },
];

/* -------- helpers -------- */

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export const monitoringStatusLabel: Record<MonitoringStatus, string> = {
  monitoring: "Monitoring",
  review_required: "Review required",
  freeze_recommended: "Freeze recommended",
  frozen: "Frozen",
  closed: "Closed",
};

export const recommendationLabel: Record<Recommendation, string> = {
  continue_monitoring: "Continue monitoring",
  hold_and_review: "Hold and review",
  freeze_recommended: "Freeze recommended",
  close_account: "Close account",
};

export const patternTypeLabel: Record<AmlPatternType, string> = {
  fan_out: "Fan-out layering",
  same_beneficiary_spread: "Same-beneficiary spread",
  structuring: "Structuring / smurfing",
  rapid_fund_movement: "Rapid fund movement",
  circular_transfers: "Circular transfers",
  mule_behavior: "Mule account behavior",
  dormant_reactivation: "Dormant reactivation",
  high_risk_counterparty: "High-risk counterparty",
};