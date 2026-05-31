const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports = {
  success: (data, statusCode = 200) => ({
    statusCode,
    headers,
    body: JSON.stringify({ success: true, data }),
  }),

  error: (message, statusCode = 500) => ({
    statusCode,
    headers,
    body: JSON.stringify({ success: false, error: message }),
  }),
};