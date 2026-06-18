const http = require('http');

const data = JSON.stringify({
  friends: [
    {"id":"u_1781670975079","userId":null,"name":"EFRAIN","avatarColor":"bg-violet-500","avatarUrl":"/src/assets/images/pele_avatar_1781135946987.png","avatarEmoji":null,"checkInCode":null},
    {"id":"u_test_new_friend","userId":null,"name":"NEW FRIEND","avatarColor":"bg-cyan-500","avatarUrl":null,"avatarEmoji":"👋","checkInCode":null}
  ],
  days: [],
  expenses: [{
    id: "exp_test2",
    tripDayId: "general", // This becomes null
    description: "test expense 2",
    amount: 50,
    payerId: "u_test_new_friend", // NEW FRIEND
    category: "alimentacion",
    isSettlement: false,
    notes: ""
  }],
  config: {}
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/sync',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => console.log('Status: ' + res.statusCode, '\n', resData));
});

req.on('error', err => console.log('Error:', err.message));
req.write(data);
req.end();
