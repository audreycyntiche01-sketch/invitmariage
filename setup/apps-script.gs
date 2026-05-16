/**
 * ════════════════════════════════════════════════════════
 * GOOGLE APPS SCRIPT — Mariage Audrey & Cyntiche — Juillet 2026
 *
 * Fonctionnalités :
 *   1. Validation codes invités Civil (AC-XXXX)
 *   2. Inscription soirée avec affectation automatique de table
 *   3. Reconnexion depuis un autre appareil
 *
 * INSTALLATION :
 * Déployer > Nouveau déploiement > Application Web
 *   - Exécuter en tant que : Moi
 *   - Accès : Tout le monde
 * ════════════════════════════════════════════════════════
 */

var SHEET_ID          = '1ElMCEa8MRbfmbszCp70q7VyIBZ5GLb-wRcgm2VyYsHM';
var SHEET_NAME_CODES  = 'Codes Civil';
var SHEET_NAME_SOIREE = 'Inscriptions Soirée';

/* ════════════════════════════════════════════════════════
   NOMS DES 31 TABLES (souvenirs du couple)
   Les mariés peuvent renommer librement dans le Sheets.
   ════════════════════════════════════════════════════════ */
var TABLE_NAMES = {
  1:  'CORNETTE PALACE',
  2:  'CAFÉ LE BON COIN',
  3:  'COLLINE DE MARRAKECH',
  4:  'LE CERCLE BILLARD',
  5:  'BOWLING MARRAKECH',
  6:  'MENARA MALL',
  7:  'BURGER KING MENARA',
  8:  'MUSÉE DES EAUX DE MARRAKECH',
  9:  "MAC DONALD'S MARRAKECH",
  10: 'RESTAURANT EL GEORGE',
  11: 'PARK PALOZA MARRAKECH',
  12: 'ARRIBAT CENTER',
  13: 'MARINA',
  14: 'MUSÉE DE LA PHOTOGRAPHIE RABAT',
  15: 'VILLA BERECHID',
  16: 'PARK SINDIBAD',
  17: 'RESTAURANT DIWAN',
  18: 'CINÉMA MEGARAMA RABAT',
  19: 'RESTAURANT DAWLIZ',
  20: 'RESTAURANT FARAH',
  21: 'MAC DONALD CASABLANCA',
  22: 'RESTAURANT MARRIOTT',
  23: 'CINÉ PATHÉ CASABLANCA',
  24: 'RESTAURANT CABESTAN',
  25: 'VILLA TOURIVER',
  26: 'RESTAURANT RABAT',
  27: 'JARDIN NOUZHAT HASSAN',
  28: 'AÉROPORT MOHAMMED V',
  29: "VILLA M'ACCOMPAGNE",
  30: 'PLAZZA',
  31: 'PALMERAIE'
};

/* Capacité : 8 par défaut, 10 pour la dernière table */
var TABLE_CAPACITY_DEFAULT = 8;
var TABLE_CAPACITY_OVERRIDE = { 31: 10 };

/* Tables attribuées par catégorie de relation */
var RELATION_TABLES = {
  'ami_cyntiche':    [1, 2, 5, 6, 9, 10, 13],
  'ami_audrey':      [3, 4, 7, 8, 11, 12, 14, 15],
  'famille_cyntiche': [16, 17, 20, 21, 24, 25, 28, 29],
  'famille_audrey':  [18, 19, 22, 23, 26, 27, 30, 31]
};

/* ════════════════════════════════════════════════════════
   COLONNES — "Inscriptions Soirée" (0-based index)
   A(0):prenom  B(1):nom  C(2):sexe  D(3):allergie  E(4):tel
   F(5):relation  G(6):boisson  H(7):table
   I(8):date_inscription  J(9):device_token  K(10):appareils_connus
   ════════════════════════════════════════════════════════ */
var COL = {
  PRENOM:     0,
  NOM:        1,
  SEXE:       2,
  ALLERGIE:   3,
  TEL:        4,
  RELATION:   5,
  BOISSON:    6,
  TABLE:      7,
  DATE:       8,
  DEVICE:     9,
  APPAREILS:  10
};

/* ────────────────────────────────────────────────────────
   Point d'entrée POST
──────────────────────────────────────────────────────── */
function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'validateCode')    return validateCode(data.code, data.deviceToken);
    if (action === 'registerSoiree') return registerSoiree(data);
    if (action === 'reconnectSoiree') return reconnectSoiree(data.prenom, data.nom, data.deviceToken);

    return jsonResponse({ success: false, message: 'Action inconnue' });

  } catch (err) {
    return jsonResponse({ success: false, message: 'Erreur serveur : ' + err.message });
  }
}

/* ════════════════════════════════════════════════════════
   1. CIVIL — Validation code AC-XXXX
   ════════════════════════════════════════════════════════ */
function validateCode(code, deviceToken) {
  if (!code || !/^AC-\d{4}$/.test(code)) {
    return jsonResponse({ success: false, message: 'Format de code invalide.' });
  }

  var sheet = getSheet(SHEET_NAME_CODES);
  if (!sheet) return jsonResponse({ success: false, message: 'Configuration manquante.' });

  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (String(row[0]).trim().toUpperCase() !== code) continue;

    var actif = row[2];
    if (actif === false || String(actif).toLowerCase() === 'false' || actif === 0) {
      return jsonResponse({ success: false, message: 'Ce code a été désactivé. Contactez les mariés.' });
    }

    var nbUtil      = Number(row[3]) || 0;
    var firstDevice = String(row[5] || '').trim();
    var appareils   = String(row[6] || '').trim();
    var isNewDevice = false;

    if (!firstDevice) {
      sheet.getRange(i + 1, 6).setValue(deviceToken || '');
    } else if (deviceToken && firstDevice !== deviceToken) {
      isNewDevice = true;
      var liste = appareils ? appareils.split('|') : [];
      if (!liste.includes(deviceToken)) {
        liste.push(deviceToken);
        if (liste.length > 5) liste = liste.slice(-5);
        sheet.getRange(i + 1, 7).setValue(liste.join('|'));
      }
    }

    sheet.getRange(i + 1, 4).setValue(nbUtil + 1);
    sheet.getRange(i + 1, 5).setValue(new Date());

    return jsonResponse({
      success: true,
      nom: String(row[1] || '').trim() || 'Invité(e)',
      isNewDevice: isNewDevice,
      nbUtil: nbUtil + 1
    });
  }

  return jsonResponse({ success: false, message: 'Code invalide. Vérifiez votre invitation.' });
}

/* ════════════════════════════════════════════════════════
   2. SOIRÉE — Inscription + Affectation automatique de table
   ════════════════════════════════════════════════════════ */
function registerSoiree(data) {
  var prenom   = String(data.prenom   || '').trim();
  var nom      = String(data.nom      || '').trim();
  var sexe     = String(data.sexe     || '').trim();
  var relation = String(data.relation || '').trim();
  var tel      = String(data.tel      || '').trim();
  var allergie = String(data.allergie || '').trim();
  var boisson  = String(data.boisson  || '').trim();
  var token    = String(data.deviceToken || '').trim();

  if (!prenom || !nom) {
    return jsonResponse({ success: false, message: 'Nom et prénom requis.' });
  }

  var sheet = getSheet(SHEET_NAME_SOIREE);
  if (!sheet) return jsonResponse({ success: false, message: 'Onglet "Inscriptions Soirée" introuvable.' });

  var rows = sheet.getDataRange().getValues();

  /* ── Vérifier si déjà inscrit ── */
  for (var i = 1; i < rows.length; i++) {
    var rPrenom = String(rows[i][COL.PRENOM] || '').trim().toLowerCase();
    var rNom    = String(rows[i][COL.NOM]    || '').trim().toLowerCase();

    if (rPrenom === prenom.toLowerCase() && rNom === nom.toLowerCase()) {
      trackDevice(sheet, i, token, rows[i]);
      var existingTable = String(rows[i][COL.TABLE] || '').trim();
      return jsonResponse({
        success:          true,
        alreadyRegistered: true,
        prenom:           String(rows[i][COL.PRENOM]).trim(),
        table:            existingTable || null
      });
    }
  }

  /* ── Affectation automatique de table ── */
  var assignedTable = assignTable(relation, rows);

  /* ── Écriture dans le Sheets ── */
  sheet.appendRow([
    prenom, nom, sexe, allergie, tel, relation, boisson,
    assignedTable || '',   /* H : table (auto-affectée) */
    new Date(),            /* I : date_inscription */
    token,                 /* J : device_token */
    ''                     /* K : appareils_connus */
  ]);

  return jsonResponse({
    success:          true,
    alreadyRegistered: false,
    prenom:           prenom,
    table:            assignedTable
  });
}

/* ════════════════════════════════════════════════════════
   3. SOIRÉE — Reconnexion autre appareil
   ════════════════════════════════════════════════════════ */
function reconnectSoiree(prenom, nom, deviceToken) {
  var prenomLow = String(prenom || '').trim().toLowerCase();
  var nomLow    = String(nom    || '').trim().toLowerCase();

  if (!prenomLow || !nomLow) {
    return jsonResponse({ success: false, message: 'Nom et prénom requis.' });
  }

  var sheet = getSheet(SHEET_NAME_SOIREE);
  if (!sheet) return jsonResponse({ success: false, message: 'Configuration manquante.' });

  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var rPrenom = String(rows[i][COL.PRENOM] || '').trim().toLowerCase();
    var rNom    = String(rows[i][COL.NOM]    || '').trim().toLowerCase();

    if (rPrenom === prenomLow && rNom === nomLow) {
      trackDevice(sheet, i, deviceToken, rows[i]);
      return jsonResponse({
        success: true,
        prenom:  String(rows[i][COL.PRENOM]).trim(),
        table:   String(rows[i][COL.TABLE]  || '').trim() || null
      });
    }
  }

  return jsonResponse({
    success: false,
    message: "Aucune inscription trouvée pour ces nom et prénom. Vérifiez l'orthographe ou utilisez l'onglet \"Première inscription\"."
  });
}

/* ════════════════════════════════════════════════════════
   Affectation automatique de table
   ════════════════════════════════════════════════════════ */
function assignTable(relation, existingRows) {
  var eligible = RELATION_TABLES[relation];
  if (!eligible || eligible.length === 0) return null;

  /* Compter les occupants actuels par nom de table */
  var counts = {};
  for (var i = 1; i < existingRows.length; i++) {
    var t = String(existingRows[i][COL.TABLE] || '').trim();
    if (t) counts[t] = (counts[t] || 0) + 1;
  }

  /* Trouver la première table avec de la place */
  for (var j = 0; j < eligible.length; j++) {
    var num      = eligible[j];
    var name     = TABLE_NAMES[num];
    var capacity = TABLE_CAPACITY_OVERRIDE[num] || TABLE_CAPACITY_DEFAULT;
    var occupied = counts[name] || 0;

    if (occupied < capacity) return name;
  }

  return null; /* Toutes les tables de la catégorie sont pleines */
}

/* ────────────────────────────────────────────────────────
   Utilitaires
──────────────────────────────────────────────────────── */
function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function trackDevice(sheet, rowIndex, deviceToken, row) {
  if (!deviceToken) return;
  var firstDevice = String(row[COL.DEVICE]    || '').trim();
  var appareils   = String(row[COL.APPAREILS] || '').trim();

  if (!firstDevice) {
    sheet.getRange(rowIndex + 1, COL.DEVICE + 1).setValue(deviceToken);
  } else if (firstDevice !== deviceToken) {
    var liste = appareils ? appareils.split('|') : [];
    if (!liste.includes(deviceToken)) {
      liste.push(deviceToken);
      if (liste.length > 5) liste = liste.slice(-5);
      sheet.getRange(rowIndex + 1, COL.APPAREILS + 1).setValue(liste.join('|'));
    }
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
