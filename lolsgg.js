const axios = require('axios').default;
const FormData = require('form-data');
const { ChampionStats, Summoner, LolsGgRequest } = require('./models');
const MATCH_HISTORY_URL = 'https://api.lols.gg/Api/Matches/matchHistory';
const ACCOUNT_INFO_URL = 'https://api.lols.gg/Api/Main/summonerId';

function getStatsForPage(page) {
  const matches = Object.values(page.matches);
  const summoner = new Summoner(matches[0].summoner);
  const championStats = new ChampionStats(summoner);
  championStats.processMatches(matches);
  return championStats;
}

/**
 * @param {FormData} form
 */
async function getPage(form) {
    const req = await axios.post(MATCH_HISTORY_URL, form, { headers: form.getHeaders() });
    const stats = getStatsForPage(req.data);
    return stats;
}

/**
 * @param {LolsGgRequest} lolsGgRequest
 */
async function getStats(lolsGgRequest) {
  try {
    const stats = await Promise.all(
      lolsGgRequest.toFormArray().map(async (form) => await getPage(form))
    );
    const combinedStats = stats.reduce((acc, next) => {
      acc.fold(next);
      return acc;
    });
    combinedStats.summoner = lolsGgRequest.summoner;
    return combinedStats;
  } catch (err) { console.log(err); }
}

/**
 * Obtains the summoner's summonerId and accountId (needed for the match history API)
 */
async function getAccountInfo(summonerName, region = 'NA') {
  const form = new FormData();
  form.append('summonerName', summonerName);
  form.append('region', region);
  try {
    const req = await axios.post(ACCOUNT_INFO_URL, form, { headers: form.getHeaders() });
    return req.data;
  } catch (err) { console.log (err); }
}

module.exports = {
  getStats,
  getAccountInfo
};