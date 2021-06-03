const client = require('../client');
const { getStorageLocationById } = require('./storage_locations');
const { getUserById } = require('./users');

const createItem = async ({ 
  name, 
  description, 
  category = 'MISC',
  quantity = 1, 
  imageURL, 
  userId,
  locationId }) => {

  try {
    const { rows: [newItem] } = await client.query(`
      INSERT INTO items(name, description, category, quantity, "imageURL", "userId", "locationId")
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [name, description, category, quantity, imageURL, userId, locationId]);

    return newItem;
  } catch (error) {
    throw error;
  };
};

const getItemById = async (id) => {
  try {
    const { rows: [item] } = await client.query(`
      SELECT *
      FROM items
      WHERE id=$1;
    `, [id]);
    return item;
  } catch (error) {
    throw error;
  };
};

const getItemsByLocationId = async (locationId) => {
  try {
    const locationExists = await getStorageLocationById(locationId);

    if (locationExists) {
      const { rows: itemList } = await client.query(`
        SELECT *
        FROM items
        WHERE "locationId"=$1;
      `, [locationId]);

      return itemList;
    };
  } catch (error) {
    throw error;
  };
};

const getItemsByUserId = async (userId) => {
  try {
    const { rows: itemList } = await client.query(`
      SELECT *
      FROM items
      WHERE "userId"=$1;
    `, [userId]);

    return itemList;
  } catch (error) {
    throw error;
  };
};

const updateItem = async (item) => {
  if (!item.id) {
    throw Error('You must supply the item ID in your request.')
  };

  //Only update the fields passed in.
  const updateFields = {}
  Object.entries(item).forEach((set) => {
    updateFields[set[0]] = set[1];
  });

  const setString = Object.keys(updateFields).map((key, index) => {
    return `"${key}"=$${index + 1}`
  }).join(', ');
  
  try {
    const { rows: [updatedItem] } = await client.query(`
      UPDATE items
      SET ${setString}
      WHERE id=${item.id}
      RETURNING *;
    `, Object.values(updateFields));

    return updatedItem;
  } catch (error) {
    throw error;
  };
};

const destroyItem = async ({ id }) => {
  try {
    const { rows: [deletedItem] } = await client.query(`
      DELETE FROM items
      WHERE "id"=$1
      RETURNING *;
    `, [id]);
    
    return deletedItem;
  } catch (error) {
    throw error;
  };
};

module.exports = {
  createItem,
  getItemById,
  getItemsByLocationId,
  getItemsByUserId,
  updateItem,
  destroyItem,
}