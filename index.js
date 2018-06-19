require('dotenv');
const micro = require('micro');
const lolsgg = require('./lolsgg');

module.exports = async (req, res) => {
  const pages = await lolsgg.getPages(1, 2);
  res.end('Hello!');
};