export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Received request body:', req.body);

    const n8nResponse = await fetch('https://expandingtogether.app.n8n.cloud/webhook/e695e382-99dc-4925-b500-354a4275ffd2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    console.log('n8n response status:', n8nResponse.status);

    if (!n8nResponse.ok) {
      throw new Error(`n8n responded with status: ${n8nResponse.status}`);
    }

    // Try to get response as text first
    const responseText = await n8nResponse.text();
    console.log('n8n response text:', responseText);

    // Try to parse as JSON
let responseData;
try {
  responseData = JSON.parse(responseText);
  
  // If the parsed data has an output field that's also JSON, parse it again
  if (responseData.output && typeof responseData.output === 'string') {
    try {
      const nestedData = JSON.parse(responseData.output);
      if (nestedData.output) {
        responseData = nestedData; // Use the inner JSON
      }
    } catch (e) {
      // If inner parsing fails, keep the outer structure
    }
  }
} catch (e) {
  // If not JSON, return as text
  responseData = { output: responseText };
}

res.status(200).json(responseData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
