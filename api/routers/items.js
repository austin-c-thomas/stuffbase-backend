const express = require('express');
const itemsRouter = express.Router();

const { 
  getItemsByUserId, 
} = require('../../db');

const {
  requireUser,
  requireParams,
  generateError,
} = require('../utils');

itemsRouter.use((req, res, next) => {
  console.log('A request is being made to /items...');
  next();
});

itemsRouter.get('/', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  try {
    const userItems = await getItemsByUserId(userId);
    if (!userItems) next(generateError('DatabaseError'));

    res.send(userItems);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = itemsRouter;