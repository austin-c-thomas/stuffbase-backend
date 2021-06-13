const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');
require('dotenv').config();

const { 
  createUser,
  getUser,
  updateUser,
  createStorageLocation, 
  getStorageLocationById, 
  updateStorageLocation, 
  createItem, 
  getItemById, 
  getItemsByLocationId, 
  getItemsByUserId,
  updateItem,
  destroyItem,
  createBox, 
  getBoxById, 
  getBoxesByUserId, 
  getBoxesByLocationId,
  updateBox,
  destroyBox,
  createBoxItem, 
  getBoxItemByItemId, 
  getBoxItemsByBoxId, 
  updateBoxItem,
  destroyBoxItem,
  getStorageLocationsByUserId,
  getUserByEmail,
  destroyUser,
  getUserById,
  getStorageLocationContents
} = require('../db');

// Database Tests
describe('Database', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });

  // Users
  describe('Users', () => {
    const testUser = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
    describe('createUser', () => {
      const userToCreate = { email: 'createduser@test.com', password: 'Password19', displayName: 'CreatedUser' };
      const badEmail = { email: 'createduser@testdotcom', password: 'iLoveStuffBase1', displayName: 'CreatedUser' };
      const badPassOne = {email: 'badpass@test.com', password: 'Pass19', displayName: 'CreatedUser' };
      const badPassTwo = {email: 'badpass@test.com', password: 'PASSWORD19', displayName: 'CreatedUser' };
      const badPassThree = {email: 'badpass@test.com', password: 'password19', displayName: 'CreatedUser' };
      const badPassFour = {email: 'badpass@test.com', password: 'Password', displayName: 'CreatedUser' };
      const duplicateEmail = {email: 'createduser@test.com', password: 'Password19', displayName: 'CreatedUser2' };
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
      });

      it('Validates the email format', async () => {
        expect.assertions(1);
        await expect(createUser(badEmail)).rejects.toEqual(Error('Invalid email format.'));
      });

      it('Enforces uniqueness of the email', async () => {
        expect.assertions(1);
        await expect(createUser(duplicateEmail)).rejects.toEqual(Error('A user with that email already exists.'));
      });

      it('Stores the hashed password in the database', async () => {
        const { rows: [dbUser] } = await client.query(`
          SELECT * FROM users
          WHERE id=$1;
        `, [createdUser.id]);
        expect(dbUser.password).toBeTruthy();
        expect(dbUser.password).not.toBe(userToCreate.password);
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
      const updatedEmail = { id: 1, email: 'testuser2@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      const badEmail = { id: 1, email: 'testuser2attest.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      const updatedDisplayName = { id: 1, email: 'testUser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser2' };
      const updateMultiple = { id: 1, email: 'testuser2@test.com', password: 'iLoveStuffBase2', displayName: 'TestUser2' };
      let userToUpdate = null;
      beforeAll(async () => {
        const { rows: [user] } = await client.query(`
          SELECT *
          FROM users
          WHERE id=$1;
        `, [1]);
        userToUpdate = user;
      })
      
      it('Validates the email format', async () => {
        expect.assertions(1);
        await expect(updateUser(badEmail)).rejects.toEqual(Error('Invalid email format.'));
      });

      it(`Successfully updates the user's email`, async () => {
        const updatedUser = await updateUser(updatedEmail);
        expect(updatedUser.email).not.toEqual(userToUpdate.email);
        expect(updatedUser.email).toEqual(updatedEmail.email);
      });

      it(`Successfully updates the user's displayName`, async () => {
        const updatedUser = await updateUser(updatedDisplayName);
        expect(updatedUser.displayName).not.toEqual(userToUpdate.displayName);
        expect(updatedUser.displayName).toEqual(updatedDisplayName.displayName);
      });

      it(`Successfully updates multiple fields at once`, async () => {
        const updatedUser = await updateUser(updateMultiple);
        expect(updatedUser.displayName).not.toEqual(userToUpdate.displayName);
        expect(updatedUser.displayName).toEqual(updateMultiple.displayName);
        expect(updatedUser.email).not.toEqual(userToUpdate.email);
        expect(updatedUser.email).toEqual(updateMultiple.email);
      });
    });

    describe('destroyUser', () => {
      const userToDeleteId = 2;
      let deletedUser;
      beforeAll(async () => {
        deletedUser = await destroyUser(userToDeleteId); 
      });
      
      it('Returns the deleted user', () => {
        expect(deletedUser).toBeDefined();
        expect(deletedUser.id).toBe(userToDeleteId);
      });

      it(`Successfully deletes the user's boxes, items, box_items and storage locations`, async () => {
        const userStorageLocations = await getStorageLocationsByUserId(userToDeleteId);
        const userBoxes = await getBoxesByUserId(userToDeleteId);
        const userItems = await getItemsByUserId(userToDeleteId);
        expect(userStorageLocations).toEqual([]);
        expect(userBoxes).toEqual([]);
        expect(userItems).toEqual([]);
      });

      it('Successfully removes the user from the database', async () => {
        expect.assertions(1);
        await expect(getUserById(userToDeleteId)).rejects.toEqual(Error('There is no user with that ID.'));
      });
    });
  });

  // Storage Locations
  describe('Storage_Locations', () => {
    const testLocation = { id: 3, userId: 1, name: '5x5 Storage Unit', location: 'Remote' };
    let newLocation = null;
    let newLocationId = null;
    describe('createStorageLocation', () => {
      const locationToCreate = { userId: 1, name: 'Hall Closet', location: 'Home', note: 'For cleaning supplies' };
      beforeAll(async () => {
        newLocation = await createStorageLocation(locationToCreate);
        newLocationId = newLocation.id;
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

    describe('getStorageLocationsByUserId', () => {
      const userId = 1;
      let storageLocationList = null;
      beforeAll(async () => {
        storageLocationList = await getStorageLocationsByUserId(userId);
      });

      it('Returns an array', () => {
        expect(Array.isArray(storageLocationList)).toBe(true);
      });

      it('Returns only storage locations with the correct userId', () => {
        const locationsWithCorrectId = storageLocationList.filter((location) => location.userId === userId);
        expect(locationsWithCorrectId.length).toBe(storageLocationList.length);
      });
    });

    describe('getStorageLocationContents', () => {
      const locationWithContentsId = 3;
      it('Returns an object containing boxes and items', async () => {
        const locationContents = await getStorageLocationContents(locationWithContentsId);
        expect(locationContents.boxes).toBeDefined();
        expect(locationContents.items).toBeDefined();
      });

      it('If the location has no contents, contains empty arrays in the return object', async () => {
        const noContents = await getStorageLocationContents(newLocationId);
        expect(noContents.boxes).toEqual([]);
        expect(noContents.items).toEqual([]);
      });

      // it('Throws an error if the location does not exist', async () => {
      //   expect.assertions(1);
      //   await expect(getStorageLocationContents(0)).rejects.toEqual(Error('something'));
      // });
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
      let itemsFromAdapter = null;
      beforeAll(async () => {
        itemsFromAdapter = await getItemsByUserId(validUserId);
      });

      it('Returns an array, if the user exists', () => {
        expect(Array.isArray(itemsFromAdapter)).toBe(true);
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

      it('Removes the item from a box, if it was in one, and the location is being changed', async () => {
        const itemUpdates = { id: 7, locationId: 2 }
        const updatedItem = await updateItem(itemUpdates);
        expect.assertions(2);
        expect(updatedItem).toBeDefined();
        await expect(getBoxItemByItemId(7)).rejects.toEqual(Error('That item is not in a box.'))
      });

      it('Does not remove the item from its box if its location is not being changed', async () => {
        const itemUpdates = { id: 6, description: 'Coffee maker from Tahoe' }
        const updatedItem = await updateItem(itemUpdates);
        const boxItem = await getBoxItemByItemId(updatedItem.id);
        expect(boxItem).toBeDefined();
      });
    });

    describe('destroyItem', () => {
      let deletedItem = null;
      beforeAll(async () => {
        deletedItem = await destroyItem(itemToCreateAndDestroy.id);
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
    let boxToCreateAndDestroy = null;
    describe('createBox', () => {
      beforeAll(async () => {
        boxToCreateAndDestroy = await createBox(newBoxData);
      });

      it('Creates a new box in the db', () => {
        expect(boxToCreateAndDestroy.id).toBeDefined();
      });

      it('Creates a box with the correct data', () => {
        expect(boxToCreateAndDestroy.label).toEqual(newBoxData.label);
        expect(boxToCreateAndDestroy.description).toEqual(newBoxData.description);
        expect(boxToCreateAndDestroy.userId).toBe(newBoxData.userId);
        expect(boxToCreateAndDestroy.locationId).toBe(newBoxData.locationId);
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
      let boxesFromAdapter = null;
      beforeAll(async () => {
        boxesFromAdapter = await getBoxesByUserId(validUserId);
      });

      it('Returns an array, if the user exists', () => {
        expect(Array.isArray(boxesFromAdapter)).toBe(true);
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
      const boxToUpdateId = 2;
      const boxUpdates = { id: boxToUpdateId, label: 'Kitchen', category: 'Cooking', locationId: 4 }
      let boxToUpdate = null;
      let updatedBox = null;
      let oldBoxItemLocations = null;

      beforeAll(async () => {
        boxToUpdate = await getBoxById(boxToUpdateId);
        const { rows } = await client.query(`
          SELECT items.*, box_items."boxId"
          FROM items
          LEFT JOIN box_items ON box_items."itemId" = items.id
          WHERE box_items."boxId"=$1;
        `, [boxToUpdateId]);
        oldBoxItemLocations = rows.map((item) => item.locationId);
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

      it('Moves any box items to the new location, if they exist', async () => {
        const { rows: updatedBoxItems } = await client.query(`
          SELECT items.id, items."locationId", box_items."boxId"
          FROM items
          LEFT JOIN box_items ON box_items."itemId" = items.id
          WHERE box_items."boxId"=$1;
        `, [boxToUpdateId]);
        const newItemLocations = updatedBoxItems.map((item) => item.locationId);
        expect(newItemLocations[0]).toBe(boxUpdates.locationId);
        expect(newItemLocations[newItemLocations.length - 1]).toBe(boxUpdates.locationId);
        expect(newItemLocations[0]).not.toBe(oldBoxItemLocations[0]);
        expect(newItemLocations[newItemLocations.length - 1]).not.toBe(oldBoxItemLocations[oldBoxItemLocations.length - 1]);

      });
    });

    describe('destroyBox', () => {
      let deletedBox = null;
      beforeAll(async () => {
        deletedBox = await destroyBox(boxToCreateAndDestroy.id);
      });

      it('Returns the correct destroyed box', () => {
        expect(deletedBox).toBeDefined();
        expect(deletedBox.id).toBe(boxToCreateAndDestroy.id);
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
    let oldItem = null;
    let newBoxItem = null;
    describe('createBoxItem', () => {
      beforeAll(async () => {
        oldItem = await getItemById(newBoxItemData.itemId);
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

      it('Moves the item to the location of the box, if it is not already there', async () => {
        const { locationId: boxLocation } = await getBoxById(newBoxItemData.boxId);
        const { locationId: newItemLocation } = await getItemById(newBoxItemData.itemId);
        expect(newItemLocation).not.toBe(oldItem.locationId);
        expect(newItemLocation).toBe(boxLocation);
      })
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
      let oldBoxItem = null;
      let oldItemLocation = null;
      let newBoxLocation = null;
      let newBoxItem = null;
      beforeAll(async () => {
        oldBoxItem = await getBoxItemByItemId(updatedData.itemId);
        // console.log('OLD BOX ITEM', oldBoxItem);
        oldItemLocation = await getItemById(updatedData.itemId);
        newBoxLocation = await getBoxById(updatedData.boxId);
        newBoxItem = await updateBoxItem(updatedData);
        // console.log('NEW BOX ITEM', newBoxItem);
      });

      it('Updates the boxId of the box-item', () => {
        expect(newBoxItem.boxId).toBe(updatedData.boxId);
      });

      it('Changes the location of the item to that of the new box', async () => {
        const updatedItemLocation = await getItemById(updatedData.itemId);
        expect(updatedItemLocation.locationId).toBe(newBoxLocation.locationId);
        expect(updatedItemLocation.locationId).not.toBe(oldItemLocation.locationId);
      });
    });

    describe('deleteBoxItem', () => {
      it('Removes the box-item relationship from the db', async () => {
        expect.assertions(3);
        const deletedBoxItem = await destroyBoxItem(newBoxItem.itemId);
        expect(deletedBoxItem.itemId).toBe(newBoxItem.itemId);
        expect(deletedBoxItem.boxId).toBe(3);
        await expect(getBoxItemByItemId(deletedBoxItem.itemId)).rejects.toEqual(Error('That item is not in a box.'));
      });
    });

  });
});