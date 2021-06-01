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
  updateStorageLocation } = require('../db/adapters/storage_locations');

const {
  createItem, 
  getItemById, 
  getItemsByLocation, 
  getItemsByUserId,
  updateItem,
} = require('../db/adapters/items');

describe('Database', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });

  // Users
  describe('Users', () => {
    const testUser = { id: 1, email: 'testUser@test.com', password: 'iLoveStuffBase1', displayName: 'Test User'};
    describe('createUser', () => {
      const userToCreate = {email: 'createdUser@test.com', password: 'Password19', displayName: 'Created User'};
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
    const duplicateLocation = { userId: 1, name: '5x5 Storage Unit' }
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

      it('Throws an error when trying to create a duplicate storage location', async () => {
        expect.assertions(1);
        await expect(createStorageLocation(duplicateLocation)).rejects.toEqual(Error('A storage location by that name already exists.'));
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
    describe('createItem', () => {
      const itemToCreate = { name: 'Small Crate', description: `Hex's small dog crate`, category: 'Pets', userId: 1, locationId: 3 }
      let newItem = null;
      beforeAll(async () => {
        newItem = await createItem(itemToCreate);
      });

      it('Creates a new item in the db', () => {
        expect(newItem).toBeDefined();
        expect(newItem.name).toEqual(itemToCreate.name);
        expect(newItem.description).toEqual(itemToCreate.description);
      });

      it('Creates the new item under the correct user', () => {
        expect(newItem.userId).toBe(itemToCreate.userId);
      });

      it('If no quantity is supplied, sets the default value as 1', () => {
        expect(newItem.quantity).toEqual(1);
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
        itemsFromAdapter = await getItemsByLocation(validLocationId);
      });

      it('Returns an array, if the location exists', () => {
        expect(Array.isArray(itemsFromAdapter)).toBe(true);
      });

      it('Throws an error, if the location does not exist', async () => {
        expect.assertions(1);
        await expect(getItemsByLocation(invalidLocationId)).rejects.toEqual(Error('There is no location with that ID.'));
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
  });
});