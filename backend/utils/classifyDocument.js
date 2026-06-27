export const classifyDocument = (mimetype, source) => {
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
    if (mimetype === "application/msword") return "doc";
    if (mimetype.includes("video")) return "video";
    if (source?.startsWith("http")) return "url";
    throw new Error("Unsupported document type");
};

export const classifyDocumentCategory = (extractedText) => {
    if (!extractedText) return "general";
    
    const text = extractedText.toLowerCase();

    // ✅ Debug — see what text is being classified
    console.log("📄 TEXT PREVIEW:", text.substring(0, 500));

    // Resume/CV detection
    const cvKeywords = [
        "curriculum vitae", "resume", "work experience", "professional experience",
        "education", "skills", "internship", "full stack", "developer", "engineer",
        "gpa", "university", "college", "bachelor", "master", "b.tech", "m.tech",
        "projects", "achievements", "certifications", "linkedin", "github",
        "objective", "summary", "profile", "hobbies", "references"
    ];
    const cvMatches = cvKeywords.filter(k => text.includes(k));
    console.log("🎯 CV MATCHES:", cvMatches);
    console.log("🔢 CV COUNT:", cvMatches.length);

    // ✅ Lower threshold from 3 to 2
    if (cvMatches.length >= 2) return "resume";

    // Loan detection
    const loanKeywords = [
        "loan", "borrower", "lender", "interest rate",
        "emi", "repayment", "collateral", "credit score",
        "principal", "disbursement", "mortgage", "rbi",
        "cibil", "nbfc", "sanctioned amount", "loan agreement"
    ];
    const loanMatches = loanKeywords.filter(k => text.includes(k)).length;

    // Insurance detection
    const insuranceKeywords = [
        "insurance", "premium", "policy", "claim",
        "coverage", "insured", "beneficiary", "irdai",
        "deductible", "underwriter", "sum assured",
        "policyholder", "nominee", "maturity", "endowment"
    ];
    const insuranceMatches = insuranceKeywords.filter(k => text.includes(k)).length;

    // Vendor detection
    const vendorKeywords = [
        "vendor", "supplier", "contract", "procurement",
        "certificate", "iso", "soc", "compliance",
        "subcontractor", "purchase order", "invoice",
        "onboarding", "coi", "indemnity", "service agreement"
    ];
    const vendorMatches = vendorKeywords.filter(k => text.includes(k)).length;

    console.log(`📊 Category scores — loan:${loanMatches} insurance:${insuranceMatches} vendor:${vendorMatches} cv:${cvMatches.length}`);

    const scores = { loan: loanMatches, insurance: insuranceMatches, vendor: vendorMatches };
    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const topScore = Math.max(loanMatches, insuranceMatches, vendorMatches);

    return topScore >= 2 ? topCategory : "general";
};