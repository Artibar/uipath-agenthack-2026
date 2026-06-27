import express from "express";
import { executeWorkflow ,  getWorkflow, reCheckViolation} from "../controllers/workflowController.js";

const router = express.Router();

router.post("/:caseId", executeWorkflow);
router.get("/:caseId", getWorkflow);
router.post('/:caseId/recheck/:violationIndex', reCheckViolation);
export default router;