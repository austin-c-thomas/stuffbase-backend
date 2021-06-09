const express = require('express');
const { getStorageLocationsByUserId, createStorageLocation, getStorageLocationById } = require('../../db');
const storageLocationsRouter = express.Router();

const { requireUser, requireParams } = require('../utils');


storageLocationsRouter.use((req, res, next) => {
  console.log('A request is being made to /storage_locations')
  next();
});

storageLocationsRouter.get('/', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
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
  const userId = Number(req.user.id);
  const { name, location, note } = req.body;
  try {
    const newStorageLocation = await createStorageLocation({
      userId,
      name,
      location,
      note,
    });

    if(!newStorageLocation) throw Error('Something went wrong while trying to create new storage location.');

    res.send(newStorageLocation);
  } catch ({ name, message }) {
    throw ({ name, message });
  };
});

storageLocationsRouter.get('/:locationId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const locationId = Number(req.params.locationId);
  try {
    const storageLocation = await getStorageLocationById(locationId);
    
    if (!storageLocation) throw Error('A location with that ID does not exist.');
    if (storageLocation.userId !== userId) throw Error('You do not have permission to access that data.');

    res.send(storageLocation);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = storageLocationsRouter;