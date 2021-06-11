const express = require('express');
const itemsRouter = express.Router();

const { 
  getItemsByUserId, 
  createItem,
  getItemById,
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

itemsRouter.post('/', requireUser, requireParams({ required: ['name', 'locationId'] }), async (req, res, next) => {
  const userId = Number(req.user.id);
  const locationId = Number(req.body.locationId);
  let quantity;
  if (req.body.quantity) {
    quantity = Number(req.body.quantity);
  };
  const itemData = {...req.body, quantity: quantity, locationId: locationId, userId: userId};
  try {
    const newItem = await createItem(itemData);
    if (!newItem) next(generateError('DatabaseError'));
    res.send(newItem);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

itemsRouter.get('/:itemId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const itemId = Number(req.params.itemId);
  try {
    const item = await getItemById(itemId);

    if (!item) throw Error('An item with that ID does not exist.');
    if (Number(item.userId) !== userId) throw Error('You do not have permission to access that data.');

    res.send(item);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = itemsRouter;