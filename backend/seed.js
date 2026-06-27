import Regulation from './models/Regulation.js';

export const seedRegulations = async () => {
  const regulations = [
    // ─── VENDOR ───────────────────────────────────────────
    {
      category: "vendor",
      title: "Vendor Verification",
      content: `Vendor onboarding compliance requires:
1. Vendor Verification: Check against approved vendor database before contract execution
2. Certificate of Insurance (COI): Must provide COI covering general liability minimum $1M
3. Workers Compensation: Valid coverage for all assigned personnel
4. Professional Indemnity: Required for vendors providing professional services
5. ISO Certifications: ISO 27001 or SOC 2 Type II mandatory for data-handling vendors
6. PCI-DSS/HIPAA: Industry-specific certifications must be current and not expired
Non-compliant vendors cannot be onboarded; flag for procurement review.`
    },
    {
      category: "vendor",
      title: "Vendor Background and Financial Check",
      content: `Before vendor approval:
1. Background Check: All personnel with sensitive data access must clear background verification within last 12 months
2. Financial Stability: Dun & Bradstreet rating required; bankruptcy filings in last 5 years = disqualified
3. References: Minimum 3 client references from similar industry, projects within last 3 years
4. Conflict of Interest: Vendor must not compete with contracting organization; written disclosure required
5. Sub-contractor Policy: Must disclose and get written approval for any subcontracting arrangements
6. Subcontractor Compliance: All subcontractors subject to same compliance requirements as primary vendor
Flag incomplete vendor profiles for procurement review.`
    },
    {
      category: "vendor",
      title: "Vendor Contract Validation",
      content: `Vendor contracts must include:
1. Scope of Work: Clearly defined deliverables, timelines, and acceptance criteria
2. Payment Terms: Invoice schedule, payment period (Net 30/60), late payment penalties
3. Data Protection: GDPR/CCPA clauses if vendor handles personal data
4. Termination Clause: For cause and for convenience terms with notice period
5. IP Ownership: Work product ownership clearly assigned
6. Liability Cap: Maximum liability defined, indemnification terms
7. Audit Rights: Right to audit vendor compliance annually
Contracts missing critical sections must be flagged for legal review.`
    },

    // ─── INSURANCE ────────────────────────────────────────
    {
      category: "insurance",
      title: "IRDAI KYC and Policy Issuance Requirements",
      content: `As per IRDAI regulations for insurance compliance:
1. KYC Mandatory: Aadhaar, PAN, address proof required before policy issuance
2. Incomplete KYC: Results in automatic policy rejection
3. Nominee Declaration: Life insurance must have registered nominee with name, relationship, DOB, Aadhaar
4. Sum Assured Disclosure: Coverage limits, sub-limits, exclusions must be stated in policy document
5. Waiting Periods: All waiting periods must be disclosed upfront to policyholder in writing
6. Policy Document: Must be issued within 15 days of premium receipt as per IRDAI norms
7. Free Look Period: 15-day free look period must be offered for all life insurance policies
Non-compliant policies must be flagged for IRDAI regulatory review.`
    },
    {
      category: "insurance",
      title: "Insurance Claim Documentation Requirements",
      content: `Insurance claims must include following documentation:
1. Original Policy Document: Valid, active policy at time of loss
2. Duly Filled Claim Form: Signed by policyholder or nominee
3. Proof of Loss: Bills, invoices, FIR copy (for theft/accident), death certificate (life claims)
4. Medical Records: For health/life claims — hospital records, discharge summary, prescriptions
5. Bank Account Details: Cancelled cheque or passbook copy for settlement
6. Pre-existing Disease Disclosure: Must match application; non-disclosure = claim rejection
7. Exclusions Check: Verify claim does not fall under policy exclusions (war, self-harm, criminal acts)
8. Premium Payment Proof: All premiums must be paid and policy must be active
Claims with incomplete documentation must be returned within 7 days as per IRDAI guidelines.`
    },
    {
      category: "insurance",
      title: "Insurance Premium and Policy Compliance",
      content: `Premium and policy compliance requirements:
1. Grace Period: 30 days for annual premium, 15 days for monthly premium payment
2. Lapsed Policy: Revival requires arrears payment + medical exam if lapsed over 2 years
3. Policy Exclusions: All exclusions must be communicated in writing at issuance
4. Fraud Detection: Material misrepresentation or fraud voids policy from inception
5. Surrender Value: Policies must disclose guaranteed surrender value after 3 years
6. Agent Disclosure: Selling agent details, commission disclosure required under IRDAI norms
7. Grievance Redressal: Insurer must resolve complaints within 15 days per IRDAI guidelines
8. Ombudsman Rights: Policyholder must be informed of Insurance Ombudsman rights
Flag policies with missing disclosures for compliance review.`
    },

    // ─── LOAN ─────────────────────────────────────────────
    {
      category: "loan",
      title: "RBI Loan Eligibility and KYC Requirements",
      content: `As per RBI guidelines for loan compliance:
1. KYC Mandatory: Aadhaar, PAN, address proof, passport-size photos required for all borrowers
2. Income Verification: Salary slips (last 3 months) + Form 16 for salaried; ITR (last 2 years) for self-employed
3. CA Certified Financials: Self-employed borrowers must provide CA-certified profit & loss and balance sheet
4. Business Proof: Business loans require GST registration certificate and business vintage proof
5. Credit Score: Minimum CIBIL 750 for personal loans, 700 for home loans
6. Low Credit Score: Requires additional collateral or co-applicant/guarantor
7. Employment Stability: Minimum 2 years employment for salaried, 3 years business vintage for self-employed
Flag applications with incomplete KYC or income documents for rejection.`
    },
    {
      category: "loan",
      title: "RBI Loan Financial Compliance",
      content: `Loan financial compliance requirements per RBI fair lending practices:
1. Debt-to-Income Ratio: Total EMI must not exceed 50% of net monthly income
2. Collateral Requirements: Secured loans need property papers, valuation report, encumbrance certificate
3. Collateral Coverage: Minimum 125% of loan amount must be covered by collateral value
4. Loan Agreement: Must clearly state interest rate (fixed/floating), processing fees, prepayment charges
5. Penal Interest: Penal charges must be disclosed before disbursement
6. Disbursement Conditions: All conditions precedent must be met before funds released
7. EMI Schedule: Clear repayment schedule with principal + interest breakup mandatory
8. Prepayment Terms: Prepayment charges must be disclosed upfront; nil charges for floating rate per RBI
Flag loans exceeding debt-to-income ratio for rejection or restructuring.`
    },
    {
      category: "loan",
      title: "AML and Fraud Prevention for Loans",
      content: `Anti-money laundering and fraud compliance for loans per RBI/FIU-IND:
1. AML Check: Mandatory for all loans above Rs 10 lakh
2. Source of Funds: Declaration and verification of income source required
3. Suspicious Transactions: Must be reported to Financial Intelligence Unit (FIU-IND)
4. Politically Exposed Persons (PEP): Enhanced due diligence required for PEPs
5. Negative List Check: Borrower must be checked against RBI defaulter list and CIBIL fraud registry
6. Property Verification: For home loans, legal title search and encumbrance check mandatory
7. Valuation: Independent property valuation by bank-approved valuer required
8. Insurance: Home loan must be covered by property insurance; life insurance recommended
Non-compliant loan applications must be rejected and reported as per PMLA guidelines.`
    },

    // ─── GENERAL CONTRACT (keep your existing ones) ────────
    {
      category: "general",
      title: "Contract Identification Rules",
      content: `A valid contract must contain:
1. Parties: Clear identification of all contracting parties (names, legal entities, addresses)
2. Effective Date: Start date and term duration (fixed or perpetual)
3. Consideration: Exchange of value, payment terms, or mutual obligations
4. Signatures: Authorized signatories from all parties
5. Governing Law: Jurisdiction and applicable law clause
6. Contract Type: Must be identified as Service Agreement, NDA, Purchase Agreement, Employment Contract, License Agreement, or Lease Agreement
Violations: Missing any critical section requires manual review flag.`
    },
    {
      category: "general",
      title: "Compliance Risk Assessment Matrix",
      content: `Risk scoring for regulatory compliance:
HIGH RISK (immediate action):
- Sanctioned parties involved (OFAC, EU, UN lists)
- Intellectual property theft or infringement allegations
- Data breach or security incident
- Environmental/health violations
- Fraud indicators
MEDIUM RISK (review required):
- Missing critical compliance clauses
- Expired certifications (ISO, SOC 2)
- Unverified vendor credentials
LOW RISK (standard review):
- All required clauses present
- Current certifications verified
- Known, approved vendors
Action: HIGH → escalate to compliance officer; MEDIUM → legal review; LOW → proceed.`
    },
    {
      category: "general",
      title: "Data Protection and Privacy Requirements",
      content: `All contracts and compliance docs must include:
1. GDPR Compliance: Data processing agreement, legitimate basis, rights notice
2. CCPA Compliance: Privacy notice, opt-out rights, data sale disclosure
3. Data Retention: How long personal data is kept, deletion procedures
4. Breach Notification: Timeline for notifying affected parties (72 hours)
5. Sub-processor Policy: Vendor subcontracting restrictions
Non-compliance risk: GDPR fines up to €20M or 4% annual revenue.`
    },
    {
      category: "general",
      title: "Audit Trail and Record Keeping",
      content: `Compliance documentation requires:
1. Retention: Minimum 7 years for financial contracts, 5 years for others
2. Version History: All modifications tracked with approver and date
3. Access Log: Who accessed document, when, for what purpose
4. Secure Storage: Encrypted, backed up, access-controlled repository
5. Disposal: Secure deletion process with certificates of destruction
Non-compliant record-keeping violates SOX, HIPAA, and regulatory audit requirements.`
    }
  ];

  try {
    await Regulation.deleteMany({});
    const inserted = await Regulation.insertMany(regulations);
    console.log(`✅ Seeded ${inserted.length} regulations across vendor/insurance/loan/general`);
    return inserted;
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  }
};