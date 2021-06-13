const express = require('express');
const boxesRouter = express.Router();

const { 
  requireUser, 
  requireParams, 
} = require('../utils');

const { 
  getBoxesByUserId, 
  createBox,
} = require('../../db');

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

boxesRouter.post('/', requireUser, requireParams({ required: ['label', 'locationId'] }), async (req, res, next) => {
  const userId = Number(req.user.id);
  const locationId = Number(req.body.locationId);
  const boxData = {...req.body, locationId: locationId, userId: userId};
  try {
    const newBox = await createBox(boxData);
    if (!newBox) throw Error('The database experienced an error while trying to process your request.');
    res.send(newBox);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = boxesRouter;