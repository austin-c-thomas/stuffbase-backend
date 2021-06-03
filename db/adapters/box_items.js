const client = require('../client');
const { getBoxById } = require('./boxes');
const { getItemById } = require('./items');

const createBoxItem = async ({ boxId, itemId }) => {
  try {
    const box = await getBoxById(boxId);
    const item = await getItemById(itemId);

    if (box.userId !== item.userId) {
      throw Error('Box and item must belong to the same user.')
    };

    const userId = Number(box.userId);

    const { rows: [newBoxItem] } = await client.query(`
      INSERT INTO box_items("boxId", "itemId", "userId")
      VALUES($1, $2, $3)
      RETURNING *;
    `, [boxId, itemId, userId]);

    return newBoxItem;
  } catch (error) {
    throw error;
  };
};

const getBoxItemByItemId = async (itemId) => {
  try {
    const { rows: [boxItem] } = await client.query(`
      SELECT *
      FROM box_items
      WHERE "itemId"=$1;
    `, [itemId]);

    if (!boxItem) {
      throw Error('That item is not in a box.')
    };
    
    return boxItem;
  } catch (error) {
    throw error;
  };
};

const getBoxItemsByBoxId = async (boxId) => {
  try {
    const boxExists = await getBoxById(boxId);
    if (boxExists) {
      const { rows: boxItems } = await client.query(`
        SELECT *
        FROM box_items
        WHERE "boxId"=$1;
      `, [boxId]);

      return boxItems;
    };
  } catch (error) {
    throw error;
  };
};

const updateBoxItem = async ({ itemId, boxId }) => {
  try {
    const { rows: [updatedBoxItem] } = await client.query(`
      UPDATE box_items
      SET "boxId"=$1
      WHERE "itemId"=$2
      RETURNING *;
    `, [boxId, itemId]);

    return updatedBoxItem;
  } catch (error) {
    throw error;
  };
};

const destroyBoxItem = async ({ itemId }) => {
  try {
    const { rows: [deletedBoxItem] } = await client.query(`
      DELETE FROM box_items
      WHERE "itemId"=$1
      RETURNING *;
    `, [itemId]);

    return deletedBoxItem;
  } catch (error) {
    throw error;
  };
};

module.exports = {
  createBoxItem,
  getBoxItemByItemId,
  getBoxItemsByBoxId,
  updateBoxItem,
  destroyBoxItem,
}