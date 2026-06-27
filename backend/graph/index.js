import { graph } from "./workflow.js";

export const runWorkflow = async (caseId) => {
  return await graph.invoke({ caseId });
};