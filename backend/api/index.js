// Vercel serverless entry — forwards every request to the cached Nest/Express app.
// Requires the compiled output (dist/), produced by `vercel-build` (nest build).
const { bootstrapServer } = require('../dist/serverless');

module.exports = async (req, res) => {
  const server = await bootstrapServer();
  return server(req, res);
};
