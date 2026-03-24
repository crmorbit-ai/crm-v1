const axios = require('axios');

/**
 * Post a tweet using Twitter API v2.
 */
exports.publishPost = async (account, content) => {
  if (!account?.accessToken) throw new Error('Twitter not connected');

  const response = await axios.post(
    'https://api.twitter.com/2/tweets',
    { text: content },
    { headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json' } }
  );
  return response.data; // { data: { id, text } }
};
