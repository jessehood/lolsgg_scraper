require('dotenv');
const { json, send } = require('micro');
const lolsgg = require('./lolsgg');
const { LolsGgRequest, Summoner } = require('./models');

module.exports = async (req, res) => {
  const body = await json(req);
  const { summonerId, accountId } = await lolsgg.getAccountInfo(body.summonerName, body.region);
  const summoner = new Summoner({ summonerId, accountId, summonerName: body.summonerName, region: body.region });
  const lolsGgRequest = new LolsGgRequest({ ...body, summoner });
  const stats = await lolsgg.getStats(lolsGgRequest);
  send(res, 200, stats);
};