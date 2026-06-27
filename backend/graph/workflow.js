import {
  StateGraph,
  START,
  END
} from "@langchain/langgraph";

import { GraphState } from "./state.js";
import { retrievalNode } from "./nodes/retrievalNode.js";
import { complianceNode } from "./nodes/complianceNode.js";
import { reportNode } from "./nodes/reportNode.js";

const workflow = new StateGraph(GraphState);

workflow.addNode("retrievalNode", retrievalNode);
workflow.addNode("complianceNode", complianceNode);
workflow.addNode("reportNode", reportNode);

workflow.addEdge(START, "retrievalNode");
workflow.addEdge("retrievalNode", "complianceNode");
workflow.addEdge("complianceNode", "reportNode");
workflow.addEdge("reportNode", END);

export const graph = workflow.compile();