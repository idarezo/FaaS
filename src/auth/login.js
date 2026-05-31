const bcrypt = require('bcryptjs');
const { getClient } = require('../utils/db');
const { generateToken } = require('../utils/auth');
const { success, error } = require('../utils/response');

module.exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return error('Email in geslo sta obvezna', 400);
    }

    const db = getClient();

    const result = await db.query({
      TableName: process.env.USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    }).promise();

    if (result.Items.length === 0) {
      return error('Napačni podatki za prijavo', 401);
    }

    const user = result.Items[0];
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return error('Napačni podatki za prijavo', 401);
    }

    const token = generateToken(user.userId, user.email, user.role);

    return success({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return error('Prijava ni uspela');
  }
};