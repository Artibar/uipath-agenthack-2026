import IntakeCase from "../models/IntakeCase.js";
import { retrieveRules } from "../services/ragService.js";
import { classifyDocumentCategory } from "../utils/classifyDocument.js";  // ✅ new import

export const retrievalAgent = async (caseId) => {
  const intakeCase = await IntakeCase.findOne({ caseId });
  if (!intakeCase) throw new Error("Case not found");

  intakeCase.status = "retrieving";
  intakeCase.processingHistory.push({
    agent: "retrieval", action: "started", timestamp: new Date()
  });
  await intakeCase.save();

  // ✅ Detect document category from extracted text
  const category = classifyDocumentCategory(intakeCase.extractedText);
  console.log(`📂 Document category detected: ${category}`);

  // ✅ Reject resumes early
  if (category === "resume") {
    intakeCase.status = "failed";
    intakeCase.report = {
      summary: "This appears to be a CV/Resume, not a compliance document. Please upload a vendor contract, insurance policy, or loan application.",
      riskLevel: "LOW",
      recommendedActions: ["Upload the correct document type"],
      nextSteps: "Please resubmit with a vendor, insurance, or loan document."
    };
    await intakeCase.save();
    throw new Error("Document appears to be a CV/Resume, not a compliance document");
  }

  // ✅ Pass category to retrieval
  const regulations = await retrieveRules(intakeCase.extractedText, category);

  intakeCase.retrievedRegulations = regulations.map(rule => ({
    title: rule.title,
    content: rule.chunkText
  }));

  // ✅ Store category on case for compliance agent to use
  intakeCase.investigationType = category;
  intakeCase.status = "retrieved";
  intakeCase.currentAgent = "compliance";
  intakeCase.processingHistory.push({
    agent: "retrieval", action: "completed", timestamp: new Date(),
    metadata: { regulationsCount: regulations.length, category }
  });

  await intakeCase.save();
  return intakeCase.retrievedRegulations;
};