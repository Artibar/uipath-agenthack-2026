import { reportAgent } from "../../agents/reportAgent.js";

export const reportNode = async (state) => {
  const report = await reportAgent(state.caseId);

  return {
    ...state,
    report
  };
};