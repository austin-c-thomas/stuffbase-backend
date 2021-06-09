const express = require('express');
const { getStorageLocationsByUserId, createStorageLocation } = require('../../db');
const storageLocationsRouter = express.Router();

const { requireUser, requireParams } = require('../utils');


storageLocationsRouter.use((req, res, next) => {
  console.log('A request is being made to /storage_locations')
  next();
});

storageLocationsRouter.get('/', requireUser, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const userStorageLocations = await getStorageLocationsByUserId(userId);

    if (!userStorageLocations) {
      throw Error('You currently have no storage locations.');
    };

    res.send(userStorageLocations);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

storageLocationsRouter.post('/', requireUser, requireParams({ required: ['name'] }), async (req, res, next) => {
  const userId = req.user.id;
  const { name, location, note } = req.body;
  try {
    const newStorageLocation = await createStorageLocation({
      userId,
      name,
      location,
      note,
    });

    if(!newStorageLocation) {
      throw Error('Something went wrong while trying to create new storage location.');
    };

    res.send(newStorageLocation);
  } catch ({ name, message }) {
    throw ({ name, message });
  };
});

module.exports = storageLocationsRouter;