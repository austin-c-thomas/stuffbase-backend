const express = require('express');
const boxItemsRouter = express.Router();

const { 
  createBoxItem, 
  getItemById, 
  getBoxById, 
  updateBoxItem 
} = require('../../db');

const { 
  requireUser, 
  requireParams 
} = require('../utils');


boxItemsRouter.use((req, res, next) => {
  console.log('A request is being made to /box_items...');
  next();
});

boxItemsRouter.post('/', requireUser, requireParams({ required: ['itemId', 'boxId'] }), async (req, res, next) => {
  const itemId = Number(req.body.itemId);
  const boxId = Number(req.body.boxId);
  try {
    const newBoxItem = await createBoxItem({ itemId, boxId });
    if (!newBoxItem) throw Error('The database experienced an error while trying to process your request.');
    res.send(newBoxItem);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

boxItemsRouter.patch('/:itemId', requireUser, requireParams({ required: ['boxId'] }), async (req, res, next) => {
  const userId = Number(req.user.id);
  const itemId = Number(req.params.itemId);
  const boxId = Number(req.body.boxId);
  try {
    const item = await getItemById(itemId);
    const box = await getBoxById(boxId);
    if (Number(item.userId) !== userId || Number(box.userId) !== userId) throw Error('You do not have permission to access that data.');
    const updatedBoxItem = await updateBoxItem({ itemId, boxId });
    if (!updatedBoxItem) throw Error('The database experienced an error while trying to process your request.');
    res.send(updatedBoxItem);
  } catch ({ name, message }) {
    next({ name, message});
  };
});

// boxItemsRouter.delete('/:itemId')


module.exports = boxItemsRouter;