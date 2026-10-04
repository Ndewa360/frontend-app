const { app } = require('../dist/app/server/main.js');

const server = app();

module.exports = (req, res) => {
  server(req, res);
};
