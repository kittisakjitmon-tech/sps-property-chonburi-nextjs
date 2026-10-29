const key = process.env.OPENROUTER_API_KEY;

(async () => {
  if (!key) {
    console.log(JSON.stringify({ configured: false }));
    return;
  }
  const response = await fetch('https://openrouter.ai/api/v1/key', {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  let body = null;
  try { body = await response.json(); } catch { /* Do not expose response text. */ }
  console.log(JSON.stringify({
    configured: true,
    httpStatus: response.status,
    accepted: response.ok,
    errorCode: body?.error?.code || null,
    errorMessage: response.ok ? null : body?.error?.message || 'OpenRouter rejected the credential',
    keyMetadataReadable: response.ok && Boolean(body?.data),
  }, null, 2));
})().catch(error => {
  console.error(JSON.stringify({ checkFailed: error.message }));
  process.exitCode = 1;
});
