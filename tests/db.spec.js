require('dotenv').config();
const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');

const { 
  createUser,
  getUser,
  updateUser,
} = require('../db/adapters/users');
const { expect, describe, it, beforeAll } = require('@jest/globals');
const { createStorageLocation, getStorageLocationById, updateStorageLocation } = require('../db/adapters/storage_locations');

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
});