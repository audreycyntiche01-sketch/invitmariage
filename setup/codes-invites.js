/**
 * Générateur de 50 codes uniques pour les invités civils
 * Usage : node setup/codes-invites.js
 *
 * Produit un fichier CSV prêt à coller dans Google Sheets
 * (onglet "Codes Civil")
 */

const codes = new Set();
while (codes.size < 50) {
  const n = Math.floor(Math.random() * 9000) + 1000;
  codes.add('AC-' + n);
}

const rows = ['code,nom_invite,actif,nb_utilisations,last_access,first_device,appareils_connus'];
[...codes].forEach(code => {
  rows.push(`${code},,TRUE,0,,,`);
});

const csv = rows.join('\n');
console.log(csv);

/* Pour sauvegarder dans un fichier :
   node setup/codes-invites.js > setup/codes.csv
   Puis importer dans Google Sheets
*/
