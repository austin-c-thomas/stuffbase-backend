const express = require('express');
const itemsRouter = express.Router();

const { 
  getItemsByUserId, 
  createItem,
  getItemById,
  updateItem,
  destroyItem,
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

itemsRouter.patch('/:itemId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const itemId = Number(req.params.itemId);

  // If the request is made with nothing in the body, throw an error.
  if (!req.body || Object.entries(req.body).length === 0) {
    next({
      name: 'MissingRequestBody',
      message: 'Your request must include a body with at least one field to update.'  
    });
  };

  try {
    // Check that the item belongs to the user making the request
    const itemToUpdate = await getItemById(itemId);
    if (Number(itemToUpdate.userId) !== userId) throw Error('You do not have permission to access that data.');
    
    const updateFields = {...req.body, id: itemId};
    const updatedItem = await updateItem(updateFields);
    if (!updateFields) throw Error('The database experienced an error while trying to process your request.');
    res.send(updatedItem);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

itemsRouter.delete('/:itemId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const itemId = Number(req.params.itemId);
  try {
    // Check that the item belongs to the user making the request
    const itemToDelete = await getItemById(itemId);
    if (Number(itemToDelete.userId) !== userId) throw Error('You do not have permission to access that data.');

    // Delete the item
    console.log(itemToDelete);
    const deletedItem = await destroyItem(itemId);
    if (!deletedItem) throw Error('The database experienced an error while trying to process your request.');
    res.send(deletedItem);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = itemsRouter;