/**
 * Prépare le document Angular pour la lambda Vercel.
 *
 * Contexte : avec le Build Output API v3, les fichiers de `dist/app/browser`
 * sont envoyés dans le stockage statique (CDN) et ne sont PAS copiés dans le
 * paquet de la fonction. Or la lambda a besoin du template `index*.html` pour
 * faire le rendu SSR (et pour le fallback SPA). `express#sendFile` sur un
 * chemin inexistant renvoie 404, ce qui produisait des "Not Found" sur tout le
 * site. On inline donc le document dans un module CommonJS.require() par la
 * lambda — donc toujours présent dans le paquet, quel que soit le traceur de
 * fichiers.
 *
 * Le fichier généré est `api/_document.js` : le préfixe `_` empêche Vercel de
 * le traiter comme une Serverless Function (règle `fileName.includes('/_')`).
 *
 * Usage : node scripts/prepare-vercel-document.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distFolder = path.join(root, 'dist', 'app', 'browser');
const outputFile = path.join(root, 'api', '_document.js');

// Par ordre de préférence : le template le moins "pré-rendu" est le plus sûr
// pour CommonEngine (les autres contiennent déjà du markup rendu).
const candidates = ['index.original.html', 'index.csr.html', 'index.html'];

function fail(message) {
  console.error(`[prepare-vercel-document] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(distFolder)) {
  fail(`Dossier de sortie introuvable : ${distFolder}`);
}

const source = candidates
  .map(name => path.join(distFolder, name))
  .find(file => fs.existsSync(file));

if (!source) {
  fail(
    `Aucun template HTML dans ${distFolder} (attendu : ${candidates.join(', ')}).\n` +
    `Le build "application" d'Angular 17 écrit dans {outputPath}/browser — vérifiez ` +
    `que projects.app.architect.build.options.outputPath vaut bien "dist/app".`
  );
}

const html = fs.readFileSync(source, 'utf-8');

if (!html.includes('<app-root')) {
  fail(`${source} ne contient pas <app-root> : ce n'est pas le shell Angular.`);
}

const banner = '// FICHIER GENERE - ne pas editer. Source : scripts/prepare-vercel-document.js';
const body = `${banner}\nmodule.exports = ${JSON.stringify(html)};\n`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, body, 'utf-8');

console.log(
  `[prepare-vercel-document] ${path.relative(root, source)} -> ${path.relative(root, outputFile)} (${html.length} octets)`
);