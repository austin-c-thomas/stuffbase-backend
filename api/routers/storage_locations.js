const express = require('express');
const { getStorageLocationsByUserId, createStorageLocation, getStorageLocationById, updateStorageLocation, destroyStorageLocation } = require('../../db');
const storageLocationsRouter = express.Router();

const { requireUser, requireParams, generateError } = require('../utils');


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

    if(!newStorageLocation) next(generateError('DatabaseError'));

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

  // If the request is made with nothing in the body, throw an error.
  if (!req.body || Object.entries(req.body).length === 0) {
    next({
      name: 'MissingRequestBody',
      message: 'Your request must include a body with at least one field to update.'  
    });
  };

  try {
    const locationToUpdate = await getStorageLocationById(locationId);

    // Check that the location belongs to the user making the request
    if (Number(locationToUpdate.userId) !== userId) next(generateError('UnauthorizedUserError'));
    const updateFields = {...req.body, id: locationId};
              // Typescript: updateFields: {
              //   id: number;  
              //   userId: number | undefined;
              //   name: string | undefined;
              //   location: text | undefined;
              //   note: text | undefined;
              // }
    const updatedStorageLocation = await updateStorageLocation(updateFields);
    if (!updateFields) next(generateError('DatabaseError'));
    res.send(updatedStorageLocation);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

storageLocationsRouter.delete('/:locationId', requireUser, async (req, res, next) => {
  const userId = Number(req.user.id);
  const locationId = Number(req.params.locationId);
  try {
    // Check that the location belongs to the user making the request
    const locationToDelete = await getStorageLocationById(locationId);
    if (Number(locationToDelete.userId) !== userId) next(generateError('UnauthorizedUserError'));

    // Throw an error if the location has items or boxes in it

    // Delete the storage location
    const deletedStorageLocation = await destroyStorageLocation(locationId);
    if (!deletedStorageLocation) next(generateError('DatabaseError'));
    res.send(deletedStorageLocation);
  } catch ({ name, message }) {
    next({ name, message });
  };
});

module.exports = storageLocationsRouter;