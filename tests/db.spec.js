require('dotenv').config();
const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');
const { 
  expect, 
  describe, 
  it, 
  beforeAll } = require('@jest/globals');

const { 
  createUser,
  getUser,
  updateUser,
} = require('../db/adapters/users');

const { 
  createStorageLocation, 
  getStorageLocationById, 
  updateStorageLocation 
} = require('../db/adapters/storage_locations');

const {
  createItem, 
  getItemById, 
  getItemsByLocationId, 
  getItemsByUserId,
  updateItem,
  destroyItem,
} = require('../db/adapters/items');

const {
  createBox, 
  getBoxById, 
  getBoxesByUserId, 
  getBoxesByLocationId,
  updateBox,
  destroyBox,
} = require('../db/adapters/boxes');

const { 
  createBoxItem, 
  getBoxItemByItemId, 
  getBoxItemsByBoxId, 
  updateBoxItem,
  destroyBoxItem
} = require('../db/adapters/box_items');

describe('Database', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });

  // Users
  describe('Users', () => {
    const testUser = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'Test User'};
    describe('createUser', () => {
      const userToCreate = {email: 'createduser@test.com', password: 'Password19', displayName: 'Created User'};
      const badPassOne = {email: 'badpass@test.com', password: 'Pass19', displayName: 'Bad Pass'};
      const badPassTwo = {email: 'badpass@test.com', password: 'PASSWORD19', displayName: 'Bad Pass'};
      const badPassThree = {email: 'badpass@test.com', password: 'password19', displayName: 'Bad Pass'};
      const badPassFour = {email: 'badpass@test.com', password: 'Password', displayName: 'Bad Pass'};
      let createdUser = null;
      beforeAll(async () => {
        createdUser = await createUser(userToCreate);
      });

      it('Adds a new user to the database', () => {
        expect(createdUser).toBeTruthy();
      });

      it('Requires the password to meet parameters', async () => {
        expect.assertions(4);
        await expect(createUser(badPassOne)).rejects.toEqual(Error('Password must be at least 8 characters long.'));
        await expect(createUser(badPassTwo)).rejects.toEqual(Error('Password must include at least one lowercase letter.'));
        await expect(createUser(badPassThree)).rejects.toEqual(Error('Password must include at least one uppercase letter.'));
        await expect(createUser(badPassFour)).rejects.toEqual(Error('Password must include at least one number.'));

      })

      it('Stores the hashed password in the database', async () => {
        const { rows: [dbUser] } = await client.query(`
          SELECT * FROM users
          WHERE id=$1;
        `, [createdUser.id]);
        expect(dbUser.password).toBeTruthy();
        expect(dbUser.password).not.toBe(userToCreate.password);
      });

      it('Stores the hashed email in the database', async () => {
        const { rows: [dbUser] } = await client.query(`
          SELECT * FROM users
          WHERE id=$1;
        `, [createdUser.id]);
        expect(dbUser.email).toBeTruthy();
        expect(dbUser.email).not.toBe(userToCreate.email);
      });

      it(`Returns the user's unencrypted email`, () => {
        expect(createdUser.email).toEqual(userToCreate.email);
      });

      it(`Returns the user's information without the password`, () => {
        expect(createdUser.password).not.toBeTruthy();
      });
    });

    describe('getUser', () => {
      let retrievedUser = null;
      beforeAll(async () => {
        retrievedUser = await getUser(testUser);
      });

      it(`Returns the correct user's data`, () => {
        expect(retrievedUser.email).toEqual(testUser.email);
      });

      it(`Does not return the user's password`, () => {
        expect(retrievedUser.password).toBeFalsy();
      });
    });

    describe('updateUser', () => {
      const updatedEmail = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1' };
      const updatedPassword = { id: 1, email: 'testUser@test.com', password: 'iLoveStuffBase2' };
      
      it(`Successfully updates the user's email`, async () => {
        const { rows: [userToUpdate] } = await client.query(`
          SELECT *
          FROM users
          WHERE id=$1;
        `, [updatedEmail.id]);
        const updatedUser = await updateUser(updatedEmail);
        expect(updatedUser.email).not.toEqual(userToUpdate.email);
        expect(updatedUser.email).toEqual(updatedEmail.email);
      });

      it(`Successfully updates the user's password`, async () => {
        const { rows: [userToUpdate] } = await client.query(`
          SELECT *
          FROM users
          WHERE id=$1;
        `, [updatedPassword.id]);

        const updatedUser = await updateUser(updatedPassword);
        expect(updatedUser.password).not.toEqual(userToUpdate.password);
      });
    });
  });

  // Storage Locations
  describe('Storage_Locations', () => {
    const testLocation = { id: 3, userId: 1, name: '5x5 Storage Unit', location: 'Remote' };
    describe('createStorageLocation', () => {
      const locationToCreate = { userId: 1, name: 'Hall Closet', location: 'Home', note: 'For cleaning supplies' };
      let newLocation = null;
      beforeAll(async () => {
        newLocation = await createStorageLocation(locationToCreate);
      });

      it('Creates a new storage location in the db table', async () => {
        expect(newLocation).toBeTruthy();
      });

      it('Assigns the new storage location to the correct user', () => {
        expect(newLocation.userId).toEqual(locationToCreate.userId);
      });
    });

    describe('getStorageLocationById', () => {
      it('Retrieves the correct storage location from the db', async () => {
        const storageLocation = await getStorageLocationById(testLocation.id);
        expect(storageLocation.id).toEqual(testLocation.id);
        expect(storageLocation.name).toEqual(testLocation.name);
      });
    });

    describe('updateStorageLocation', () => {
      const updates = { id: 3, name: '5x6 Storage Unit', note: 'Storage unit B18' }
      let updatedStorageLocation = null;
      beforeAll(async () => {
        updatedStorageLocation = await updateStorageLocation(updates);
      });

      it('Updates the correct storageLocation', () => {
        expect(updatedStorageLocation.id).toEqual(testLocation.id);
      });

      it('Successfully updates the fields passed in', () => {
        expect(updatedStorageLocation.name).not.toEqual(testLocation.name);
        expect(updatedStorageLocation.name).toEqual(updates.name);
        expect(updatedStorageLocation.note).not.toEqual(testLocation.note);
        expect(updatedStorageLocation.note).toEqual(updates.note);
      });
    });
  });

  // Items
  describe('Items', () => {
    const testItem = { id: 1, name: 'Christmas Tree', description: 'Fake white Christmas Tree', category: 'Christmas Decorations', userId: 1, locationId: 3 }
    const itemToCreate = { name: 'Small Crate', description: `Hex's small dog crate`, category: 'Pets', userId: 1, locationId: 3 }
    let itemToCreateAndDestroy = null;
    describe('createItem', () => {
      beforeAll(async () => {
        itemToCreateAndDestroy = await createItem(itemToCreate);
      });

      it('Creates a new item in the db', () => {
        expect(itemToCreateAndDestroy).toBeDefined();
        expect(itemToCreateAndDestroy.name).toEqual(itemToCreate.name);
        expect(itemToCreateAndDestroy.description).toEqual(itemToCreate.description);
      });

      it('Creates the new item under the correct user', () => {
        expect(itemToCreateAndDestroy.userId).toBe(itemToCreate.userId);
      });

      it('If no quantity is supplied, sets the default value as 1', () => {
        expect(itemToCreateAndDestroy.quantity).toEqual(1);
      });
    });

    describe('getItemById', () => {
      it('Retrieves the correct item from the db', async () => {
        const { rows: [itemFromQuery] } = await client.query(`
          SELECT *
          FROM items
          WHERE id=$1;
        `, [2]);
        const itemFromAdapter = await getItemById(2);
        expect(itemFromQuery.id).toBe(itemFromAdapter.id);
        expect(itemFromQuery.name).toEqual(itemFromAdapter.name);
        expect(itemFromQuery.description).toEqual(itemFromAdapter.description);
      });
    });

    describe('getItemsByLocation', () => {
      const validLocationId = 3;
      const invalidLocationId = 1000;
      let itemsFromAdapter = null;
      beforeAll(async () => {
        itemsFromAdapter = await getItemsByLocationId(validLocationId);
      });

      it('Returns an array, if the location exists', () => {
        expect(Array.isArray(itemsFromAdapter)).toBe(true);
      });

      it('Throws an error, if the location does not exist', async () => {
        expect.assertions(1);
        await expect(getItemsByLocationId(invalidLocationId)).rejects.toEqual(Error('There is no location with that ID.'));
      });

      it('Returns only items with the correct locationId', () => {
        const itemsWithCorrectId = itemsFromAdapter.filter((item) => item.locationId === validLocationId);
        expect(itemsWithCorrectId.length).toBe(itemsFromAdapter.length);
      });
    });

    describe('getItemsByUserId', () => {
      const validUserId = 1;
      const invalidUserId = 1000;
      let itemsFromAdapter = null;
      beforeAll(async () => {
        itemsFromAdapter = await getItemsByUserId(validUserId);
      });

      it('Returns an array, if the user exists', () => {
        expect(Array.isArray(itemsFromAdapter)).toBe(true);
      });

      it('Throws an error, if the user does not exist', async () => {
        expect.assertions(1);
        await expect(getItemsByUserId(invalidUserId)).rejects.toEqual(Error('There is no user with that ID.'));
      });

      it('Returns only items with the correct userId', () => {
        const itemsWithCorrectId = itemsFromAdapter.filter((item) => item.userId === validUserId);
        expect(itemsWithCorrectId.length).toBe(itemsFromAdapter.length);
      });
    });

    describe('updateItem', () => {
      const itemToUpdateId = 2;
      const itemUpdates = { id: itemToUpdateId, description: '6 gallon glass carboy', quantity: 2 }
      let itemToUpdate = null;
      let updatedItem = null;

      beforeAll(async () => {
        const { rows } = await client.query(`
          SELECT *
          FROM items
          WHERE id=$1;
        `, [2]);
        itemToUpdate = rows[0];
        updatedItem = await updateItem(itemUpdates);
      });

      it('Returns the correct item from the db', () => {
        expect(updatedItem.id).toBe(itemToUpdateId);
      });

      it('Only updates the fields passed in, and returns the updated item', () => {
        expect(updatedItem.name).toBe(itemToUpdate.name);
        expect(updatedItem.quantity).toBe(itemUpdates.quantity);
        expect(updatedItem.quantity).not.toBe(itemToUpdate.quantity);
        expect(updatedItem.description).toBe(itemUpdates.description);
        expect(updatedItem.description).not.toBe(itemToUpdate.description);
      });
    });

    describe('destroyItem', () => {
      let deletedItem = null;
      beforeAll(async () => {
        deletedItem = await destroyItem(itemToCreateAndDestroy);
      });

      it('Returns the correct destroyed item', () => {
        expect(deletedItem).toBeDefined();
        expect(deletedItem.id).toBe(itemToCreateAndDestroy.id);
      });

      it('Permanently deletes the item from the db', async () => {
        const { rows: [item] } = await client.query(`
          SELECT *
          FROM items
          WHERE id=$1;
        `, [deletedItem.id]);
        expect(item).toBeUndefined();
      });
    });
  });

  // Boxes
  describe('Boxes', () => {
    const newBoxData = { label: 'Homebrew Supplies', description: '2 x 4 Plastic Tub', category: 'Homebrew', userId: 1, locationId: 3 };
    const boxToGet = { id: 1, label: 'Halloween Decor', description: '2 x 4 Plastic Tub', category: 'Decor', userId: 1, locationId: 3 };
    let boxToCreateAndUpdate = null;
    describe('createBox', () => {
      beforeAll(async () => {
        boxToCreateAndUpdate = await createBox(newBoxData);
      });

      it('Creates a new box in the db', () => {
        expect(boxToCreateAndUpdate.id).toBeDefined();
      });

      it('Creates a box with the correct data', () => {
        expect(boxToCreateAndUpdate.label).toEqual(newBoxData.label);
        expect(boxToCreateAndUpdate.description).toEqual(newBoxData.description);
        expect(boxToCreateAndUpdate.userId).toBe(newBoxData.userId);
        expect(boxToCreateAndUpdate.locationId).toBe(newBoxData.locationId);
      });
    });

    describe('getBoxById', () => {
      it ('Retrieves the correct box data from the db', async () => {
        const box = await getBoxById(boxToGet.id);
        expect(box).toBeDefined();
        expect(box.id).toBe(boxToGet.id);
      });

      it ('Throws an error if the box does not exist', async () => {
        expect.assertions(1);
        await expect(getBoxById(0)).rejects.toEqual(Error('There is no box with that ID.'));
      });
    });

    describe('getBoxesByLocation', () => {
      const validLocationId = 3;
      const invalidLocationId = 1000;
      let boxesFromAdapter = null;
      beforeAll(async () => {
        boxesFromAdapter = await getBoxesByLocationId(validLocationId);
      });

      it('Returns an array, if the location exists', () => {
        expect(Array.isArray(boxesFromAdapter)).toBe(true);
      });

      it('Throws an error, if the location does not exist', async () => {
        expect.assertions(1);
        await expect(getBoxesByLocationId(invalidLocationId)).rejects.toEqual(Error('There is no location with that ID.'));
      });

      it('Returns only boxes with the correct locationId', () => {
        const boxesWithCorrectId = boxesFromAdapter.filter((box) => box.locationId === validLocationId);
        expect(boxesWithCorrectId.length).toBe(boxesFromAdapter.length);
      });
    });

    describe('getBoxesByUserId', () => {
      const validUserId = 1;
      const invalidUserId = 1000;
      let boxesFromAdapter = null;
      beforeAll(async () => {
        boxesFromAdapter = await getBoxesByUserId(validUserId);
      });

      it('Returns an array, if the user exists', () => {
        expect(Array.isArray(boxesFromAdapter)).toBe(true);
      });

      it('Throws an error, if the user does not exist', async () => {
        expect.assertions(1);
        await expect(getBoxesByUserId(invalidUserId)).rejects.toEqual(Error('There is no user with that ID.'));
      });

      it('Returns only boxes with the correct userId', () => {
        const boxesWithCorrectId = boxesFromAdapter.filter((box) => box.userId === validUserId);
        expect(boxesWithCorrectId.length).toBe(boxesFromAdapter.length);
      });

      it('Returns boxes with an items property, which is an array', () => {
        expect(Array.isArray(boxesFromAdapter[0].items)).toBe(true);
        expect(Array.isArray(boxesFromAdapter[boxesFromAdapter.length - 1].items)).toBe(true);
      });
    });

    describe('updateBox', () => {
      const boxToUpdateId = 5;
      const boxUpdates = { id: boxToUpdateId, label: 'Her Jackets', category: 'Clothing' }
      let boxToUpdate = null;
      let updatedBox = null;

      beforeAll(async () => {
        const { rows } = await client.query(`
          SELECT *
          FROM boxes
          WHERE id=$1;
        `, [5]);
        boxToUpdate = rows[0];
        updatedBox = await updateBox(boxUpdates);
      });

      it('Returns the correct box from the db', () => {
        expect(updatedBox.id).toBe(boxToUpdateId);
      });

      it('Only updates the fields passed in, and returns the updated item', () => {
        expect(updatedBox.id).toBe(boxToUpdate.id);
        expect(updatedBox.label).toBe(boxUpdates.label);
        expect(updatedBox.label).not.toBe(boxToUpdate.label);
        expect(updatedBox.category).toBe(boxUpdates.category);
        expect(updatedBox.category).not.toBe(boxToUpdate.category);
      });
    });

    describe('destroyBox', () => {
      let deletedBox = null;
      beforeAll(async () => {
        deletedBox = await destroyBox(boxToCreateAndUpdate);
      });

      it('Returns the correct destroyed box', () => {
        expect(deletedBox).toBeDefined();
        expect(deletedBox.id).toBe(boxToCreateAndUpdate.id);
      });

      it('Permanently deletes the box from the db', async () => {
        const { rows: [box] } = await client.query(`
          SELECT *
          FROM boxes
          WHERE id=$1;
        `, [deletedBox.id]);
        expect(box).toBeUndefined();
      });
    });
  });

  // Box Items
  describe('Box Items', () => {
    const newBoxItemData = { boxId: 2, itemId: 8 }
    const duplicateItemData = { boxId: 3, itemId: 8 }
    let newBoxItem = null;
    describe('createBoxItem', () => {
      beforeAll(async () => {
        newBoxItem = await createBoxItem(newBoxItemData);
      });

      it('Creates a new relationship between an item and a box', () => {
        expect(newBoxItem.boxId).toBe(newBoxItemData.boxId);
        expect(newBoxItem.itemId).toBe(newBoxItemData.itemId);
      });

      it('Does not allow the same item to have two boxes', async () => {
        expect.assertions(1);
        await expect(createBoxItem(duplicateItemData)).rejects.toEqual(Error('duplicate key value violates unique constraint "box_items_pkey"'))
      });
    });

    describe('getBoxItemByItemId', () => {
      it('Returns the correct box-item relationship, if one exists', async () => {
        const boxItem = await getBoxItemByItemId(newBoxItem.itemId);
        expect(boxItem.itemId).toBe(newBoxItem.itemId);
        expect(boxItem.boxId).toBe(newBoxItem.boxId);
      });

      it('Throws an error, if no relationship exists', async () => {
        expect.assertions(1);
        await expect(getBoxItemByItemId(0)).rejects.toEqual(Error('That item is not in a box.'));        
      });
    });

    describe('getBoxItemsByBoxId', () => {
      const validBoxId = 2;
      const invalidBoxId = 0;
      let boxItemList = null;
      beforeAll(async () => {
        boxItemList = await getBoxItemsByBoxId(validBoxId);
      });

      it ('Returns an array', () => {
        expect(Array.isArray(boxItemList)).toBe(true);
      });

      it('Returns only box-items with the correct boxId', async () => {
        const boxItemsWithCorrectId = boxItemList.filter((boxItem) => boxItem.boxId === validBoxId);
        expect(boxItemsWithCorrectId.length).toBe(boxItemList.length);
      });

      it('Throws an error, if no relationship exists', async () => {
        expect.assertions(1);
        await expect(getBoxItemsByBoxId(invalidBoxId)).rejects.toEqual(Error('There is no box with that ID.'));        
      });
    });

    describe('updateBoxItem', () => {
      const updatedData = { boxId: 3, itemId: 8 }

      it('Updates the boxId of the box-item', async () => {
        const updatedBoxItem = await updateBoxItem(updatedData);
        expect(updatedBoxItem.boxId).toBe(updatedData.boxId);
      });
    });

    describe('deleteBoxItem', () => {
      it('Removes the box-item relationship from the db', async () => {
        expect.assertions(3);
        const deletedBoxItem = await destroyBoxItem(newBoxItem);
        expect(deletedBoxItem.itemId).toBe(newBoxItem.itemId);
        expect(deletedBoxItem.boxId).toBe(3);
        await expect(getBoxItemByItemId(deletedBoxItem.itemId)).rejects.toEqual(Error('That item is not in a box.'));
      });
    });

  });
});