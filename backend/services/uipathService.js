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
    console.log('🔑 Full token response:', JSON.stringify(tokenData));
    const access_token = tokenData.access_token;
    console.log('✅ UiPath token received');

    // 🌐 Get Releases
    const releasesUrl = `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Releases`;
    console.log('🌐 Releases URL:', releasesUrl);

    const releasesRes = await fetch(releasesUrl, {
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

    // 💾 Update case status
    try {
      await IntakeCase.findOneAndUpdate(
        { caseId: caseId },
        {
          $set: {
            status: 'processing',
            uiPathTriggeredAt: new Date(),
            currentAgent: 'intake'
          }
        },
        { returnDocument: 'after' } // ✅ modern option instead of deprecated "new"
      );
      console.log('✅ Case marked as processing:', caseId);
    } catch (dbError) {
      console.warn('⚠️ Could not update case status:', dbError.message);
    }

    // 🚀 Trigger Job using /odata/Jobs
    const jobsUrl = `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Jobs`;
    console.log('🌐 Jobs URL:', jobsUrl);

    const jobRes = await fetch(jobsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      },
      body: JSON.stringify({
        startInfo: {
          ReleaseKey: release.Key,   // ✅ Use Key, not Id
          Strategy: "ModernJobsCount",
          JobsCount: 1,
          InputArguments: "{}"
        }
      })
    });

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
