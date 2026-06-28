export const triggerUiPathJob = async (caseId) => {
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
  const access_token = tokenData.access_token;
  console.log('✅ UiPath token received');

  // ✅ Use Maestro API instead of Jobs API
  const jobRes = await fetch(
    `https://staging.uipath.com/${process.env.UIPATH_ACCOUNT}/${process.env.UIPATH_TENANT}/maestro_/api/v1/process-instances`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-UIPATH-OrganizationUnitId': process.env.UIPATH_FOLDER_ID
      },
      body: JSON.stringify({
        processKey: 'Solution.agentic.Maestro.BPMN',
        inputArguments: { caseId }
      })
    }
  );

  const jobText = await jobRes.text();
  console.log('📋 Maestro response status:', jobRes.status);
  console.log('📋 Maestro response:', jobText);

  if (!jobRes.ok) {
    throw new Error(`Maestro trigger failed: ${jobRes.status} - ${jobText}`);
  }

  const job = jobText ? JSON.parse(jobText) : {};
  console.log('✅ UiPath Maestro job triggered!');
  return job;
};