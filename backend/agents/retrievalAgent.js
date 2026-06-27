import IntakeCase from "../models/IntakeCase.js";
import { retrieveRules } from "../services/ragService.js";

export const retrievalAgent = async (caseId) => {
  const intakeCase = await IntakeCase.findOne({ caseId });

  if (!intakeCase) {
    throw new Error("Case not found");
  }

  intakeCase.status = "processing";

  intakeCase.processingHistory.push({
    agent: "retrieval",
    action: "started",
    timestamp: new Date()
  });

  await intakeCase.save();

  const regulations = await retrieveRules(
    intakeCase.extractedText
  );

  intakeCase.retrievedRegulations =
  regulations.map(rule => ({
    title: rule.title,
    content: rule.chunkText
  }));

  intakeCase.currentAgent = "compliance";

  intakeCase.processingHistory.push({
    agent: "retrieval",
    action: "completed",
    timestamp: new Date()
  });

  await intakeCase.save();

  return intakeCase.retrievedRegulations;
  
};