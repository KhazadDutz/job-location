const hash = require('object-hash');
const util = require('../../helpers/util');
const utilNode = require('util');

const { DATA_SEASON_YEAR } = require('../../config');
const { GAMEDAY_PROCESS_INTERVAL_MATCHSTATS_MA2, GAMEDAY_PROCESS_INTERVAL_COMMENTARY_MA6, GAMEDAY_PROCESS_INTERVAL_ENDGAME, GAMEDAY_PROCESS_INTERVAL_PLAYER, PAYLOAD_IGNORE_HASH, LOG_GROUP } = require('../../config');

module.exports = {
    process: async function () {
        const db = await require('../../helpers/db')();
        const job = await require('../../helpers/job')('gameDayProcess');
        const base = await require('../extract/baseExtract')();
        const transformData = require(`../load/baseSchema`);
        const api = require('../../helpers/api')();
        const crono = await require('../../helpers/heroku')();
        const currentGames = {};

        const gameProcess = async matchId => {
            const debug = require('debug')(`job ${LOG_GROUP} ${process.pid} gameProcess ${matchId}`);
            return new Promise(async resolve => {
                const cache = {};

                let gamePromise = null;
                let keepProcess = true;

                const getApiData = async (methodName, id) => {
                    return new Promise(async resolve => {
                        const payload = await api[`${methodName}`](id, 0);
                        if (payload) {
                            //forca qq modificao para invalidar o cache ...data[0]['dd'] = new Date();

                            const currentHash = hash(payload.data);
                            //console.log(currentHash)
                            //console.log(cache[methodName]);

                            // verifica se a informacao mudou em relacao ao cache...
                            if (cache[methodName] !== currentHash) {
                                // se mudou persiste a nova informacao e armazena em memoria
                                if ((await base.saveAll(payload)) === true) {
                                    cache[methodName] = currentHash;
                                    debug(`${methodName} >> current hash: ${currentHash} id: ${id}`);
                                }

                                resolve(true); // com modificacao
                            }
                        }

                        resolve(false); //sem modificacao
                    });
                };

                const sendSFData = async (viewName, id) => {
                    return new Promise(async resolve => {
                        // busca a informacao contextualizada por temporada e partida
                        const dataView = await db[`${viewName}`].find({ season_name: DATA_SEASON_YEAR, match_id: id });

                        for (const item of dataView) {
                            // Atualizado
                            // realiza a transformacao da informacao no formato do SF
                            const itemSF = await transformData(item);

                            // posta para gravacao no SF
                            await job.postMessage(itemSF, {}, { type: 'gameDay', ignore_hash: PAYLOAD_IGNORE_HASH });
                        }

                        resolve();
                    });
                };

                const processData = async (methodName, processMap, id, waitTime = -1) => {
                    return new Promise(async resolve => {
                        debug(`${methodName} >> starting process waitTime: ${waitTime} ms / keepProcess: ${keepProcess}`);

                        do {
                            // recupera as informacoes da API
                            if (await getApiData(methodName, id)) {
                                await processMap.map(async ({ viewName }) => {
                                    // envia as informacoes no formado do Salesforce
                                    await sendSFData(viewName, id);
                                });
                            }

                            if (waitTime > -1) {
                                // efetua uma pausa no processo de forma configurave
                                await util.sleep(waitTime);
                            }
                        } while (keepProcess && waitTime > -1);

                        resolve();
                    });
                };

                const processLoadExtract = async (fileName, processMap, waitTime = -1) => {
                    return new Promise(async resolve => {
                        debug(`${fileName} >> starting processLoadExtract waitTime: ${waitTime} ms / keepProcess: ${keepProcess}`);

                        do {
                            await require(`../extract/${fileName}`).process(false);

                            for (const { fileName } of processMap) {
                                await require(`../load/${fileName}`).process(false);
                            }

                            if (waitTime > -1) {
                                // efetua uma pausa no processo de forma configurave
                                await util.sleep(waitTime);
                            }
                        } while (keepProcess && waitTime > -1);

                        resolve();
                    });
                };

                const runGame = async (match_id, runOnce = true) => {                    
                    const allProcess = [
                        processLoadExtract('playerCareerPE2', [{ fileName: 'player' }, { fileName: 'playerSeason' }, { fileName: 'playerLeague' }], runOnce ? -1 : GAMEDAY_PROCESS_INTERVAL_PLAYER),
                        
                        processData(
                            'getMatchStatsMA2',
                            [
                                { fileName: 'gameLineUp', viewName: 'vw_sf_Lineup' },
                                { fileName: 'gameActionGoal', viewName: 'vw_sf_GameAction_Goal' },
                                { fileName: 'gameActionCard', viewName: 'vw_sf_GameAction_Card' },
                                { fileName: 'gameActionSubs', viewName: 'vw_sf_GameAction_Subs' },
                                // { fileName: 'gameActionPenalty', viewName: 'vw_sf_Penalty' }, /* Penaltis agora sobem em Event */
                                { fileName: 'event', viewName: 'vw_sf_Event' },
                                { fileName: 'playerStats', viewName: 'vw_sf_PlayerStatistic' },
                                { fileName: 'eventStats', viewName: 'vw_sf_EventStatistic' },
                            ],
                            match_id,
                            runOnce ? -1 : GAMEDAY_PROCESS_INTERVAL_MATCHSTATS_MA2,
                        ),

                        processData(
                            'getCommentaryMA6',
                            [
                                { fileName: 'gameCommentary', viewName: 'vw_sf_Commentary' },
                            ],
                            match_id,
                            runOnce ? -1 : GAMEDAY_PROCESS_INTERVAL_COMMENTARY_MA6
                        ),
                    ];

                    if (!runOnce) {
                        allProcess.push(checkEndGame('checkEndGame', match_id, GAMEDAY_PROCESS_INTERVAL_ENDGAME));
                    }

                    return await Promise.all(allProcess);
                };

                const checkEndGame = async (processName, match_id, waitTime = 1000) => {
                    return new Promise(async resolve => {
                        debug(`${processName} >> starting process waitTime: ${waitTime} ms / keepProcess: ${keepProcess}`);

                        while (keepProcess) {
                            debug(`${processName} >> check`);
                            const game = await db.vw_ref_event.findOne({ match_id }, { fields: ['cgny_finished'] });

                            /* para testes */ 
                            // const game = await db.vw_ref_next_game.findOne({ match_id }, { fields: ['cgny_finished'] });

                            if (game !== null) {
                                keepProcess = !game['cgny_finished'];
                            }

                            // efetua uma pausa no processo de forma configuravel
                            if (keepProcess) {
                                await util.sleep(waitTime);
                            } else {
                                debug(`${processName} >> Partida finalizada!`);

                                /* Remove partida finalizada dos jogos atuais */
                                delete currentGames[match_id];
                            }
                        }

                        resolve();
                    });
                };

                const isProcessing = () => {
                    return utilNode.inspect(gamePromise).includes('pending');
                };

                const checkStartGame = async match_id => {
                    return new Promise(async resolve => {
                        const event = await db.vw_ref_event.findOne({ match_id });

                        if (event) {
                            const { match_id, home_team_code, away_team_code } = event;
                            debug(`partida [${home_team_code} vs ${away_team_code}] monitoramento iniciado...`);

                            await runGame(match_id, false);

                            debug(`partida [${home_team_code} vs ${away_team_code}] monitoramento encerrado!`);
                        } else {
                            debug(`sem dados da partida !!!`);

                            /* Remove partida finalizada dos jogos atuais */
                            delete currentGames[match_id];
                        }

                        resolve();
                    }).finally(async () => {
                        // processa todos os dados da partida antes de sair
                        await runGame(match_id);

                        /* Envia o turn_off caso nenhuma partida esteja ativa */
                        if (Object.keys(currentGames).length === 0) await crono.postTurnOff();
                    });
                };

                const init = async data => {
                    return new Promise(async resolve => {
                        if (data) {
                            debug(`partida ativa para iniciar...`);
                            const { match_id, cgny_finished } = data;
                            keepProcess = !cgny_finished;

                            debug(`partida => partida_finalizada: ${cgny_finished} / gamePromise: ${gamePromise} ...`);

                            if (!isProcessing() && keepProcess === true) {
                                gamePromise = checkStartGame(match_id); // inicia o processamento "infinito" ate o final da partida

                                resolve(true);
                            } else {
                                resolve(false);
                            }

                        } else {
                            debug(`sem partida ativa para iniciar!`);
                            keepProcess = false;
                            if (gamePromise) {
                                await Promise.resolve(gamePromise);
                            }
                            resolve(false);
                        }
                    });
                };

                resolve({
                    init,
                });
            });
        };

        return new Promise(async resolve => {
            const debug = require('debug')(`job ${process.pid} gameday`);

            const handler = async () => {
                return new Promise(async resolve => {
                    let nextGames = await db.vw_ref_next_game.find();
                    // console.log('1', currentGames);
    
                    /* Para testes */
                    // nextGames = [
                    //     { match_id: '4l6yd2gv3b2v3r251in8ahg5w', cgny_finished: false }, // F
                    //     { match_id: '9nwy1sh4qoqcai36v4qlpe0b8', cgny_finished: false }, // M
                    // ];
    
                    if (nextGames.length > 0) {
                        for (const data of nextGames) {
                            if (!currentGames[data.match_id]) {
                                const game = await gameProcess(data.match_id);
                                
                                if ((await game.init(data)) === true) {
                                    currentGames[data.match_id] = game;
                                }
                            }
                        }
                    } else {
                        debug(`sem partidas ativas!`);
                        for (const [key] of Object.entries(currentGames)) {
                            await currentGames[key].init();
                            delete currentGames[key];
                        }
                    }

                    // console.log('2', currentGames);
    
                    /*  Se existir um jogo ativo, o processo espera 5 minutos e depois disso o handler chama a si mesmo.
                        Isso faz com que novas partidas entrem nos jogos ativos. */
                    if (Object.keys(currentGames).length > 0) {
                        await util.sleep(5 * 60 * 1000);
                        await handler();
                    }
    
                    resolve();
                });
            };

            await handler();

            // console.log('AOOOOOOBAAAAA');
            await crono.postTurnOff();

            resolve();
        });
    },
};
