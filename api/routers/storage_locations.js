const express = require('express');
const { getStorageLocationsByUserId, createStorageLocation, getStorageLocationById, updateStorageLocation } = require('../../db');
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

storageLocationsRouter.patch('/:locationId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const locationId = Number(req.params.locationId);
  if (!req.body || Object.entries(req.body).length === 0) {
    next({
      name: 'MissingRequestBody',
      message: 'Your request must include a body with at least one field to update.'  
    });
  };

  try {
    const locationToUpdate = await getStorageLocationById(locationId);
    if (Number(locationToUpdate.userId) !== userId) throw Error('You do not have permission to change that data.');
    const updateFields = {...req.body, id: locationId};
              // Typescript: updateFields: {
              //   id: number;  
              //   userId: number | undefined;
              //   name: string | undefined;
              //   location: text | undefined;
              //   note: text | undefined;
              // }
    const updatedStorageLocation = await updateStorageLocation(updateFields);
    if (!updateFields) throw Error('DB errorStorage Location was unable to update.');
    res.send(updatedStorageLocation);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = storageLocationsRouter;