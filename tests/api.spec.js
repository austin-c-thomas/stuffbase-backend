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

});