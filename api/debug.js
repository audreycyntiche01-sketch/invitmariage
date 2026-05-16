const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzCGsowtXA9FPrTzpBHYegGEtL0_M-AguUYp_Z6d7GWP-7D7ahojqhLQrz-vvtyBKvGSQ/exec';

export default async function handler(req, res) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'validateCode', code: 'AC-TEST', deviceToken: 'debug' }),
      redirect: 'follow',
    });

    const text = await response.text();

    return res.status(200).json({
      httpStatus:   response.status,
      contentType:  response.headers.get('content-type'),
      finalUrl:     response.url,
      body200chars: text.slice(0, 200),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
