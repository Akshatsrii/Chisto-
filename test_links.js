const http = require('https');

const urls = [
  'https://food-ordering-6lji.onrender.com/api/food/list',
  'https://chisto-dcil.vercel.app/',
  'https://chisto-rider.vercel.app/'
];

urls.forEach(url => {
  http.get(url, (res) => {
    console.log(url + ' => Status: ' + res.statusCode);
  }).on('error', (e) => {
    console.log(url + ' => Error: ' + e.message);
  });
});
