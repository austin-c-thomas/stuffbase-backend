const express = require('express');
const boxesRouter = express.Router();

const { 
  requireUser, 
  requireParams, 
} = require('../utils');

const { 
  getBoxesByUserId, 
  createBox,
  getBoxById,
  updateBox,
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

boxesRouter.get('/:boxId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const boxId = Number(req.params.boxId);
  try {
    const box = await getBoxById(boxId);
    if (!box) throw Error('A box with that ID does not exist.');
    if (Number(box.userId) !== userId) throw Error('You do not have permission to access that data.');

    res.send(box);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

boxesRouter.patch('/:boxId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const boxId = Number(req.params.boxId);

  // If the request is made with nothing in the body, throw an error.
  if (!req.body || Object.entries(req.body).length === 0) {
    next({
      name: 'MissingRequestBody',
      message: 'Your request must include a body with at least one field to update.'  
    });
  };

  try {
    // Check that the box belongs to the user making the request
    const boxToUpdate = await getBoxById(boxId);
    if (Number(boxToUpdate.userId) !== userId) throw Error('You do not have permission to access that data.');

    const updateFields = {...req.body, id: boxId};
    const updatedBox = await updateBox(updateFields);
    if (!updatedBox) throw Error('The database experienced an error while trying to process your request.');
    
    res.send(updatedBox);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = boxesRouter;