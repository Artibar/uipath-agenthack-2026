export const triggerUiPathJob = async (caseId) => {
  // Get token
 const tokenRes = await fetch('https://staging.uipath.com/identity_/connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.UIPATH_CLIENT_ID,
    client_secret: process.env.UIPATH_CLIENT_SECRET,
    scope: 'OR.Jobs.Write OR.Execution.Write OR.Robots.Write OR.Folders.Read'
  })
});
  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;
  console.log('✅ UiPath token received');
  console.log('🔑 Account:', process.env.UIPATH_ACCOUNT);
  console.log('🔑 Tenant:', process.env.UIPATH_TENANT);
  console.log('🔑 Folder ID:', process.env.UIPATH_FOLDER_ID);

  // ✅ Try without filter first — get ALL releases
  const url = `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Releases`;
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
  const releaseKey = releasesData?.value?.[0]?.Key;

  if (!releaseKey) {
    throw new Error('Maestro BPMN process not found in Orchestrator');
  }

  console.log('✅ Release key found:', releaseKey);

  const jobRes = await fetch(
    `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      },
      body: JSON.stringify({
        startInfo: {
          ReleaseKey: releaseKey,
          Strategy: 'All',
          RobotIds: [],
          InputArguments: JSON.stringify({ caseId })
        }
      })
    }
  );

  const jobText = await jobRes.text();
  console.log('📋 Job response status:', jobRes.status);
  console.log('📋 Job response:', jobText);

  if (!jobText) throw new Error('Empty response from Jobs API');
  
  const job = JSON.parse(jobText);
  console.log('✅ UiPath job triggered:', job);
  return job;
};