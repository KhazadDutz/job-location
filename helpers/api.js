const axios = require('axios');
const util = require('./util');
const crypto = require('crypto');

const { API_MAX_RETRY, API_URL, API_OUTLET_KEY, API_SECRET_KEY, OAUTH_ENDPOINT, LOCALE_CODE, LOG_GROUP } = require('../config');
const { log } = require('console');
const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} api`);
const error = require('debug')(`job ${LOG_GROUP} ${process.pid} ERROR `);

class Api {
    constructor() {
        this._access_token = null;
    }

    async getToken(renew = false) {
        return new Promise(async (resolve, reject) => {
            if (this._access_token == null || renew) {
                const timestamp = new Date(new Date().toUTCString()).valueOf();
                const authKey = `${API_OUTLET_KEY}${timestamp}${API_SECRET_KEY}`;
                const data = crypto.createHash('sha512').update(authKey, 'utf-8');
                const hash = data.digest('hex');
                const authEnpoint = `${OAUTH_ENDPOINT}/${API_OUTLET_KEY}?_fmt=json&_rt=b&grant_type=client_credentials&scope=b2b-feeds-auth`;
                const headers = {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    Authorization: `Basic ${hash}`,
                    Timestamp: timestamp,
                };
                //console.log('HASH ', hash);
                axios({
                    method: 'POST',
                    url: authEnpoint,
                    headers: headers,
                })
                    .then(res => {
                        //console.log('RESPONSE AUTH: ', res.status);
                        //debug(`TOKEN: ${res.data.access_token}`);
                        this._access_token = res.data.access_token;

                        //console.log('Bearer', this._access_token);
                        resolve(this._access_token);
                    })
                    .catch(err => {
                        error(`AUTH ERR >>> : ${err.response.status}`);
                        reject(err);
                    });
            } else {
                resolve(this._access_token);
            }
        });
    }

    //Match Stats (MA2) - card / substitute / lineUp - (Lineup__c e GameAction__c)
    async getPopulation(match_id) {
        return new Promise(async resolve => {
            const queryParams = [
                { key: 'drilldowns', value: 'Nation' },
                { key: 'measures', value: 'Population' },
            ];
            const url = 'data';
            const data = await this.fetchData('Population', url, queryParams);
            const doc_name = data.source[0].name;

            if (data) {
                return resolve({
                    data: [{ id: doc_name, ...data }],
                    url: `matchstats/${API_OUTLET_KEY}`,
                    type: 'MatchStatsMA2',
                });
            }

            resolve(null);
        });
    }

    //Match Stats (MA2) - card / substitute / lineUp - (Lineup__c e GameAction__c)
    async getMatchStatsMA2(match_id) {
        return new Promise(async resolve => {
            const queryParams = [
                { key: 'fx', value: match_id },
                { key: 'detailed', value: 'yes' },
            ];
            const data = await this.fetchData('MatchStatsMA2', `matchstats/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: [{ id: match_id, ...data }],
                    url: `matchstats/${API_OUTLET_KEY}`,
                    type: 'MatchStatsMA2',
                });
            }

            resolve(null);
        });
    }

    //Match (MA1)
    async getMatchMA1(match_id) {
        return new Promise(async resolve => {
            const queryParams = [
                { key: 'fx', value: match_id },
                { key: 'live', value: 'yes' },
            ];
            const data = await this.fetchData('MatchMA1', `match/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: [{ id: match_id, ...data }],
                    url: `match/${API_OUTLET_KEY}`,
                    type: 'MatchMA1',
                });
            }

            resolve(null);
        });
    }

    //Commentary (MA6) = (Commentary__c)
    async getCommentaryMA6(match_id) {
        return new Promise(async resolve => {
            const queryParams = [{ key: 'fx', value: match_id }];
            const data = await this.fetchData('CommentaryMA6', `commentary/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: [{ id: match_id, ...data }],
                    url: `commentary/${API_OUTLET_KEY}`,
                    type: 'CommentaryMA6',
                });
            }

            resolve(null);
        });
    }

    //Tournament Schedule (MA0) > League (Event__c)
    async getTournamentScheduleMA0(season_id) {
        return new Promise(async resolve => {
            const queryParams = [{ key: 'tmcl', value: season_id }];
            const data = await this.fetchData('TournamentScheduleMA0', `tournamentschedule/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: [{ id: season_id, tmcl: season_id, ...data }],
                    url: `tournamentschedule/${API_OUTLET_KEY}`,
                    type: 'TournamentScheduleMA0',
                });
            }

            resolve(null);
        });
    }

    //Tournament Calendars (OT2) > League (League__c)
    async getTournamentCalendarsOT2() {
        return new Promise(async resolve => {
            const queryParams = [
                { key: 'stages', value: 'yes' },
                { key: 'coverage', value: 'yes' },
            ];
            const data = await this.fetchData('TournamentCalendarsOT2', `tournamentcalendar/${API_OUTLET_KEY}/authorized`, queryParams);

            if (data) {
                return resolve({
                    data: data['competition'],
                    url: `tournamentcalendar/${API_OUTLET_KEY}`,
                    type: 'TournamentCalendarsOT2',
                });
            }

            resolve(null);
        });
    }

    //Team (TM1) > Player (Team__c)
    async getTeamTM1(season_id) {
        return new Promise(async resolve => {
            const queryParams = [
                { key: 'tmcl', value: season_id },
                { key: 'detailed', value: 'yes' },
            ];
            const data = await this.fetchData('TeamTM1', `team/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: data['contestant'],
                    url: `team/${API_OUTLET_KEY}`,
                    type: 'TeamTM1',
                });
            }

            resolve(null);
        });
    }

    //Team Standings (TM2) > Player (Standing__c)
    async getTeamStandingsTM2(season_id) {
        return new Promise(async resolve => {
            const queryParams = [{ key: 'tmcl', value: season_id }];
            const data = await this.fetchData('TeamStandingsTM2', `standings/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: [{ id: season_id, tmcl: season_id, ...data }],
                    url: `standings/${API_OUTLET_KEY}`,
                    type: 'TeamStandingsTM2',
                });
            }

            resolve(null);
        });
    }

    //Player Career (PE2) > Player (Player__c)
    async getPlayerCareerPE2(team_id) {
        return new Promise(async resolve => {
            const queryParams = [{ key: 'ctst', value: team_id }];
            const data = await this.fetchData('TeamTM1', `playercareer/${API_OUTLET_KEY}`, queryParams);

            if (data) {
                return resolve({
                    data: data['person'],
                    url: `team/${API_OUTLET_KEY}`,
                    type: 'PlayerCareerPE2',
                });
            }

            resolve(null);
        });
    }

    async fetchData(type, url = '', queryParams = [], retry = 1) {
        return new Promise(async resolve => {
            try {
                // const token = await this.getToken();
                const queryString = await this.parseQueryParams(queryParams);
                console.log(queryString, 'QUERY STRING');
                debug(`get [${type}] '${queryString}' retry (${retry})...`);
                let endPoint = `${API_URL}/${url}?${queryString}`;
                if (type === 'CommentaryMA6') {
                    endPoint = endPoint + `&_lcl=${LOCALE_CODE}`;
                }

                //stages=yes
                //console.log(`Bearer ${token}`);
                //console.log(endPoint);

                const response = await axios.get(endPoint);

                if (response.status === 200) {
                    return resolve(response.data);
                }

                return resolve(null);
            } catch (error) {
                if (error.response) {
                    //console.log('DATA', error.response.data);
                    //console.log('STATUS', error.response.status);

                    if (error.response.status == 404 /* Não encontrou dados */ || error.response.status == 403 /* Não tem permissão para ler os dados */) {
                        // debug(JSON.stringify({
                        //     type,
                        //     queryParams,
                        //     message: error.message,
                        // }));
                        return resolve(null);
                    }

                    //console.log('HEADERS', error.response.headers);
                } else if (error.request) {
                    console.log('REQUEST', error.message);
                } else {
                    error(` ERR >>> ${error.message}`);
                }

                if (API_MAX_RETRY > retry) {
                    retry = retry + 1;

                    const wait = 5000 * retry; // adiciona 5 segundos
                    debug(`process [${type}] retry ${retry} wating ${wait}ms `);
                    await util.sleep(wait);

                    if (error.response?.status == 401 || error.response?.status == 403) {
                        await this.getToken(true);
                    }

                    await this.fetchData(type, url, queryParams, retry);
                } else {
                    debug(`get [${type}] '${url}' >> Limite de ${retry} tentativas excedidas!`);
                }

                resolve(null);
            }
        });
    }

    async parseQueryParams(queryParams = []) {
        let params = '';
        //console.log('QUERY PARAMS DEFAULT', queryParams);
        queryParams.map(param => {
            params = `${params}&${param.key}=${param.value}`;
        });
        return params;
    }
}

module.exports = () => {
    const instance = new Api();

    return instance;
};
