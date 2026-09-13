const { app } = require('./dist/app/server/main.js');
const http = require('http');

const server = http.createServer(app());
const routes = process.argv.slice(2);
if (!routes.length) routes.push('/fr/home', '/fr/auth/login');

server.listen(4105, () => {
  console.log('HARNESS listening, testing:', routes.join(', '));
  let i = 0;
  const next = () => { if (i >= routes.length) { server.close(); process.exit(0); } run(routes[i++], next); };
  function run(route, done) {
    const start = Date.now();
    const req = http.get({ host: 'localhost', port: 4105, path: route }, (res) => {
      let n = 0;
      res.on('data', () => (n += 1));
      res.on('end', () => {
        console.log(`ROUTE ${route} → ${res.statusCode} bytes~${n} in ${Date.now() - start}ms`);
        done();
      });
    });
    req.on('error', (e) => { console.log(`ROUTE ${route} → ERROR ${e.message} in ${Date.now() - start}ms`); done(); });
    req.setTimeout(30000, () => { console.log(`ROUTE ${route} → TIMEOUT after ${Date.now() - start}ms`); req.destroy(); done(); });
  }
  next();
});