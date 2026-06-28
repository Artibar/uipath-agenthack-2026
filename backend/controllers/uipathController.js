import { triggerUiPathJob } from '../services/uipathService.js';

export const triggerUiPath = async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('🚀 Triggering UiPath Maestro for:', caseId);
    const job = await triggerUiPathJob(caseId);
    res.json({ success: true, data: job });
  } catch (error) {
    console.error('❌ UiPath error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};