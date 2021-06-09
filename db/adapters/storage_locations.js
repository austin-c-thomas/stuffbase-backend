const client = require('../client');
const { getUserById } = require('./users');

const createStorageLocation = async ({ userId, name, location = "Home", note }) => {
  try {
    if (!name) {
      throw Error('Please supply all required fields.');
    };
    
    const { rows: [newStorageLocation] } = await client.query(`
      INSERT INTO storage_locations("userId", name, location, note)
      VALUES($1, $2, $3, $4)
      RETURNING *;
    `, [userId, name, location, note]);

    return newStorageLocation;
  } catch (error) {
    throw error;
  };
};

const getStorageLocationById = async (id) => {
  try {
    const { rows: [storageLocation] } = await client.query(`
      SELECT *
      FROM storage_locations
      WHERE id=$1;
    `, [id]);

    if(!storageLocation) {
      throw Error('There is no location with that ID.');
    };

    return storageLocation;
  } catch (error) {
    throw error;
  };
};

const getStorageLocationsByUserId = async (userId) => {
  try {
    const { rows: storageLocationList } = await client.query(`
      SELECT *
      FROM storage_locations
      WHERE "userId"=$1;
    `, [userId]);

    return storageLocationList;
  } catch (error) {
    throw error;
  };
};

const updateStorageLocation = async (storageLocationUpdates) => {
  if (!storageLocationUpdates.id) {
    throw Error('You must supply the storage location ID in your request.')
  };

  // Only update the fields passed in.
  const updateFields = {};
  Object.entries(storageLocationUpdates).forEach((set) => {
    updateFields[set[0]] = set[1];
  });

  const setString = Object.keys(updateFields).map((key, index) => {
    return `"${key}"=$${index + 1}`
  }).join(', ');

  try {
    const { rows: [updatedStorageLocation] } = await client.query(`
      UPDATE storage_locations
      SET ${setString}
      WHERE id=${storageLocationUpdates.id}
      RETURNING *;
    `, Object.values(updateFields));

    return updatedStorageLocation;
  } catch (error) {
    throw error;
  };
};

const destroyStorageLocation = async (id) => {
  try {
    const { rows: [deletedStorageLocation] } = await client.query(`
      DELETE FROM storage_locations
      WHERE id=$1
      RETURNING *;
    `, [id]);

    return deletedStorageLocation;
  } catch(error) {
    throw error;
  };
};

module.exports = {
  createStorageLocation,
  getStorageLocationById,
  getStorageLocationsByUserId,
  updateStorageLocation,
  destroyStorageLocation,
}