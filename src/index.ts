require('dotenv');
import { json, send } from 'micro';
import { LolsGGScraper } from './lolsgg';
import { LolsGgRequest, Summoner } from './models';
import { IncomingMessage, ServerResponse } from 'http';

export interface ILolsGGRequest {
  summonerName: string;
  lang: string;
  startPage: number;
  endPage: number;
  region: string;
}

export default async function index(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const invalidAccountResponse = () => send(res, 404, 'Invalid Account');

  try {
    const body = (await json(req) as ILolsGGRequest | undefined);
    if (!body || !body.summonerName) {
      return invalidAccountResponse();
    }

    const { summonerId, accountId } = await LolsGGScraper.getAccountInfo(body.summonerName, body.region);
    const summoner = new Summoner({ summonerId, accountId, summonerName: body.summonerName, region: body.region });
    const lolsGgRequest = new LolsGgRequest(body, summoner);
    const stats = await LolsGGScraper.getStats(lolsGgRequest);
    return send(res, 200, stats);
  } catch (err) { console.log(err); }
};
