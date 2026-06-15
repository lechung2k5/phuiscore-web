const http = require('http');

http.get('http://localhost:5173/assets/bangtiso/team_home-B1nEwJKM.png', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
