export const triggerUiPathJob = async (caseId) => {
  // Get token
  const tokenRes = await fetch('https://account.uipath.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.UIPATH_CLIENT_ID,
      client_secret: process.env.UIPATH_CLIENT_SECRET,
      scope: 'OR.Jobs.Write OR.Execution.Write OR.Robots.Write'
    })
  });
  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;
  console.log('✅ UiPath token received');

  // ✅ First get the release key dynamically
  const releasesRes = await fetch(
    `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/orchestrator_/odata/Releases?$filter=Name eq 'Maestro BPMN'`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      }
    }
  );

  const releasesText = await releasesRes.text();
  console.log('📦 Releases response:', releasesText);

  const releasesData = JSON.parse(releasesText);
  const releaseKey = releasesData?.value?.[0]?.Key;

  if (!releaseKey) {
    throw new Error('Maestro BPMN process not found in Orchestrator');
  }

  console.log('✅ Release key found:', releaseKey);

  // Trigger job with release key
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
  console.log('📋 Job response:', jobText);

  const job = JSON.parse(jobText);
  console.log('✅ UiPath job triggered:', job);
  return job;
};