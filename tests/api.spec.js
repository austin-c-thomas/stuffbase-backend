const axios = require('axios');
const { 
  updateUser,
  getUserById,
  getUser,
  getBoxesByUserId,
  getItemsByUserId,
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

    describe('GET /users/me', () => {
      const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      let userData = null;
      beforeAll(async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
        const token = user.token;
        const { data } = await axios.get(`${API_URL}/api/users/me`, { headers: {'Authorization': `Bearer ${token}`}});
        userData = data;
        console.log(userData);
      });

      it(`Returns the correct user's data, without the password`, () => {
        expect(userData.id).toBe(validCredentials.id);
        expect(userData.email).toBe(validCredentials.email);
        expect(userData.password).toBeUndefined();
      });

      it('Throws an error if the user is unauthorized', async () => {
        expect.assertions(1);
        await expect(axios.get(`${API_URL}/api/users/me`)).rejects.toEqual(Error('Request failed with status code 500'));
      });
    });

    describe('GET /users/me/boxes', () => {
      const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      let boxList = null;
      beforeAll(async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
        const token = user.token;
        const { data } = await axios.get(`${API_URL}/api/users/me/boxes`, { headers: {'Authorization': `Bearer ${token}`}});
        boxList = data;
      });

      it('Returns an array', () => {
        expect(Array.isArray(boxList)).toBe(true);
      });

      it('Returns all of the boxes with the correct userId', async () => {
        const dbBoxes = await getBoxesByUserId(validCredentials.id);
        expect(boxList.length).toBe(dbBoxes.length);
        expect(boxList[0].userId).toBe(validCredentials.id);
        expect(boxList[boxList.length - 1].userId).toBe(validCredentials.id)
      });
    });

    describe('GET /users/me/items', () => {
      const validCredentials = { id: 1, email: 'testuser@test.com', password: 'iLoveStuffBase1', displayName: 'TestUser1' };
      let itemList = null;
      beforeAll(async () => {
        const { data: user } = await axios.post(`${API_URL}/api/users/login`, validCredentials);
        const token = user.token;
        const { data } = await axios.get(`${API_URL}/api/users/me/items`, { headers: {'Authorization': `Bearer ${token}`}});
        itemList = data;
      });

      it('Returns an array', () => {
        expect(Array.isArray(itemList)).toBe(true);
      });

      it('Returns all of the boxes with the correct userId', async () => {
        const dbItems = await getItemsByUserId(validCredentials.id);
        expect(itemList.length).toBe(dbItems.length);
        expect(itemList[0].userId).toBe(validCredentials.id);
        expect(itemList[itemList.length - 1].userId).toBe(validCredentials.id)
      });
    });

    describe('PATCH /users/:userId', () => {
      const userUpdates = { id: 2, email: 'johnsnow@thewall.com', password: 'Ilovewolves900', displayName: 'John Snow' }
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
  });

});