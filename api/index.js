/**
 * Point d'entrée de la lambda Vercel.
 *
 * L'URL de cette fonction est `/api` (Vercel expose `api/index.js` sur ce
 * chemin). `vercel.json` réécrit toutes les routes HTML vers `/api` après la
 * phase `filesystem`, donc les assets statiques restent servis par le CDN.
 *
 * Le bundle serveur Angular est résolu par le traceur de fichiers de Vercel
 * (`@vercel/node` / nft) : il est produit par `npm run build:ssr` juste avant.
 * Le template HTML est inliné dans `_document.js` (fichier généré, non versionné)
 * car les fichiers de `dist/app/browser` ne sont pas copiés dans la lambda.
 */
const { app } = require('../dist/app/server/main.js');
const document = require('./_document.js');

const server = app(document);

module.exports = (req, res) => {
  server(req, res);
};