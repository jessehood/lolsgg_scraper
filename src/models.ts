import * as FormData from 'form-data';
import { ILolsGGRequest } from '.';

interface Teammate {
  summonerId: number;
  summonerName: string;
  championKey: string;
  championName: string;
  team: string;
}

interface Team {
  [summonerId: string]: Teammate;
}

export interface Match {
  gameId: number;
  gameLength: number;
  startTime: number;
  ago: string;
  timestamp: number;
  gameType: string;
  matchTime: string;
  mapName: string;
  mapId: number;
  team1: { summoners: Team };
  team2: { summoners: Team };
  matchStatus: string;
  matchStatusText: string;
  summoner: Summoner;
}

export class Summoner {
  public summonerId: number;
  public accountId: number;
  public summonerName: string;
  public region: string;

  constructor(opts: Summoner) {
    this.summonerId = opts.summonerId;
    this.accountId = opts.accountId;
    this.summonerName = opts.summonerName;
    this.region = opts.region;
  }
}

export class ChampionStat {
  constructor(
    public champion: string,
    public allyVictories = 0,
    public allyDefeats = 0,
    public enemyVictories = 0,
    public enemyDefeats = 0) {
  }
}

export class ChampionStats {
  public stats: { 
    [champion: string]: ChampionStat; 
  } = {};
  
  constructor(public summoner: Summoner) {}

  processTeammate(teammate: Teammate, isAllied: boolean, isVictory: boolean) {
    const champion: string = teammate.championName;

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

  processTeam(team: Team, isVictory: boolean): void {
    const isAllied = (typeof team[this.summoner.summonerId] !== 'undefined');

    Object.values(team).forEach(teammate => {
      if (teammate.summonerId === this.summoner.summonerId) return; // don't process the requested summoner's champion
      this.processTeammate(teammate, isAllied, isVictory)
    });
  }

  processMatch(match: Match): void {
    const isVictory = match.matchStatus === 'win';
    this.processTeam(match.team1.summoners, isVictory);
    this.processTeam(match.team2.summoners, isVictory);
  }

  processMatches(matches: Match[] = []): void {
    matches.forEach(this.processMatch);
  }

  /**
   * combines the given championStats with the current stats
   */
  fold(championStats: ChampionStats): void {
    if (!championStats) return;

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

export class LolsGgRequest{
  public summoner: Summoner;
  public lang?: string;
  public startPage?: number;
  public endPage?: number;
  public region?: string;

  constructor(req: ILolsGGRequest, summoner: Summoner) {
    this.summoner = summoner;
    this.lang = req.lang;
    this.startPage = req.startPage;
    this.endPage = req.endPage || req.startPage;
    this.region = req.region;
  }

  toForm(pageNumber: number): FormData {
    const form = new FormData();
    form.append('accountId', this.summoner.accountId);
    form.append('lang', this.lang);
    form.append('page', pageNumber);
    form.append('region', this.region);
    form.append('summonerId', this.summoner.summonerId);
    return form;

  }

  toFormArray(): FormData[] {
    const forms: FormData[] = [];
    if (!this.startPage || !this.endPage) return forms;

    for (let i = this.startPage; i <= this.endPage; i++) {
      forms.push(this.toForm(i));
    }
    return forms;
  }
}