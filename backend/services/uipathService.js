export const triggerUiPathJob = async (caseId) => {
  console.log('ℹ️ UiPath Maestro orchestrating caseId:', caseId);
  return { caseId, status: 'processing' };
};