/**
 * Test Mailinator public API (no key needed for public inboxes)
 */
const axios = require('axios');

(async () => {
  const inbox = 'sdet_s4b_1779431027002';
  const domain = 'testinator.com';

  try {
    // List messages
    const listRes = await axios.get(`https://www.mailinator.com/api/v2/domains/${domain}/inboxes/${inbox}`, {
      headers: { 'Accept': 'application/json' }
    });
    console.log('Inbox response:', JSON.stringify(listRes.data, null, 2));

    const msgs = listRes.data?.msgs || [];
    if (msgs.length > 0) {
      const msgId = msgs[0].id;
      console.log('\nFetching message:', msgId);
      const msgRes = await axios.get(`https://www.mailinator.com/api/v2/domains/${domain}/inboxes/${inbox}/messages/${msgId}`, {
        headers: { 'Accept': 'application/json' }
      });
      console.log('Message:', JSON.stringify(msgRes.data, null, 2).substring(0, 2000));
    }
  } catch (e) {
    console.log('Error:', e.response?.status, e.response?.data || e.message);
  }
})();
