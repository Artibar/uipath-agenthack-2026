import { runWorkflow } from '../graph/index.js';

export const triggerUiPath = async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('🚀 UiPath Maestro running workflow for:', caseId);
    await runWorkflow(caseId);
    res.json({ success: true, caseId });
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};