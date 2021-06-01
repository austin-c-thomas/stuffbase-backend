const client = require('../client');
const { getStorageLocationById } = require('./storage_locations');
const { getUserById } = require('./users');

const createBox = async ({
  label,
  description,
  category = 'MISC',
  userId,
  locationId
}) => {
  try {
    const { rows: [newBox] } = await client.query(`
      INSERT INTO boxes(label, description, category, "userId", "locationId")
      VALUES($1, $2, $3, $4, $5)
      RETURNING *;
    `, [label, description, category, userId, locationId]);

    return newBox;
  } catch (error) {
    throw error;
  };
};

const getBoxById = async (id) => {
  try {
    const { rows: [box] } = await client.query(`
      SELECT *
      FROM boxes
      WHERE id=$1;
    `, [id]);

    if (!box) {
      throw Error('There is no box with that ID.');
    };

    return box;
  } catch (error) {
    throw error;
  };
};

const getBoxesByLocationId = async (locationId) => {
  try {
    const locationExists = await getStorageLocationById(locationId);

    if (locationExists) {
      const { rows: boxList } = await client.query(`
        SELECT *
        FROM boxes
        WHERE "locationId"=$1;
      `, [locationId]);

      return boxList;
    };
  } catch (error) {
    throw error;
  };
};

const getBoxesByUserId = async (userId) => {
  try {
    const userExists = await getUserById(userId);

    if (userExists) {
      const { rows: boxList } = await client.query(`
        SELECT *
        FROM boxes
        WHERE "userId"=$1;
      `, [userId]);
      
      return boxList;
    };
  } catch (error) {
    throw error;
  };
};

const updateBox = async (box) => {
  if (!box.id) {
    throw Error('You must supply the box ID in your request.')
  };

  //Only update the fields passed in.
  const updateFields = {}
  Object.entries(box).forEach((set) => {
    updateFields[set[0]] = set[1];
  });

  const setString = Object.keys(updateFields).map((key, index) => {
    return `"${key}"=$${index + 1}`
  }).join(', ');

  try {
    const { rows: [updatedBox] } = await client.query(`
      UPDATE boxes
      SET ${setString}
      WHERE id=${box.id}
      RETURNING *;
    `, Object.values(updateFields));

    return updatedBox;
  } catch (error) {
    throw error;
  };
};

const destroyBox = async ({ id }) => {
  try {
    const { rows: [deletedBox] } = await client.query(`
      DELETE FROM boxes
      WHERE "id"=$1
      RETURNING *;
    `, [id]);
    
    return deletedBox;
  } catch (error) {
    throw error;
  };
};

// const attachItemsToBox = async () => {
//   try {
    
//   } catch (error) {
//     throw error;
//   };
// };

// const getBoxByItemId = async (id) => {
//   try {
    
//   } catch (error) {
//     throw error;
//   };
// };

module.exports = {
  createBox,
  getBoxById,
  getBoxesByLocationId,
  getBoxesByUserId,
  updateBox,
  destroyBox,
}