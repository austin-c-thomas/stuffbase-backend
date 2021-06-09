const express = require('express');
const itemsRouter = express.Router();

itemsRouter.use((req, res, next) => {
  console.log('A request is being made to /users/:userId/items...');
});

module.exports = itemsRouter;