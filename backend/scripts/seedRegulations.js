import mongoose from "mongoose";
import dotenv from "dotenv";
import RegulationChunk from "../models/RegulationChunk.js";
import { createEmbedding } from "../services/embeddingService.js";

dotenv.config();

const regulations = [
  // ─── VENDOR ───────────────────────────────────────────
  {
    category: "vendor",
    title: "Certificate of Insurance (COI)",
    chunkText: "Vendors must provide a valid Certificate of Insurance (COI) covering general liability, workers compensation, and professional indemnity before onboarding. Minimum coverage of $1M per occurrence required."
  },
  {
    category: "vendor",
    title: "ISO Certifications",
    chunkText: "Vendors handling sensitive data must hold ISO 27001 or SOC 2 Type II certification. Industry-specific certifications must be valid and renewed annually."
  },
  {
    category: "vendor",
    title: "Vendor Verification",
    chunkText: "All vendors must be verified against the approved vendor database before contract execution. Unverified vendors cannot receive purchase orders or payments."
  },
  {
    category: "vendor",
    title: "Background Check Policy",
    chunkText: "Vendors with access to sensitive company data or premises must provide background check clearance for all assigned personnel. Checks must be conducted within the last 12 months."
  },
  {
    category: "vendor",
    title: "Sub-contractor Policy",
    chunkText: "Vendors must disclose any subcontracting arrangements and obtain written approval before engaging subcontractors. Subcontractors are subject to the same compliance requirements."
  },
  {
    category: "vendor",
    title: "Financial Stability",
    chunkText: "Vendors must provide a Dun & Bradstreet rating or equivalent financial stability proof. Vendors with poor payment history or bankruptcy filings within 5 years may be disqualified."
  },
  {
    category: "vendor",
    title: "Conflict of Interest",
    chunkText: "Vendors must disclose any conflict of interest with the contracting organization, its employees, or competitors. Undisclosed conflicts may result in contract termination."
  },
  {
    category: "vendor",
    title: "References",
    chunkText: "Vendors must provide at least 3 references from previous clients in a similar industry. References must be verifiable and from projects completed within the last 3 years."
  },

  // ─── INSURANCE ────────────────────────────────────────
  {
    category: "insurance",
    title: "IRDAI KYC Requirements",
    chunkText: "As per IRDAI regulations, all insurance policyholders must complete KYC verification including Aadhaar, PAN, and address proof before policy issuance. Incomplete KYC results in policy rejection."
  },
  {
    category: "insurance",
    title: "Insurance Claim Documentation",
    chunkText: "Insurance claims must include original policy document, claim form, proof of loss, FIR copy (if applicable), medical records (for health claims), and bank account details for settlement."
  },
  {
    category: "insurance",
    title: "Premium Payment Compliance",
    chunkText: "Premiums must be paid within the grace period (30 days for annual, 15 days for monthly). Lapsed policies require revival with arrears and medical examination if lapsed over 2 years."
  },
  {
    category: "insurance",
    title: "Sum Assured Disclosure",
    chunkText: "The sum assured and coverage limits must be clearly stated in the policy document. Any sub-limits, exclusions, or waiting periods must be disclosed at the time of policy issuance."
  },
  {
    category: "insurance",
    title: "Nominee Declaration",
    chunkText: "All life insurance policies must have a registered nominee. Nominee details including name, relationship, date of birth, and Aadhaar must be provided and verified."
  },
  {
    category: "insurance",
    title: "Pre-existing Disease Disclosure",
    chunkText: "Policyholders must disclose all pre-existing medical conditions at the time of application. Non-disclosure of pre-existing conditions is grounds for claim rejection under IRDAI guidelines."
  },
  {
    category: "insurance",
    title: "Policy Exclusions",
    chunkText: "Insurance policies must clearly document all exclusions including acts of war, self-inflicted injuries, and criminal activities. Exclusions must be communicated to the policyholder in writing."
  },

  // ─── LOAN ─────────────────────────────────────────────
  {
    category: "loan",
    title: "RBI Income Verification",
    chunkText: "As per RBI guidelines, lenders must verify borrower income through salary slips (last 3 months), Form 16, or ITR (last 2 years) before loan approval. Self-employed borrowers must provide CA-certified financials."
  },
  {
    category: "loan",
    title: "Credit Score Requirement",
    chunkText: "Minimum CIBIL score of 750 required for personal loans and 700 for home loans as per standard banking norms. Scores below threshold require additional collateral or guarantor."
  },
  {
    category: "loan",
    title: "KYC Documentation for Loans",
    chunkText: "Loan applicants must provide valid KYC documents: Aadhaar card, PAN card, passport-size photographs, and address proof. Business loans require GST registration and business proof."
  },
  {
    category: "loan",
    title: "Debt-to-Income Ratio",
    chunkText: "Total EMI obligations must not exceed 50% of net monthly income as per RBI fair lending practices. Borrowers exceeding this ratio must provide additional income proof or reduce loan amount."
  },
  {
    category: "loan",
    title: "Collateral and Security",
    chunkText: "Secured loans require valid collateral documentation including property papers, valuation report, and encumbrance certificate. Collateral value must cover minimum 125% of loan amount."
  },
  {
    category: "loan",
    title: "Loan Agreement Terms",
    chunkText: "Loan agreements must clearly state interest rate (fixed/floating), processing fees, prepayment charges, and penal interest. All terms must be disclosed before disbursement per RBI transparency norms."
  },
  {
    category: "loan",
    title: "Anti-Money Laundering (AML)",
    chunkText: "Lenders must conduct AML checks on all borrowers above Rs 10 lakh. Source of funds must be declared and verified. Suspicious transactions must be reported to Financial Intelligence Unit (FIU-IND)."
  },
  {
    category: "loan",
    title: "Repayment Schedule",
    chunkText: "A clear repayment schedule with EMI breakup (principal + interest) must be provided to borrowers before disbursement. Any changes to repayment terms require written consent from borrower."
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ✅ Clear old chunks
    await RegulationChunk.deleteMany({});
    console.log("🗑️ Cleared old regulation chunks");

    const fakeRegulationId = new mongoose.Types.ObjectId();

    for (const reg of regulations) {
      console.log(`📝 Embedding: ${reg.title}`);
      const embedding = await createEmbedding(reg.chunkText);

      await RegulationChunk.create({
        regulationId: fakeRegulationId,
        title: reg.title,
        chunkText: reg.chunkText,
        embedding,
        chunkIndex: 0,
        category: reg.category  // ✅ save category
      });

      console.log(`✅ Saved: [${reg.category}] ${reg.title}`);
    }

    console.log(`\n🎉 Seeded ${regulations.length} regulation chunks successfully!`);
    await mongoose.disconnect();

  } catch (error) {
    console.error("❌ Seed error:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();