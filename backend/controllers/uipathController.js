import { triggerUiPathJob } from '../services/uipathService.js';
import IntakeCase from '../models/IntakeCase.js';

export const triggerUiPath = async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('🚀 UiPath Maestro running workflow for:', caseId);

    const intakeCase = await IntakeCase.findOne({ caseId });
    const result = await triggerUiPathJob(caseId, intakeCase.source);
    res.json({ success: true, caseId, uipath: result });
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};