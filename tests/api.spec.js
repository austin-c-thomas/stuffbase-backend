const axios = require('axios');
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
      });

      it(`Returns the correct user's data, without the password`, () => {
        expect(userData.id).toBe(validCredentials.id);
        expect(userData.email).toBe(validCredentials.email);
        expect(userData.password).toBeUndefined();
      });

      it(`Includes the user's storage_locations, boxes, and items in the form of arrays`, () => {
        expect(Array.isArray(userData.storage_locations)).toBe(true);
        expect(Array.isArray(userData.boxes)).toBe(true);
        expect(Array.isArray(userData.items)).toBe(true);
      });
    });
  });

});