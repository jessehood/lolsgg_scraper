const FormData = require('form-data');
class Summoner {
  constructor(summonerId = '', username = '') {
    this.summonerId = summonerId;
    this.username = username;
  }
}

class ChampionStat {
  constructor(champion = '') {
    this.champion = champion;
    this.allyVictories = 0;
    this.allyDefeats = 0;
    this.enemyVictories = 0;
    this.enemyDefeats = 0;
  }
}

class ChampionStats {

  constructor(summoner) {
    /** @type {Summoner} */
    this.summoner = summoner;
    this.stats = {};
  }

  processTeammate(teammate, isAllied, isVictory) {
    const champion = teammate.championName;

    if (typeof this.stats[champion] === 'undefined') {
      this.stats[champion] = new ChampionStat(champion);
    }

    if (isAllied && isVictory) {
      this.stats[champion].allyVictories++;
    } 

    else if (isAllied && !isVictory) {
      this.stats[champion].allyDefeats++;
    } 

    else if (!isAllied && isVictory) {
      this.stats[champion].enemyVictories++;
    } 
    
    else if (!isAllied && !isVictory) {
      this.stats[champion].enemyDefeats++;
    }
  }

  processTeam(team, isVictory) {
    const isAllied = (typeof team[this.summoner.summonerId] !== 'undefined');

    Object.values(team).forEach(teammate => {
      if (teammate.summonerId === this.summoner.summonerId) return; // don't process the requested summoner's champion
      this.processTeammate(teammate, isAllied, isVictory)
    });
  }

  processMatch(match) {
    const isVictory = match.matchStatus === 'win';
    this.processTeam(match.team1.summoners, isVictory);
    this.processTeam(match.team2.summoners, isVictory);
  }

  processMatches(matches = []) {
    matches.forEach(match => this.processMatch(match));
  }

  /**
   * combines the given championStats with the current stats
   * @param {ChampionStats} championStats
   */
  fold(championStats) {
    const otherStats = championStats.stats;
    Object.entries(otherStats).forEach(([champion, stat]) => {
      if (typeof this.stats[champion] === 'undefined') {
        this.stats[champion] = stat;
      } else {
        this.stats[champion].allyVictories += stat.allyVictories;
        this.stats[champion].allyDefeats += stat.allyDefeats;
        this.stats[champion].enemyVictories += stat.enemyVictories;
        this.stats[champion].enemyDefeats += stat.enemyDefeats;
      }
    });
  }
}

class LolsGgRequest {
  constructor(opts) {
    console.log(opts);
    this.accountId = opts.accountId;
    this.lang = opts.lang;
    this.startPage = opts.startPage;
    this.endPage = opts.endPage || opts.startPage;
    this.region = opts.region;
    this.summonerId = opts.summonerId;
  }

  toForm(pageNumber) {
    const form = new FormData();
    form.append('accountId', this.accountId);
    form.append('lang', this.lang);
    form.append('page', pageNumber);
    form.append('region', this.region);
    form.append('summonerId', this.summonerId);
    return form;

  }

  toFormArray() {
    const forms = [];
    for (let i = this.startPage; i <= this.endPage; i++) {
      forms.push(this.toForm(i));
    }
    return forms;
  }
}

module.exports = {
  Summoner,
  ChampionStats,
  LolsGgRequest,
};