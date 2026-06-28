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
  const { access_token } = await tokenRes.json();
  console.log('✅ UiPath token received');

  // ✅ Maestro BPMN uses process name directly — no release key needed
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
          ProcessKey: 'Maestro BPMN',   // ✅ process name instead of release key
          Strategy: 'All',
          RobotIds: [],
          InputArguments: JSON.stringify({ caseId })
        }
      })
    }
  );

  const job = await jobRes.json();
  console.log('✅ UiPath job triggered:', job);
  return job;
};