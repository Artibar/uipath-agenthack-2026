import Regulation from './models/Regulation.js'

export const seedRegulations = async () => {
  const regulations = [
    {
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
      title: "Contract Extraction Standards",
      content: `Extract from contracts:
- Party Names (exact legal names, not abbreviated)
- Effective Date and Term (e.g., "January 1, 2024 for 12 months" or "perpetual")
- Payment Terms (amount, currency, schedule, conditions)
- Key Obligations (what each party must do)
- Termination Clause (notice period, early termination rights, penalties)
- Liability Limits (caps, exclusions, indemnification)
- Confidentiality Terms (definition of confidential info, duration, exceptions)
- Amendment Process (how contract can be modified)
Flag incomplete extractions for secondary review.`
    },
    {
      title: "Contract Validation Checklist",
      content: `Before approval, contracts must pass:
1. Signature Authenticity: All required signatory blocks present and dated
2. Party Verification: Cross-reference parties against approved vendor/client lists
3. Authority Check: Signatory has power of attorney (verify via company records)
4. Financial Terms: Payment amounts align with approved budgets
5. Insurance Requirements: If applicable, insurance coverage verified
6. Compliance Clauses: Data protection (GDPR/CCPA), export controls present if needed
7. Conflict Review: No conflicting terms with existing agreements
8. Legal Review: Critical contracts flagged for legal team approval
Threshold: Contracts over $50,000 require additional approval.`
    },
    {
      title: "Compliance Document Classification",
      content: `Compliance documents fall into categories:
1. Regulatory Filings: Annual reports, tax filings, SEC submissions
   - Must include audit trail, certifications
2. Policy Documents: Company policies, procedures, guidelines
   - Must have version control, approval dates
3. Audit Reports: Internal/external audits, compliance assessments
   - Must identify gaps, remediation plans
4. Training Records: Employee compliance training, certifications
   - Must include completion dates, signatures
5. Incident Reports: Violations, breaches, non-compliance events
   - Must include investigation details, corrective actions
6. Vendor Compliance: Third-party certifications, compliance statements
   - Must verify currency and authenticity
Misclassified documents delay processing and require reclassification.`
    },
    {
      title: "Data Protection and Privacy Requirements",
      content: `All contracts and compliance docs must include:
1. GDPR Compliance (if EU data): Data processing agreement, legitimate basis, rights notice
2. CCPA Compliance (if US/California): Privacy notice, opt-out rights, data sale disclosure
3. Data Retention: How long personal data is kept, deletion procedures
4. Access Controls: Who can access data, authorization levels
5. Breach Notification: Timeline for notifying affected parties (typically 72 hours)
6. Sub-processor Policy: Vendor subcontracting restrictions
7. Cross-border Transfers: Mechanisms for lawful data transfer (SCCs, Adequacy Decision)
Contracts lacking data protection clauses cannot be approved for processing personal data.
Non-compliance risk: GDPR fines up to €20M or 4% annual revenue.`
    },
    {
      title: "Financial Terms Validation",
      content: `Contract financial sections must specify:
1. Base Amount: Total contract value in stated currency
2. Payment Schedule: Milestones, invoicing frequency (e.g., monthly, quarterly)
3. Late Payment Terms: Interest rate, grace period (standard 30 days)
4. Price Adjustments: Escalation clauses, inflation adjustments if applicable
5. Expenses: What is reimbursable, caps, approval thresholds
6. Penalties: Late delivery fees, service level agreement penalties
7. Discounts: Volume discounts, early payment discounts, conditions
8. Currency/FX: How exchange rates handled if multi-currency
Validation: Amounts must match PO, contract cannot exceed approved budget.
Flag: Contracts >$100,000 require CFO sign-off.`
    },
    {
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
- Ambiguous jurisdiction/governing law
- Outdated data protection language

LOW RISK (standard review):
- All required clauses present
- Current certifications verified
- Known, approved vendors
- Standard terms align with policy
- Compliance language current and comprehensive

Action: HIGH → escalate to compliance officer; MEDIUM → legal review; LOW → proceed with approval.`
    },
    {
      title: "Vendor and Third-Party Compliance",
      content: `When processing vendor contracts or compliance docs:
1. Vendor Verification: Check against approved vendor database
2. Insurance: Request COI (Certificate of Insurance), verify coverage types and amounts
3. Certifications: ISO 27001, SOC 2 Type II, industry-specific (PCI-DSS, HIPAA)
   - Verify certification is current (not expired)
4. Financial Stability: Review Dun & Bradstreet rating, payment history
5. Conflict of Interest: Vendor must not compete with our business
6. References: Contact previous clients for performance verification
7. Background Check: For vendors with access to sensitive data
8. Sub-contractor Policy: Vendor must disclose any subcontracting and obtain approval
Non-compliant vendors cannot be onboarded; flag for procurement review.`
    },
    {
      title: "Termination and Exit Provisions",
      content: `Contracts must clearly define end-of-life procedures:
1. Termination Types:
   - For Cause: Breach, insolvency, material non-performance
   - For Convenience: Either party can exit (usually with notice period)
   - Automatic Renewal: Must specify if auto-renews and notice period to cancel
2. Notice Period: Minimum 30 days recommended; critical services 90 days
3. Wind-Down: Post-termination obligations (data return, transition assistance)
4. Payment Upon Termination: Final invoices, retainers, penalties if applicable
5. IP Rights: Ownership of work product, return of materials
6. Confidentiality: Does confidentiality survive termination? (typically 2-3 years)
7. Liability: Are liability caps waived for breach claims?
Contracts missing termination clauses create operational risk; flag for legal.`
    },
    {
      title: "Document Quality and Authenticity Standards",
      content: `For all extracted and processed documents:
1. OCR Quality: Text confidence ≥85% for digital extraction
2. Signature Verification: 
   - Digital signatures: Verify cryptographic validity
   - Wet signatures: Visually confirm presence, date within 6 months
   - E-signature: Verify audit trail (DocuSign, Adobe Sign logs)
3. Metadata: Check document creation date, modification date, author
4. Completeness: All pages present (page counts match), no blank/corrupted pages
5. Redaction: Flag if critical sections redacted without justification
6. Format: Original format preserved (PDF preferred for legal docs)
7. Chain of Custody: Document origin and handling history traceable
Documents failing quality checks require re-submission or manual verification.`
    },
    {
      title: "Audit Trail and Record Keeping",
      content: `Compliance documentation requires:
1. Creation: Date, author, original source document reference
2. Modifications: Version history, change logs, who approved changes
3. Approvals: Signature/initials from authorized approvers, dates
4. Retention: Minimum 7 years for financial contracts, 5 years for others
5. Access Log: Who accessed document, when, for what purpose
6. Disposal: Secure deletion process, certificates of destruction
7. Storage: Encrypted, backed up, access-controlled repository
8. Attestation: Authorized custodian confirms document authenticity
Non-compliant record-keeping violates SOX, HIPAA, and regulatory audit requirements.`
    }
  ];

  try {
    // Clear existing to avoid duplicates
    await Regulation.deleteMany({});
    
    // Insert all regulations
    const inserted = await Regulation.insertMany(regulations);
    
    console.log(`✅ Seeded ${inserted.length} regulations (contracts + compliance)`);
    return inserted;
  } catch (error) {
    console.error("❌ Seed error:", error);
    throw error;
  }
};