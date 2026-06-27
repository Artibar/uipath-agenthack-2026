import express from "express";
import { executeWorkflow ,  getWorkflow} from "../controllers/workflowController.js";

const router = express.Router();

router.post("/:caseId", executeWorkflow);
router.get("/:caseId", getWorkflow);

export default router;