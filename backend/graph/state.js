import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  caseId: Annotation(),
  retrievedRegulations: Annotation(),
  violations: Annotation(),
  report: Annotation()
});