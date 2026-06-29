export const triggerUiPathJob = async (caseId) => {
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
  console.log('✅ Token received');

  // ✅ Use API Trigger URL directly
  const triggerUrl = process.env.UIPATH_TRIGGER_URL; // set this in Render env
  
  const jobRes = await fetch(triggerUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ caseId })
  });

  const jobText = await jobRes.text();
  console.log('📋 Trigger status:', jobRes.status);
  console.log('📋 Trigger response:', jobText);

  if (!jobRes.ok) throw new Error(`Trigger failed: ${jobRes.status}`);
  return jobText ? JSON.parse(jobText) : { status: 'triggered' };
};