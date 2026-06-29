import { extractionAgent } from "../../agents/extractionAgent.js";

export const extractionNode = async (state) => {
  const { caseId } = state;
  console.log('🔍 Extraction node running for:', caseId);
  await extractionAgent(caseId);
  return { caseId };
};