const axios = require('axios').default;
const url = 'https://api.lols.gg/Api/Matches/matchHistory';
const FormData = require('form-data');
const { ChampionStats, Summoner } = require('./models');

function buildFormData(page) {
  var form = new FormData();
  form.append('accountId', '243554303'); // summoner name: TSM Zven
  form.append('lang', 'en');
  form.append('page', page);
  form.append('region', 'NA');
  form.append('summonerId', '91419120');
  return form;
}

function getStats(page) {
  const matches = Object.values(page.matches);
  const summoner = new Summoner(matches[0].summoner.summonerId, matches[0].summoner.summonerName);
  const championStats = new ChampionStats(summoner);
  championStats.processMatches(matches);
  return championStats;
}

async function getPage(page) {
    const form = buildFormData(page);
    const req = await axios.post(url, form, { headers: form.getHeaders() });
    const stats = getStats(req.data);
    return stats;
}

async function getPages(startPage, endPage) {
  try {
    var pageRange = Array(endPage).fill(startPage).map((x,y) => x + y);
    var pages = await Promise.all(pageRange.map(page => getPage(page)));
    var stats = pages.reduce((acc, next) => {
      acc.fold(next);
      return acc;
    });
    return stats;
  } catch (err) { console.log(err); }
}

module.exports = {
  getPage,
  getPages
}