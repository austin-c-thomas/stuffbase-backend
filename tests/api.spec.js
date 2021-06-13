const axios = require('axios');
const { 
  updateUser,
  getUserById,
  getUser,
  getBoxesByUserId,
  getItemsByUserId,
  getStorageLocationsByUserId,
  getStorageLocationById,
  getItemById,
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

      it('Throws an error if required fields are missing from the request', async () => {
        const missingFields = { email: 'nedstark@thenorth.com', password: 'IloveWolves80' };
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/users/register`, missingFields)).rejects.toEqual(Error('Request failed with status code 500'));
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

      it ('Throws an error if the request has missing required fields', async () => {
        const missingFields = { id: 3, email: 'johnsnow@thewall.com', displayName: 'John Snow' }
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/users/${missingFields.id}`, missingFields, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
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

  // Storage Locations
  describe('Storage Locations', () => {
    const testUserId = 3;
    let token = null;
    let userStorageLocations = null;
    let locationToCreateAndUpdateId = null;
    let secondaryLocationId = null;
    let seedToken = null;

    beforeAll(async () => {
      const { data: user } = await axios.post(`${API_URL}/api/users/login`, { email: 'johnsnow@thewall.com', password: 'Ilovewolves900' });
      token = user.token;
      const { data: locations } = await axios.get(`${API_URL}/api/storage_locations`, { headers: {'Authorization': `Bearer ${token}`}});
      userStorageLocations = locations;
    });

    describe('GET /storage_locations', () => {
      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/storage_locations`)).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Returns an array', () => {
        expect(Array.isArray(userStorageLocations)).toBe(true);
      });

      it('Returns an empty array if the user has no storage locations', async () => {
        expect(userStorageLocations).toEqual([])
      }); 

      it('Retrieves all storage locations for the user that made the request', async () => {
        const userWithLocationsId = 1;
        const { rows: dbUserLocations } = await client.query(`
          SELECT *
          FROM storage_locations
          WHERE "userId"=$1;
        `, [userWithLocationsId]);

        const { data: user } = await axios.post(`${API_URL}/api/users/login`, { email: 'testuser@test.com', password: 'iLoveStuffBase1' });
        seedToken = user.token;
        const { data: locations } = await axios.get(`${API_URL}/api/storage_locations`, { headers: {'Authorization': `Bearer ${seedToken}`} });

        expect(locations[0].userId).toBe(userWithLocationsId);
        expect(locations[locations.length - 1].userId).toBe(userWithLocationsId);
        expect(locations.length).toBe(dbUserLocations.length);
      });
    });

    describe('POST /storage_locations', () => {
      const validLocationData = { name: 'Hole in backyard', location: 'Remote', note: 'For valuables' };
      const secondaryLocationData = { name: 'Iron Bank', location: 'Remote'};
      const missingData = { location: 'Remote', note: 'For valuables' };
      let newStorageLocation = null;
      let secondaryLocation = null;
      beforeAll(async () => {
        const { data: newLocation } = await axios.post(`${API_URL}/api/storage_locations`, validLocationData, { headers: {'Authorization': `Bearer ${token}`} });
        newStorageLocation = newLocation;
        locationToCreateAndUpdateId = newLocation.id;
        const { data: secondLocation } = await axios.post(`${API_URL}/api/storage_locations`, secondaryLocationData, { headers: {'Authorization': `Bearer ${token}`} });
        secondaryLocation = secondLocation;
        secondaryLocationId = secondLocation.id;
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/storage_locations`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
      
      it('Creates a new storage location for the user that made the request', () => {
        expect(newStorageLocation.id).toBeDefined();
        expect(newStorageLocation.userId).toBe(testUserId);
      });

      it('Throws an error when required data is not supplied in the request body', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/storage_locations`, missingData, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('GET /storage_locations/:locationId', () => {
      it ('Retrieves the correct storage location', async () => {
        const { data: storageLocation } = await axios.get(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} });
        expect(storageLocation.id).toBe(locationToCreateAndUpdateId);
      });

      it ('Throws an error if the locationId does not exist', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/storage_locations/0`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the user tries to access a locationId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/storage_locations/3`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('PATCH /storage_locations/:locationId', () => {
      const updateData = { name: 'trench in backyard', location: 'Home' }
      let updatedStorageLocation = null;
      beforeAll(async () => {
        const { data } = await axios.patch(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`, updateData, { headers: {'Authorization': `Bearer ${token}`} });
        updatedStorageLocation = data;
      });
      
      it ('Updates the correct storage location', () => {
        expect(updatedStorageLocation.id).toBe(locationToCreateAndUpdateId);
      });

      it ('Updates the fields passed in the request', () => {
        expect(updatedStorageLocation.name).toBe(updateData.name);
        expect(updatedStorageLocation.location).toBe(updateData.location);
      });

      it ('Throws an error if nothing is supplied in the request body', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the user tries to update a locationId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/storage_locations/3`, updateData, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`, updateData)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('DELETE /storage_locations/:locationId', () => {
      const locationWithContentsId = 3;
      let deletedStorageLocation = null;
      beforeAll(async () => {
        deletedStorageLocation = await axios.delete(`${API_URL}/api/storage_locations/${locationToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })
      });

      it('Does not allow the deletion of a location with contents', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/storage_locations/${locationWithContentsId}`, { headers: {'Authorization': `Bearer ${seedToken}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Removes the storage location from the db', async () => {
        expect.assertions(2);
        expect(deletedStorageLocation).toBeDefined();
        await expect(getStorageLocationById(deletedStorageLocation.id)).rejects.toEqual(Error('There is no location with that ID.'));
      });

      it ('Throws an error if the user tries to delete a locationId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/storage_locations/3`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/storage_locations/3`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });
  });

  // Items
  describe('Items', () => {
    let seedUserId = null;
    let testUserId = null;
    let token = null;
    let testUserItems = null;
    let seedUserItems = null;
    let itemToCreateAndUpdate = null;
    let itemToCreateAndUpdateId = null;
    let seedToken = null;
    beforeAll(async () => {
      const { data: test } = await axios.post(`${API_URL}/api/users/login`, { email: 'johnsnow@thewall.com', password: 'Ilovewolves900' });
      token = test.token;
      testUserId = test.user.id;

      const { data: seed } = await axios.post(`${API_URL}/api/users/login`, { email: 'testuser@test.com', password: 'iLoveStuffBase1' });
      seedToken = seed.token;
      seedUserId = seed.user.id;
    });

    describe('GET /items', () => {
      beforeAll(async () => {
        const { data: testItems } = await axios.get(`${API_URL}/api/items`, { headers: {'Authorization': `Bearer ${token}`}});
        testUserItems = testItems; 
        const { data: seedItems } = await axios.get(`${API_URL}/api/items`, { headers: {'Authorization': `Bearer ${seedToken}`}});
        seedUserItems = seedItems; 
      });

      it('Returns an array', () => {
        expect(Array.isArray(testUserItems)).toBe(true);
        expect(Array.isArray(seedUserItems)).toBe(true);
      });

      it('Returns an empty array if the user has no items', () => {
        expect(testUserItems).toEqual([]);
      });

      it('If user has items, returns only the items belonging to the user that made the request', async () => {
        const { rows: itemsFromDb } = await client.query(`SELECT * FROM items WHERE "userId"=$1;`, [seedUserId]);
        expect(itemsFromDb.length).toBe(seedUserItems.length);
        expect(seedUserItems[0].userId).toBe(seedUserId);
        expect(seedUserItems[seedUserItems.length - 1].userId).toBe(seedUserId);
      });

      it('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/items`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('POST /items', () => {
      const allFields = { name: 'Longsword', description: `Ole' trusty`, category: 'Weapons', quantity: 1, imageUrl: 'www.imgurl.com/longsword', locationId: 9 };
      const someFields = { name: 'Winter Coat', quantity: 2, userId: testUserId, locationId: 9 };
      const requiredFieldsMissing = { description: `Ole' trusty`, category: 'Weapons', quantity: 1, imageUrl: 'www.imgurl.com/longsword' };
      let secondItem = null;
      beforeAll(async () => {
        const { data: newItem } = await axios.post(`${API_URL}/api/items`, allFields, { headers: {'Authorization': `Bearer ${token}`}});
        itemToCreateAndUpdate = newItem;
        itemToCreateAndUpdateId = newItem.id;
        const { data: newItem2 } = await axios.post(`${API_URL}/api/items`, someFields, { headers: {'Authorization': `Bearer ${token}`}});
        secondItem = newItem2;
      });

      it('Adds a new item to the database if required fields are provided in the request body', () => {
        expect(itemToCreateAndUpdate.id).toBeDefined();
        expect(itemToCreateAndUpdate.userId).toBe(testUserId);
        expect(secondItem.id).toBeDefined();
        expect(secondItem.userId).toBe(testUserId);
      });

      it('Throws an error if required data is not send in the request body', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/items`, requiredFieldsMissing, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.post(`${API_URL}/api/items`, allFields)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('GET /items/:itemId', () => {
      it ('Retrieves the correct item', async () => {
        const { data: item } = await axios.get(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} });
        expect(item.id).toBe(itemToCreateAndUpdateId);
      });

      it ('Throws an error if the itemId does not exist', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/items/0`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the user tries to access an itemId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/items/3`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/items/${itemToCreateAndUpdateId}`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('PATCH /items/:itemId', () => {
      const updateData = { name: `Ole' Trusty`, description: 'Long sword' };
      let updatedItem = null;
      beforeAll(async () => {
        const { data } = await axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, updateData, { headers: {'Authorization': `Bearer ${token}`} });
        updatedItem = data;
      });
      
      it ('Updates the correct item', () => {
        expect(updatedItem.id).toBe(itemToCreateAndUpdateId);
      });

      it ('Updates the fields passed in the request', () => {
        expect(updatedItem.name).toBe(updateData.name);
        expect(updatedItem.description).toBe(updateData.description);
      });

      it ('Throws an error if nothing is supplied in the request body', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the user tries to update an itemId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/items/1`, updateData, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, updateData)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('DELETE /items/:itemId', () => {
      let deletedItem = null;
      beforeAll(async () => {
        const { data: item} = await axios.delete(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })
        deletedItem = item;
      });

      it('Removes the item from the db', async () => {
        expect.assertions(2);
        expect(deletedItem).toBeDefined();
        await expect(getItemById(deletedItem.id)).rejects.toEqual(Error('There is no item with that ID.'));
      });

      it ('Throws an error if the user tries to delete a itemId that is not theirs', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/items/1`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      });

      it ('Throws an error if the request is made without a token', async () => {
        expect.assertions(1);
        await expect(axios.delete(`${API_URL}/api/items/1`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });
  });

    // Boxes
    describe('Boxes', () => {
      let seedUserId = null;
      let testUserId = null;
      let token = null;
      let testUserBoxes = null;
      let seedUserBoxes = null;
      let boxToCreateAndUpdate = null;
      let boxToCreateAndUpdateId = null;
      let seedToken = null;
      beforeAll(async () => {
        const { data: test } = await axios.post(`${API_URL}/api/users/login`, { email: 'johnsnow@thewall.com', password: 'Ilovewolves900' });
        token = test.token;
        testUserId = test.user.id;
  
        const { data: seed } = await axios.post(`${API_URL}/api/users/login`, { email: 'testuser@test.com', password: 'iLoveStuffBase1' });
        seedToken = seed.token;
        seedUserId = seed.user.id;
      });
  
      describe('GET /boxes', () => {
        beforeAll(async () => {
          const { data: testBoxes } = await axios.get(`${API_URL}/api/boxes`, { headers: {'Authorization': `Bearer ${token}`}});
          testUserBoxes = testBoxes; 
          const { data: seedBoxes } = await axios.get(`${API_URL}/api/boxes`, { headers: {'Authorization': `Bearer ${seedToken}`}});
          seedUserBoxes = seedBoxes; 
        });
  
        it('Returns an array', () => {
          expect(Array.isArray(testUserBoxes)).toBe(true);
          expect(Array.isArray(seedUserBoxes)).toBe(true);
        });
  
        it('Returns an empty array if the user has no boxes', () => {
          expect(testUserBoxes).toEqual([]);
        });
  
        it('If user has items, returns only the boxes belonging to the user that made the request', async () => {
          const { rows: boxesFromDb } = await client.query(`SELECT * FROM boxes WHERE "userId"=$1;`, [seedUserId]);
          expect(boxesFromDb.length).toBe(seedUserBoxes.length);
          expect(seedUserBoxes[0].userId).toBe(seedUserId);
          expect(seedUserBoxes[seedUserBoxes.length - 1].userId).toBe(seedUserId);
        });
  
        it('Throws an error if the request is made without a token', async () => {
          expect.assertions(1);
          await expect(axios.get(`${API_URL}/api/boxes`)).rejects.toEqual(Error('Request failed with status code 500'));
        });
      });
  
      describe('POST /boxes', () => {
        const allFields = { label: 'Solid Chest', description: `For weapons and armor`, category: 'Weapons', locationId: 9 };
        const someFields = { label: 'Satchel', locationId: 9 };
        const requiredFieldsMissing = { description: `For weapons and armor`, category: 'Weapons', locationId: 9 };
        let secondBox = null;
        beforeAll(async () => {
          const { data: newBox } = await axios.post(`${API_URL}/api/boxes`, allFields, { headers: {'Authorization': `Bearer ${token}`}});
          boxToCreateAndUpdate = newBox;
          boxToCreateAndUpdateId = newBox.id;
          const { data: newBox2 } = await axios.post(`${API_URL}/api/boxes`, someFields, { headers: {'Authorization': `Bearer ${token}`}});
          secondBox = newBox2;
        });
  
        it('Adds a new box to the database if required fields are provided in the request body', () => {
          expect(boxToCreateAndUpdate.id).toBeDefined();
          expect(boxToCreateAndUpdate.userId).toBe(testUserId);
          expect(secondBox.id).toBeDefined();
          expect(secondBox.userId).toBe(testUserId);
        });
  
        it('Throws an error if required data is not send in the request body', async () => {
          expect.assertions(1);
          await expect(axios.post(`${API_URL}/api/boxes`, requiredFieldsMissing, { headers: {'Authorization': `Bearer ${token}`}})).rejects.toEqual(Error('Request failed with status code 500'));
        });
  
        it('Throws an error if the request is made without a token', async () => {
          expect.assertions(1);
          await expect(axios.post(`${API_URL}/api/boxes`, allFields)).rejects.toEqual(Error('Request failed with status code 500'));
        });
      });
  
      describe('GET /boxes/:boxId', () => {
        it ('Retrieves the correct box', async () => {
          const { data: box } = await axios.get(`${API_URL}/api/boxes/${boxToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} });
          expect(box.id).toBe(boxToCreateAndUpdateId);
        });
  
        it ('Throws an error if the boxId does not exist', async () => {
          expect.assertions(1);
          await expect(axios.get(`${API_URL}/api/boxes/0`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
        });
  
        it ('Throws an error if the user tries to access an boxId that is not theirs', async () => {
          expect.assertions(1);
          await expect(axios.get(`${API_URL}/api/boxes/1`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
        });
  
        it ('Throws an error if the request is made without a token', async () => {
          expect.assertions(1);
          await expect(axios.get(`${API_URL}/api/boxes/${boxToCreateAndUpdateId}`)).rejects.toEqual(Error('Request failed with status code 500'));
        });
      });
  
      // describe('PATCH /items/:itemId', () => {
      //   const updateData = { name: `Ole' Trusty`, description: 'Long sword' };
      //   let updatedItem = null;
      //   beforeAll(async () => {
      //     const { data } = await axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, updateData, { headers: {'Authorization': `Bearer ${token}`} });
      //     updatedItem = data;
      //   });
        
      //   it ('Updates the correct item', () => {
      //     expect(updatedItem.id).toBe(itemToCreateAndUpdateId);
      //   });
  
      //   it ('Updates the fields passed in the request', () => {
      //     expect(updatedItem.name).toBe(updateData.name);
      //     expect(updatedItem.description).toBe(updateData.description);
      //   });
  
      //   it ('Throws an error if nothing is supplied in the request body', async () => {
      //     expect.assertions(1);
      //     await expect(axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      //   });
  
      //   it ('Throws an error if the user tries to update an itemId that is not theirs', async () => {
      //     expect.assertions(1);
      //     await expect(axios.patch(`${API_URL}/api/items/1`, updateData, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      //   });
  
      //   it ('Throws an error if the request is made without a token', async () => {
      //     expect.assertions(1);
      //     await expect(axios.patch(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, updateData)).rejects.toEqual(Error('Request failed with status code 500'));
      //   });
      // });
  
      // describe('DELETE /items/:itemId', () => {
      //   let deletedItem = null;
      //   beforeAll(async () => {
      //     const { data: item} = await axios.delete(`${API_URL}/api/items/${itemToCreateAndUpdateId}`, { headers: {'Authorization': `Bearer ${token}`} })
      //     deletedItem = item;
      //   });
  
      //   it('Removes the item from the db', async () => {
      //     expect.assertions(2);
      //     expect(deletedItem).toBeDefined();
      //     await expect(getItemById(deletedItem.id)).rejects.toEqual(Error('There is no item with that ID.'));
      //   });
  
      //   it ('Throws an error if the user tries to delete a itemId that is not theirs', async () => {
      //     expect.assertions(1);
      //     await expect(axios.delete(`${API_URL}/api/items/1`, { headers: {'Authorization': `Bearer ${token}`} })).rejects.toEqual(Error('Request failed with status code 500'));
      //   });
  
      //   it ('Throws an error if the request is made without a token', async () => {
      //     expect.assertions(1);
      //     await expect(axios.delete(`${API_URL}/api/items/1`)).rejects.toEqual(Error('Request failed with status code 500'));
      //   });
      // });
    });
});