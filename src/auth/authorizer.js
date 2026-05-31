const { verifyToken } = require('../utils/auth');

const generatePolicy = (principalId, effect, resource, context = {}) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      },
    ],
  },
  context,
});

module.exports.handler = async (event) => {
  try {
    const authHeader = event.authorizationToken || event.headers?.Authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return generatePolicy('unauthorized', 'Deny', event.methodArn);
    }

    const decoded = verifyToken(token);

    return generatePolicy(decoded.userId, 'Allow', event.methodArn, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    });
  } catch (err) {
    console.error('Authorizer error:', err.message);
    return generatePolicy('unauthorized', 'Deny', event.methodArn);
  }
};