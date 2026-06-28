export const triggerUiPathJob = async (caseId) => {
  console.log('ℹ️ Running workflow for caseId:', caseId);
  return { caseId, status: 'processing' };
};