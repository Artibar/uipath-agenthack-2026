import { triggerUiPathJob } from '../services/uipathService.js';

export const triggerUiPath = async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('🚀 UiPath Maestro running workflow for:', caseId);
    const result = await triggerUiPathJob(caseId);
    res.json({ success: true, caseId, uipath: result });
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};