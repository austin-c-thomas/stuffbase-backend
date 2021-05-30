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

    return storageLocation;
  } catch (error) {
    throw error;
  };
};

const updateStorageLocation = async ({ id, name, location, note }) => {
  // Only update the fields that were supplied
  const updateFields = {};
  if (name) {
    updateFields.name = name;
  };

  if (location) {
    updateFields.location = location;
  };

  if (note) {
    updateFields.note = note;
  };

  const setString = Object.keys(updateFields).map((key, index) => {
    return `"${key}"=$${index + 1}`
  }).join(', ');

  try {
    const { rows: [updatedStorageLocation] } = await client.query(`
      UPDATE storage_locations
      SET ${setString}
      WHERE id=${id}
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