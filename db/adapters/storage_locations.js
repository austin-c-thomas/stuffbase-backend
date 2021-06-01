const client = require('../client');

const createStorageLocation = async ({ userId, name, location = "Home", note }) => {
  try {
    const { rows: [newStorageLocation] } = await client.query(`
      INSERT INTO storage_locations("userId", name, location, note)
      VALUES($1, $2, $3, $4)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `, [userId, name, location, note]);

    if (!newStorageLocation) {
      throw Error('A storage location by that name already exists.');
    }
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

// const destroyStorageLocation = async () => {
//   try {

//   } catch(error) {
//     throw error;
//   };
// };

module.exports = {
  createStorageLocation,
  getStorageLocationById,
  updateStorageLocation,
}