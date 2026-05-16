/**
 * Vercel Serverless Function — Proxy Apps Script
 * Évite les problèmes CORS : le navigateur appelle /api/proxy (même domaine),
 * Vercel appelle Apps Script côté serveur (pas de CORS).
 */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzCGsowtXA9FPrTzpBHYegGEtL0_M-AguUYp_Z6d7GWP-7D7ahojqhLQrz-vvtyBKvGSQ/exec';

export default async function handler(req, res) {
  /* CORS pour le navigateur */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: body,
      redirect: 'follow',
    });

    const text = await response.text();
    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur proxy : ' + err.message });
  }
}
