import { complianceAgent } from "../../agents/complianceAgent.js";

export const complianceNode = async (state) => {
  const violations = await complianceAgent(state.caseId);

  return {
    ...state,
    violations
  };
};