import IntakeCase from '../models/IntakeCase.js';

export const triggerUiPathJob = async (caseId) => {
  try {
    // ✅ CRITICAL: Fetch the case from DB to get the documentUrl
    const intakeCase = await IntakeCase.findOne({ caseId });
    
    if (!intakeCase) {
      throw new Error(`Case ${caseId} not found in database`);
    }
    
    const documentUrl = intakeCase.source; // Supabase URL from intake agent
    console.log('📄 Document URL from DB:', documentUrl);

    // ✅ Get access token from UiPath
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

    // ✅ Trigger URL
    const triggerUrl = process.env.UIPATH_TRIGGER_URL;
    console.log('🔗 Triggering UiPath Maestro:', triggerUrl);
    
    // ✅ SEND BOTH caseId AND documentUrl to UiPath
    const jobRes = await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        caseId,
        documentUrl  // ← Extraction Agent needs this!
      })
    });

    const jobText = await jobRes.text();
    console.log('📋 Trigger status:', jobRes.status);
    console.log('📋 Trigger response:', jobText);

    if (!jobRes.ok) {
      throw new Error(`UiPath trigger failed: ${jobRes.status} - ${jobText}`);
    }
    
    return jobText ? JSON.parse(jobText) : { status: 'triggered' };
  } catch (error) {
    console.error('❌ triggerUiPathJob error:', error.message);
    throw error;
  }
};