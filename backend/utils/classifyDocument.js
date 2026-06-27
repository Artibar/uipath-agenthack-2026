export const classifyDocument = (mimetype, source) => {
    // File format detection (keep as is)
    if (mimetype === "application/pdf") return "pdf";
    if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
    if (mimetype === "application/msword") return "doc";
    if (mimetype.includes("video")) return "video";
    if (source?.startsWith("http")) return "url";
    throw new Error("Unsupported document type");
};

// ✅ NEW: Separate function to classify document CATEGORY from extracted text
export const classifyDocumentCategory = (extractedText) => {
    if (!extractedText) return "general";
    
    const text = extractedText.toLowerCase();

    // Resume/CV detection — reject early
    const cvKeywords = ["curriculum vitae", "resume", "work experience", 
                        "education", "skills", "internship", "full stack", 
                        "developer", "engineer", "gpa", "university", "college"];
    const cvMatches = cvKeywords.filter(k => text.includes(k)).length;
    if (cvMatches >= 3) return "resume";

    // Loan document detection
    const loanKeywords = ["loan", "borrower", "lender", "interest rate", 
                          "emi", "repayment", "collateral", "credit score",
                          "principal", "disbursement", "mortgage", "rbi"];
    const loanMatches = loanKeywords.filter(k => text.includes(k)).length;

    // Insurance document detection
    const insuranceKeywords = ["insurance", "premium", "policy", "claim", 
                                "coverage", "insured", "beneficiary", "irdai",
                                "deductible", "underwriter", "sum assured"];
    const insuranceMatches = insuranceKeywords.filter(k => text.includes(k)).length;

    // Vendor document detection
    const vendorKeywords = ["vendor", "supplier", "contract", "procurement",
                            "certificate", "iso", "soc", "compliance", 
                            "subcontractor", "purchase order", "invoice"];
    const vendorMatches = vendorKeywords.filter(k => text.includes(k)).length;

    console.log(`📊 Category scores — loan:${loanMatches} insurance:${insuranceMatches} vendor:${vendorMatches} cv:${cvMatches}`);

    // Pick highest match
    const scores = { loan: loanMatches, insurance: insuranceMatches, vendor: vendorMatches };
    const category = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    
    // If no strong match, default to general
    const topScore = Math.max(loanMatches, insuranceMatches, vendorMatches);
    return topScore >= 2 ? category : "general";
};