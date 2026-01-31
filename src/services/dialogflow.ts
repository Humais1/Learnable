export type DialogflowResponse = {
  fulfillmentText: string;
  intent: string;
  confidence: number;
};

export const sendDialogflowText = async (
  text: string,
  sessionId: string,
  languageCode = 'en-US'
) => {
  const proxyUrl =
    process.env.EXPO_PUBLIC_DIALOGFLOW_PROXY_URL ??
    process.env.EXPO_PUBLIC_STT_PROXY_URL ??
    '';
  if (!proxyUrl) {
    throw new Error('Dialogflow proxy is not configured.');
  }

  const res = await fetch(`${proxyUrl.replace(/\/$/, '')}/dialogflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sessionId, languageCode }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Dialogflow request failed.');
  }
  return (await res.json()) as DialogflowResponse;
};
