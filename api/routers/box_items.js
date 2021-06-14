const express = require('express');
const { createBoxItem } = require('../../db');
const { requireUser, requireParams } = require('../utils');
const boxItemsRouter = express.Router();

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

// boxItemsRouter.patch('/:itemId')

// boxItemsRouter.delete('/:itemId')


module.exports = boxItemsRouter;