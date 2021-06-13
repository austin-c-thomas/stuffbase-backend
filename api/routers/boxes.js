const express = require('express');
const { getBoxesByUserId } = require('../../db');
const boxesRouter = express.Router();

const { 
  requireUser 
} = require('../utils');


boxesRouter.use((req, res, next) => {
  console.log('A request is being made to /boxes...');
  next();
});

boxesRouter.get('/', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  try {
    const userBoxes = await getBoxesByUserId(userId);
    if (!userBoxes) throw Error('The database experienced an error while trying to process your request.');

    res.send(userBoxes);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = boxesRouter;