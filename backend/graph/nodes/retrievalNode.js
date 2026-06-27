import { retrievalAgent } from "../../agents/retrievalAgent.js";

export async function retrievalNode(state) {
  const regulations = await retrievalAgent(
    state.caseId
  );

  return {
    ...state,
    retrievedRegulations: regulations,
  };
}