import { DEFAULT_RED_LINES } from "./playbook";
import type { DealInput, KeyTerms } from "./types";

// Fictional sample deal served from public/sample-deal.
export const SAMPLE_FILES = ["LOA_P2_Bored_Piling.txt", "Subcontract_Conditions_RevB.txt", "BQ_Summary_P2.csv"];

export const SAMPLE_DEAL: DealInput = {
  packageType: "Bored piling and empty bore works (Package P2)",
  contractValue: 2400000,
  fundingCommitment: 300000,
  advancePayment: 0,
  durationWeeks: 16,
  context:
    "We are a Grade G5 piling subcontractor in Selangor. Contoh Bina wants the LOA signed within 3 days so we can mobilise on 3 November. The subcontract conditions are still a draft (Rev B) and we haven't seen the main contract. Cash flow is our main worry: we have RM 300k available and our office and yard overhead runs about RM 35k a month. We haven't worked with Contoh Bina before.",
  standardForm: "Bespoke (main contractor's own conditions)",
  projectType: "private",
  stage: "loa",
  marginPct: 12,
  monthlyOverhead: 35000,
  redLines: DEFAULT_RED_LINES,
};

// Six-PDF reinforced concrete deal served from public/sample-deal-pdf. "Load sample deal" uses it when
// the app runs on a live model; demo mode and the landing page keep the piling deal above, which the
// demo replay is built from. Figures are from Appendix A and B; funding, margin and overhead are assumed.
export const SAMPLE_PDF_FILES = [
  "01_Letter_of_Award_5_Oct_2026.pdf",
  "02_Appendix_A_Commercial_Particulars.pdf",
  "03_Bill_of_Quantities_RC_Works_Extract.pdf",
  "04_Appendix_B_Programme_Time_and_LAD.pdf",
  "05_Conditions_of_Subcontract_Extract.pdf",
  "06_Document_Transmittal_Register.pdf",
];

export const SAMPLE_PDF_DEAL: DealInput = {
  packageType: "Reinforced concrete works",
  contractValue: 12000000,
  fundingCommitment: 1200000,
  advancePayment: 600000,
  durationWeeks: 104,
  context:
    "We are a reinforced concrete subcontractor. PBT has issued a Letter of Award for the Precinct 8 residential development in Putrajaya, 24 months from site possession. We haven't been shown the main contract terms that sit above this package. We have about RM 1.2m available for working capital and our overhead runs about RM 30k a month.",
  standardForm: "Bespoke (main contractor's own conditions)",
  projectType: "private",
  stage: "loa",
  marginPct: 12,
  monthlyOverhead: 30000,
  redLines: DEFAULT_RED_LINES,
};

// Terms as read from the sample documents (used by demo mode and the landing page).
export const SAMPLE_TERMS: KeyTerms = {
  contract_sum_rm: 2400000,
  completion_weeks: 16,
  claim_interval_days: 30,
  certification_days: 21,
  payment_due_days: 60,
  retention_pct: 10,
  retention_cap_pct: 5,
  advance_payment_pct: 0,
  lad_per_day_rm: 8000,
  lad_cap_pct: null,
  dlp_months: 24,
  performance_bond_pct: 5,
  pay_when_paid: true,
};
