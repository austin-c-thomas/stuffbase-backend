// Express Server
// Server
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const apiRouter = require('./api');
const client = require('./db/client');

const PORT = process.env.PORT || 3000;
const server = express();

// Middleware
server.use(morgan('dev'));
server.use(express.json());
server.use(express.urlencoded({ extended: false }));
server.use(cors());

// API Router
server.use('/api', apiRouter);

// Error Handling
// 404
server.use('*', (req, res, next) => {
  res.status(404);
  res.send({ error: 'Route not found.' });
});

// 500
server.use((error, req, res, next) => {
  res.status(500);
  res.send(error);
});

server.listen(PORT, () => {
  client.connect();
  console.log('Listening on port: ', PORT);
});