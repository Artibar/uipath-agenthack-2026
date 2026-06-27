import express from "express";
import { retrievalAgent } from "../agents/retrievalAgent.js";
import { complianceAgent } from "../agents/complianceAgent.js";

const router = express.Router();

router.post("/retrieval/:caseId", async (req, res) => {
  try {
    const result = await retrievalAgent(req.params.caseId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post("/compliance/:caseId", async (req, res) => {
  try {
    const result = await complianceAgent(req.params.caseId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;