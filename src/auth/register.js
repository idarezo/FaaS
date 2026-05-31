const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getClient } = require('../utils/db');
const { generateToken } = require('../utils/auth');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body || '{}');

    if (!email || !password || !name) {
      return error('Polja email, password in name so obvezna', 400);
    }

    if (password.length < 6) {
      return error('Geslo mora imeti vsaj 6 znakov', 400);
    }

    const db = getClient();

    const existing = await db.query({
      TableName: process.env.USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }).promise();

    if (existing.Items.length > 0) {
      return error('Uporabnik s tem e-poštnim naslovom že obstaja', 409);
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      userId,
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    await db.put({
      TableName: process.env.USERS_TABLE,
      Item: user,
    }).promise();

    const token = generateToken(userId, email.toLowerCase(), 'user');

    return success({ userId, email: user.email, name, token }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error('Registracija ni uspela');
  }
};