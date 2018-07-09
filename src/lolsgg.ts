import axios from 'axios';
import * as FormData from 'form-data';
import { ChampionStats, Summoner, LolsGgRequest, Match, ChampionStat } from './models';

interface Page {
  status: boolean; //status of HTTP request
  matches: {
    [matchId: string]: Match;
  };
}

interface AccountInfo {
  status: boolean;
  region: string;
  summonerName: string;
  summonerId: number;
  accountId: number;
  summonerLevel: number;
  profileIcon: number;
}

export class LolsGGScraper {
  private static  MATCH_HISTORY_URL = 'https://api.lols.gg/Api/Matches/matchHistory';
  private static ACCOUNT_INFO_URL = 'https://api.lols.gg/Api/Main/summonerId';

  /**
   * Obtains the summoner's summonerId and accountId (needed for the match history API)
   */
  static async getAccountInfo(summonerName: string, region = 'NA'): Promise<AccountInfo> {
    const form = new FormData();
    form.append('summonerName', summonerName);
    form.append('region', region);
    const req = await axios.post<AccountInfo>(this.ACCOUNT_INFO_URL, form, { headers: form.getHeaders() });
    return req.data;
  }

  static getStatsForPage(page: Page): ChampionStats|undefined {
    // If the page isn't available, return an empty page
    if (!page || !page.status) return undefined;
  
    const matches = Object.values(page.matches);
    const summoner = new Summoner(matches[0].summoner);
    const championStats = new ChampionStats(summoner);
    championStats.processMatches(matches);
    return championStats;
  }

  static async getPage(form: FormData): Promise<ChampionStats|undefined> {
    const req = await axios.post(this.MATCH_HISTORY_URL, form, { headers: form.getHeaders() });
    const stats = this.getStatsForPage(req.data);
    return stats;
  }

  static async getStats(lolsGgRequest: LolsGgRequest): Promise<{ summoner: Summoner, stats: ChampionStat[] }|undefined> {
    const requests = lolsGgRequest.toFormArray().map(async (form) => await this.getPage(form));
    const stats = await Promise.all(requests);
    if (!stats || !stats.length) throw 'No pages';

    const combinedStats = stats.reduce((acc, next) => {
      if (acc && next) {
        acc.fold(next);
      }
      return acc;
    });

    if (!combinedStats) throw 'No stats';

    return {
      summoner: lolsGgRequest.summoner,
      stats: Object.values(combinedStats.stats)
    };
  }
}