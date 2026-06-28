import IntakeCase from '../models/IntakeCase.js';

export const triggerUiPathJob = async (caseId) => {
  try {
    // 🔑 Get token
    const tokenRes = await fetch('https://staging.uipath.com/identity_/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.UIPATH_CLIENT_ID,
        client_secret: process.env.UIPATH_CLIENT_SECRET,
      })
    });

    const tokenData = await tokenRes.json();
    const access_token = tokenData.access_token;
    console.log('✅ UiPath token received');

    // 💾 Update case status before triggering
    try {
      await IntakeCase.findOneAndUpdate(
        { caseId },
        {
          $set: {
            status: 'processing',
            uiPathTriggeredAt: new Date(),
            currentAgent: 'intake'
          }
        },
        { returnDocument: 'after' }
      );
      console.log('✅ Case marked as processing:', caseId);
    } catch (dbError) {
      console.warn('⚠️ Could not update case status:', dbError.message);
    }

    // 🚀 Trigger Maestro BPMN process instance
    const maestroUrl = `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/maestro_/api/v1/process-instances`;
    console.log('🌐 Maestro URL:', maestroUrl);

    const jobRes = await fetch(maestroUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      },
      body: JSON.stringify({
        processKey: 'Solution.agentic.Maestro.BPMN', // ✅ BPMN process key
        inputArguments: { caseId }                   // ✅ pass caseId to BPMN
      })
    });

    const jobText = await jobRes.text();
    console.log('📋 Maestro response status:', jobRes.status);
    console.log('📋 Maestro response:', jobText);

    if (!jobRes.ok) {
      throw new Error(`Maestro trigger failed: ${jobRes.status} - ${jobText}`);
    }

    const job = jobText ? JSON.parse(jobText) : {};
    console.log('✅ UiPath Maestro job triggered successfully!');
    console.log('📊 Process Instance ID:', job?.id || job?.processInstanceId);

    return {
      ...job,
      caseId
    };
  } catch (error) {
    console.error('❌ UiPath error:', error.message);
    throw error;
  }
};
