const axios = require('axios');
const { 
  updateUser,
  getUserById,
  getUser,
  getBoxesByUserId,
  getItemsByUserId,
  getStorageLocationsByUserId,
} = require('../db');
require('dotenv').config();
const client = require('../db/client');
const { rebuildDB } = require('../db/seedData');

const { SERVER_ADDRESS = 'http://localhost:', PORT = 3000} = process.env;
const API_URL = process.env.API_URL || SERVER_ADDRESS + PORT;

// API Tests
describe('API', () => {
  beforeAll(async () => {
    await rebuildDB();
  });

  afterAll(() => {
    client.end();
  });

  // Health
  it('Responds to requests made to /api/health', async () => {
    res = await axios.get(`${API_URL}/api/health`);
    expect(res.data.message).toBe('The API is healthy.');
  });

  // Users
  describe('Users', () => {
    const validUserData = { email: 'johnsnow@thenorth.com', password: 'Ilovewolves99', displayName: 'John Snow' };
    const badPasswordData = { email: 'nedstark@thenorth.com', password: 'ilovewolves', displayName: 'Ned Stark' };
    let userToCreateAndUpdate = null;
    describe('POST /users/register', () => {
      beforeAll(async () => {
        const { data } = await axios.post(`${API_URL}/api/users/register`, validUserData);
        userToCreateAndUpdate = data;
      });

      it('Successfully registers a user, returning their data without a password and a token', () => {
        expect(userToCreateAndUpdate).toBeDefined();
        expect(userToCreateAndUpdate.user.email.toLowerCase()).toEqual(validUserData.email.toLowerCase());
        expect(userToCreateAndUpdate.user.password).toBeUndefined();
        expect(userToCreateAndUpdate.token).toBeDefined();
      });

      it('Throws an error if the password does not meet strength params', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/users/register`, badPasswordData)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('POST /users/login', () => {
      const validCredentials = { email: 'johnsnow@thenorth.com', password: 'Ilovewolves99' };
      const missingCredentials = { email: 'johnsnow@thenorth.com', password: '' };
      const incorrectCredentials =  { email: 'johnsnow@thenorth.com', password: 'Ilovewolves9' };
      beforeAll(async () => {
        const { data } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
        userToCreateAndUpdate = data;
      });

      it('Successfully logs the user in, returning their data without a password and a token', () => {
        expect(userToCreateAndUpdate).toBeDefined();
        expect(userToCreateAndUpdate.user.email.toLowerCase()).toEqual(validCredentials.email.toLowerCase());
        expect(userToCreateAndUpdate.user.password).toBeUndefined();
        expect(userToCreateAndUpdate.token).toBeDefined();
      });

      it('Throws an error when credentials are missing', async () => {
        expect.assertions(1); 
        await expect(axios.post(`${API_URL}/api/users/login`, missingCredentials)).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Throws an error when credentials are incorrect', async () => {
        expect.assertions(1); 
        await expect(axios.post(`${API_URL}/api/users/login`, incorrectCredentials)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('GET /users/:userId', () => {
      const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      let token = null;
      let userData = null;
      beforeAll(async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
        token = user.token;
        const { data } = await axios.get(`${API_URL}/api/users/${validCredentials.id}`, { headers: {'Authorization': `Bearer ${token}`}});
        userData = data;
      });

      it(`Returns the correct user's data, without the password`, () => {
        expect(userData.id).toBe(validCredentials.id);
        expect(userData.email).toBe(validCredentials.email);
        expect(userData.password).toBeUndefined();
      });

      it('Throws an error if the user is not signed in', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/users/${validCredentials.id}`)).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Throws an error if the user is unauthorized', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/users/2`, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    // describe('GET /users/:userId/boxes', () => {
    //   const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
    //   let boxList = null;
    //   beforeAll(async () => {
    //     const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
    //     const token = user.token;
    //     const { data } = await axios.get(`${API_URL}/api/users/${validCredentials.id}/boxes`, { headers: {'Authorization': `Bearer ${token}`}});
    //     boxList = data;
    //   });

    //   it('Returns an array', () => {
    //     expect(Array.isArray(boxList)).toBe(true);
    //   });

    //   it('Returns all of the boxes with the correct userId', async () => {
    //     const dbBoxes = await getBoxesByUserId(validCredentials.id);
    //     expect(boxList.length).toBe(dbBoxes.length);
    //     expect(boxList[0].userId).toBe(validCredentials.id);
    //     expect(boxList[boxList.length - 1].userId).toBe(validCredentials.id)
    //   });
    // });

    // describe('GET /users/:userId/items', () => {
    //   const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
    //   let itemList = null;
    //   beforeAll(async () => {
    //     const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
    //     const token = user.token;
    //     const { data } = await axios.get(`${API_URL}/api/users/${validCredentials.id}/items`, { headers: {'Authorization': `Bearer ${token}`}});
    //     itemList = data;
    //   });

    //   it('Returns an array', () => {
    //     expect(Array.isArray(itemList)).toBe(true);
    //   });

    //   it('Returns all of the boxes with the correct userId', async () => {
    //     const dbItems = await getItemsByUserId(validCredentials.id);
    //     expect(itemList.length).toBe(dbItems.length);
    //     expect(itemList[0].userId).toBe(validCredentials.id);
    //     expect(itemList[itemList.length - 1].userId).toBe(validCredentials.id)
    //   });
    // });

    describe('PATCH /users/:userId', () => {
      const userUpdates = { id: 3, email: 'johnsnow@thewall.com', password: 'Ilovewolves900', displayName: 'John Snow' }
      let userPreUpdate = null;
      let token = null;
      let updatedUser = null;
      beforeAll(async () => {
        const { data: userPreData } = await axios.post(`${API_URL}/api/users/login`, { email: 'johnsnow@thenorth.com', password: 'Ilovewolves99' });
        userPreUpdate = userPreData.user;
        token = userPreData.token;
        const { data: userUpdate } = await axios.patch(`${API_URL}/api/users/${userUpdates.id}`, userUpdates, { headers: {'Authorization': `Bearer ${token}`}})
        updatedUser = userUpdate;
      });

      it(`Updates the user's email`, () => {
        expect(updatedUser.email).toBe(userUpdates.email);
        expect(updatedUser.email).not.toBe(userPreUpdate.email);
      });

      it(`Updates the user's password`, async () => {
        const passwordChanged = await getUser({ email: userUpdates.email, password: userUpdates.password });
        expect(passwordChanged.email).toBeDefined();
      });

      it('Throws an error if the user is unauthorized', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/users/1`, userUpdates, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('DELETE /users/:userId', () => {
      const userToDeleteId = 2;
      let token = null;
      let deletedUser = null;
      beforeAll(async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, { email: 'bonybones@gmail.com', password: 'TwistedBow99' });
        token = user.token;
      });
      
      it('Does not allow a non-admin user to delete another user', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/users/1`, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Deletes the user from the database', async () => {
        expect.assertions(1);
        deletedUser = await axios.delete(`${API_URL}/api/users/${userToDeleteId}`, { headers: {'Authorization': `Bearer ${token}`}});
        await expect(getUserById(userToDeleteId)).rejects.toEqual(Error('There is no user with that ID.'));
      });

      it(`Removes the user's storage_locations, items, and boxes from the db`, async () => {
        const userLocations = await getStorageLocationsByUserId(userToDeleteId);
        const userBoxes = await getBoxesByUserId(userToDeleteId);
        const userItems = await getItemsByUserId(userToDeleteId);
        expect(userLocations).toEqual([]);
        expect(userBoxes).toEqual([]);
        expect(userItems).toEqual([]);
      });
    });
  });

  describe('Storage Locations', () => {
    const testUserId = 1;
    let token = null;
    let userStorageLocations = null;
    beforeAll(async () => {
      const { data: user } = await axios.post(`${API_URL}/api/users/login`, { email: 'testuser@test.com', password: 'iLoveStuffBase1' });
      token = user.token;
      const { data: locations } = await axios.get(`${API_URL}/api/storage_locations`, { headers: {'Authorization': `Bearer ${token}`}});
      userStorageLocations = locations;
    });

    describe('GET /storage_locations', () => {
      it('Returns an array', () => {
        expect(Array.isArray(userStorageLocations)).toBe(true);
      });

      it('Retrieves all storage locations for the user that made the request', async () => {
        const { rows: dbUserLocations } = await client.query(`
          SELECT *
          FROM storage_locations
          WHERE "userId"=$1;
        `, [testUserId]);
        expect(userStorageLocations[0].userId).toBe(testUserId);
        expect(userStorageLocations[userStorageLocations.length - 1].userId).toBe(testUserId);
        expect(userStorageLocations.length).toBe(dbUserLocations.length);
      });

      it('Returns an empty array if the user has no storage locations', async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, { email: 'johnsnow@thewall.com', password: 'Ilovewolves900' });
        const altToken = user.token;
        const { data: locations } = await axios.get(`${API_URL}/api/storage_locations`, { headers: {'Authorization': `Bearer ${altToken}`} });
        expect(locations).toEqual([]);
      }); 
    });

    describe('POST /storage_locations', () => {
      const validLocationData = { name: 'Hole in backyard', location: 'Remote', note: 'For valuables' };
      const missingData = { location: 'Remote', note: 'For valuables' };
      let newStorageLocation = null;
      beforeAll(async () => {
        const { data: newLocation } = await axios.post(`${API_URL}/api/storage_locations`, validLocationData, { headers: {'Authorization': `Bearer ${token}`} });
        newStorageLocation = newLocation;
      });
      
      it('Creates a new storage location for the user that made the request', () => {
        expect(newStorageLocation.id).toBeDefined();
        expect(newStorageLocation.userId).toBe(testUserId);
      });

      it('Throws an error when required data is not supplied in the request body', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/storage_locations`, missingData, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'))
      });
    });
  });
});