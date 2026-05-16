/**
 * Vercel Serverless Function — Proxy Apps Script
 * Le navigateur envoie du JSON ici (même domaine, pas de CORS).
 * Ce proxy transmet à Apps Script en text/plain (contourne le CORS de Google).
 */

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzCGsowtXA9FPrTzpBHYegGEtL0_M-AguUYp_Z6d7GWP-7D7ahojqhLQrz-vvtyBKvGSQ/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    /* req.body est déjà parsé en objet par Vercel (Content-Type: application/json) */
    const payload = JSON.stringify(req.body);

    const response = await fetch(APPS_SCRIPT_URL, {
      method:   'POST',
      headers:  { 'Content-Type': 'text/plain' },
      body:     payload,
      redirect: 'follow',
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      /* Apps Script a renvoyé une page HTML (erreur de déploiement) */
      return res.status(502).json({
        success: false,
        message: 'Réponse inattendue du serveur. Vérifiez le déploiement Apps Script.',
        raw: text.slice(0, 200)
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur proxy : ' + err.message });
  }
}
