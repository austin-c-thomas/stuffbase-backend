const express = require('express');
const healthRouter = express.Router();

healthRouter.get('/', (req, res, next) => {
  res.send({
    name: 'Heartbeat',
    message: 'The API is healthy.'
  });
});

module.exports = healthRouter;