import IntakeCase from '../models/IntakeCase.js'; 

export const triggerUiPathJob = async (caseId) => {
  try {
    // Get token
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
    console.log('🔑 Full token response:', JSON.stringify(tokenData));
    const access_token = tokenData.access_token;
    console.log('✅ UiPath token received');

    // Get all releases
    const url = `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/api/Job`;
    console.log('🌐 Releases URL:', url);

    const releasesRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      }
    });

    console.log('📡 Releases status:', releasesRes.status);
    const releasesText = await releasesRes.text();
    console.log('📦 Releases response:', releasesText);

    if (!releasesText) {
      throw new Error(`Empty response from Releases API. Status: ${releasesRes.status}`);
    }

    const releasesData = JSON.parse(releasesText);
    const release = releasesData?.value?.[0];

    if (!release) {
      throw new Error('Maestro BPMN process not found in Orchestrator');
    }

    console.log('✅ Release found:', release.Name, '(ID:', release.Id, ')');
    console.log('📌 Processing caseId:', caseId);

    // ✅ Mark case as "processing" so BPMN knows to handle it
    console.log('💾 Updating case status for BPMN:', caseId);
    
    try {
      await IntakeCase.findByIdAndUpdate(caseId, {
        $set: {
          status: 'processing',  // ✅ Use existing status from schema
          uiPathTriggeredAt: new Date(),
          currentAgent: 'intake'  // Signal BPMN to start
        }
      }, { new: true });
      console.log('✅ Case marked as processing:', caseId);
    } catch (dbError) {
      console.warn('⚠️ Could not update case status:', dbError.message);
      // Continue anyway - job is still triggered
    }

    // ✅ Trigger UiPath job WITHOUT inputArguments (fixes 405 error)
    const jobRes = await fetch(
      `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Jobs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
        },
        body: JSON.stringify({
          releaseId: release.Id,
          strategy: 'All'
          // ✅ NO inputArguments - BPMN will query DB instead
        })
      }
    );

    const jobText = await jobRes.text();
    console.log('📋 Job response status:', jobRes.status);
    console.log('📋 Job response:', jobText);

    if (!jobText) {
      throw new Error(`Empty response from Jobs API. Status: ${jobRes.status}`);
    }

    if (!jobRes.ok) {
      throw new Error(`UiPath job creation failed: ${jobRes.status} - ${jobText}`);
    }

    const job = JSON.parse(jobText);
    console.log('✅ UiPath job triggered successfully!');
    console.log('📊 Job ID:', job?.Id || job?.value?.[0]?.Id);
    console.log('📌 BPMN will process caseId:', caseId);
    
    return {
      ...job,
      caseId: caseId
    };
  } catch (error) {
    console.error('❌ UiPath error:', error.message);
    throw error;
  }
};