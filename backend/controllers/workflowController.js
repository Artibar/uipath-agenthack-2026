import { runWorkflow } from "../graph/index.js";
import IntakeCase from '../models/IntakeCase.js';
import { reCheckAgent } from '../agents/reCheckAgent.js';

export const executeWorkflow = async (req, res) => {
  try {
    const { caseId } = req.params;

    const result = await runWorkflow(caseId);

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
};

export const getWorkflow = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const intakeCase = await IntakeCase.findOne({ caseId });
    
    if (!intakeCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    res.status(200).json({
      success: true,
      data: intakeCase
    });
  } catch (error) {
    console.log(`Error occurred`, error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const reCheckViolation = async (req, res) => {
  try {
    const { caseId, violationIndex } = req.params;
    const userId = req.user?.id || 'anonymous_reviewer';

    console.log('🔄 Recheck requested:', caseId, 'violation:', violationIndex);

    
    const result = await reCheckAgent(caseId, violationIndex, userId);

    const updatedCase = await IntakeCase.findOne({ caseId });

    return res.status(200).json({
      success: true,
      data: {
        caseId,
        reCheckResult: result,
        updatedViolation: updatedCase.complianceViolations[violationIndex],  // ✅ CHANGED
        status: updatedCase.status
      }
    });

  } catch (error) {
    console.error('❌ RECHECK ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};