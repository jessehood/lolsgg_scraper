require('dotenv');
const { json, send } = require('micro');
const lolsgg = require('./lolsgg');
const { LolsGgRequest } = require('./models');

module.exports = async (req, res) => {
  const body = await json(req);
  const { summonerId, accountId } = await lolsgg.getAccountInfo(body.username, body.region);
  const lolsGgRequest = new LolsGgRequest({ ...body, summonerId, accountId });
  const stats = await lolsgg.getStats(lolsGgRequest);
  send(res, 200, stats);
};