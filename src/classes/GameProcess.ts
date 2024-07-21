import {ItemType, MapItem, SocketMessage, Street, User, UserInRoom} from "../interfaces/bace";
import {GameInfo, GameInitInfo, GameSetting} from "../interfaces/game";
import {ChanceCardType, SocketMsgType} from "../enums/bace";
import {ChanceCard as ChanceCardFromDB} from "../db/entities/chanceCard";
import {Room} from "./Room";
import {Player} from "./Player";
import {Property} from "./Property";
import {ChanceCard} from "./ChanceCard";
import {OperateListener} from "./OperateListener";
import {GameOverRule, OperateType} from "../enums/game";
import Dice from "./Dice";
import {getMapById} from "../db/api/map";
import winston from "winston";
import {gameLoggerFactory} from "../utils/logger";
import chalk from "chalk";
import {getRandomInteger} from "../utils";

const chalkB = chalk.bold;

export class GameProcess {
    //Setting
    private gameSetting: GameSetting;
    private isDistory: boolean;

    //Static Data
    private roomInstance: Room;
    private mapId: string;
    private mapName: string;
    private mapBackground: string;
    private propertiesList: Map<string, Property>;
    private mapItemsList: Map<string, MapItem>;
    private chanceCardsList: ChanceCardFromDB[];
    private mapIndexList: string[];
    private playersList: Player[];
    private itemTypesList: ItemType[];
    private streetsList: Street[];
    private animationStepDuration_ms: number = 600;

    //Dynamic Data
    private currentPlayerInRound: Player;
    private currentRound: number;
    private currentMultiplier: number;
    private timeoutList: any[];
    private intervalTimerList: any[];

    //Utils
    private dice: Dice;
    private logger: winston.Logger;

    constructor(setting: GameSetting, room: Room) {
        //Setting
        this.gameSetting = setting;
        this.isDistory = false;

        //Static Data
        this.mapId = setting.mapId;
        this.mapName = "";
        this.mapBackground = "";
        this.roomInstance = room;
        this.propertiesList = new Map();
        this.mapItemsList = new Map();
        this.chanceCardsList = [];
        this.mapIndexList = [];
        this.itemTypesList = [];
        this.streetsList = [];
        this.playersList = this.loadPlayer(room.getUserList());

        //Dynamic Data
        this.currentPlayerInRound = this.playersList[0];
        this.currentRound = 1;
        this.currentMultiplier = 1;
        this.timeoutList = [];
        this.intervalTimerList = [];

        //Utils
        this.dice = new Dice(setting.diceNum);
        this.logger = gameLoggerFactory(room.getRoomId());
    }

    public async start() {
        this.log(
            `${chalkB.bgYellow(" 房间: ")} ${chalkB.yellowBright(this.roomInstance.getRoomId())} ${chalkB.bgGreen(
                " 开始游戏 "
            )}`
        );

        //发送游戏开始, 让客户端进入加载页面
        this.gameBroadcast({
            type: SocketMsgType.GameStart,
            source: "server",
            data: "",
            msg: {type: "success", content: "游戏开始"},
            roomId: this.roomInstance.getRoomId(),
        });

        //加载游戏地图
        await this.loadGameMap();

        this.gameInfoBroadcast();
        this.gameInitBroadcast();

        await this.waitInitFinished();

        await this.gameLoop();
    }

    private async loadGameMap() {
        const gameMapInfo = await getMapById(this.mapId);
        if (gameMapInfo) {
            const {background, name, mapItems, indexList, properties, chanceCards, itemTypes, streets} = gameMapInfo;
            this.mapName = name;
            this.mapBackground = background;
            mapItems.forEach((item) => {
                this.mapItemsList.set(item.id, item);
            });
            this.mapIndexList = indexList;
            properties.forEach((property) => {
                this.propertiesList.set(property.id, new Property(property));
            });

            this.chanceCardsList = chanceCards;
            this.itemTypesList = itemTypes;
            this.streetsList = streets;
        }

        //发送游戏初始化完成的信息, 客户端离开加载页面, 进入游戏
        this.playersList.forEach((player) => player.setCardsList(this.getRandomChanceCard(4)));

        this.playersList.forEach((player) => {
            player.setPositionIndex(getRandomInteger(0, this.mapIndexList.length - 1));
        });
    }

    //等待全部玩家加载完成
    private async waitInitFinished() {
        const operateListener = OperateListener.getInstance();
        const promiseArr: Promise<any>[] = [];
        this.playersList.forEach(player => {
            const _p = new Promise(resolve => operateListener.once(player.getId(), OperateType.GameInitFinished, resolve));
            promiseArr.push(_p);
        })
        await Promise.all(promiseArr);
        console.log("玩家加载完成")
        this.roomInstance.roomBroadcast({type: SocketMsgType.GameInitFinished, data: "", source: "server"})
    }

    //游戏循环
    private async gameLoop() {
        while (!this.isDistory) {
            let currentPlayerIndex = 0;
            while (currentPlayerIndex < this.playersList.length) {
                const currentPlayer = this.playersList[currentPlayerIndex];
                if (currentPlayer.getIsBankrupted()) {
                    break;
                }

                if (currentPlayer.getStop() > 0) {
                    this.gameBroadcast({
                        type: SocketMsgType.MsgNotify,
                        source: "server",
                        data: "",
                        msg: {content: `${currentPlayer.getName()}睡着了,跳过回合`, type: 'info'}
                    })
                    currentPlayer.setStop(currentPlayer.getStop() - 1);
                    break;
                }
                this.currentPlayerInRound = this.playersList[currentPlayerIndex];
                this.roundTurnNotify(this.currentPlayerInRound);

                this.useChanceCardListener(this.currentPlayerInRound); //监听使用机会卡
                await this.waitRollDice(this.currentPlayerInRound); //监听投骰子
                await this.handleArriveEvent(this.currentPlayerInRound); //处理玩家到达某个格子的事件

                this.playersList.forEach((player) => {
                    if (player.getMoney() <= 0) {
                        player.setBankrupted(true);
                    }
                });

                currentPlayerIndex++;
            }
            this.nextRound();
        }
    }

    private roundTurnNotify(player: Player) {
        const msgToSend: SocketMessage = {
            type: SocketMsgType.RoundTurn,
            source: "server",
            data: "",
            msg: {
                type: "info",
                content: "现在是你的回合啦！",
            },
            roomId: this.roomInstance.getRoomId(),
        };
        this.log(`${chalkB.blue("现在是")} ${chalkB.cyanBright(player.getName())} ${chalkB.blue("的回合")}`);
        player.send(msgToSend);
    }

    private async useChanceCardListener(sourcePlayer: Player) {
        const userId = sourcePlayer.getId();
        const roundTime = this.gameSetting.roundTime;

        await new Promise(async (resolve, reject) => {
            let roundRemainingTime = roundTime;
            let isRoundEnd = false;
            let intervalTimer = setInterval(() => {
                this.roundRemainingTimeBroadcast(roundRemainingTime);
                if (roundRemainingTime > 0) {
                    roundRemainingTime--;
                } else {
                    clearInterval(intervalTimer);
                    isRoundEnd = true;
                    OperateListener.getInstance().remove(userId, OperateType.RollDice, rollDiceCallBack);
                    OperateListener.getInstance().removeAll(userId, OperateType.UseChanceCard);
                    this.log(`${chalkB.cyanBright(sourcePlayer.getName())} ${chalkB.blue("的回合超时了")}`);
                    OperateListener.getInstance().emit(userId, OperateType.RollDice); //帮玩家自动投骰子
                    resolve("TimeOut");
                }
            }, 1000);
            this.intervalTimerList.push(intervalTimer);

            function rollDiceCallBack() {
                clearInterval(intervalTimer);
                isRoundEnd = true;
                OperateListener.getInstance().removeAll(userId, OperateType.UseChanceCard); //取消监听器
                resolve("RollDice");
            }

            //摇骰子就取消监听机会卡的使用
            OperateListener.getInstance().once(userId, OperateType.RollDice, rollDiceCallBack);

            while (!isRoundEnd) {
                //监听使用机会卡事件并且处理事件
                await OperateListener.getInstance().once(userId, OperateType.UseChanceCard, (resultArr: any) => {
                    roundRemainingTime = roundTime; //重置回合剩余时间
                    const [chanceCardId, targetIdList = new Array<string>()] = resultArr;
                    const chanceCard = sourcePlayer.getCardById(chanceCardId);
                    if (chanceCard) {
                        let error = ""; //收集错误信息
                        try {
                            switch (chanceCard.getType()) {//根据机会卡的类型执行不同操作
                                case ChanceCardType.ToSelf:
                                    chanceCard.use(sourcePlayer, sourcePlayer); //直接使用
                                    break;
                                case ChanceCardType.ToOtherPlayer:
                                    const _targetPlayer = this.playersList.find((player) => player.getId() === targetIdList[0]); //获取目标玩家对象
                                    if (!_targetPlayer) {
                                        error = "目标玩家不存在";
                                        break;
                                    }
                                    chanceCard.use(sourcePlayer, _targetPlayer);
                                    break;
                                case ChanceCardType.ToProperty:
                                    const _targetProperty = this.propertiesList.get(targetIdList[0]);
                                    if (!_targetProperty) {
                                        error = "目标建筑/地皮不存在";
                                        break;
                                    }
                                    chanceCard.use(sourcePlayer, _targetProperty);
                                    break;
                                case ChanceCardType.ToMapItem:
                                    const _targetIdList = targetIdList as string[];
                                    const _targetPlayerList: Player[] = [];
                                    _targetIdList.forEach((id) => {
                                        //获取目标玩家列表
                                        const _tempPlayer = this.playersList.find((player) => player.getId() === id);
                                        if (_tempPlayer) {
                                            _targetPlayerList.push(_tempPlayer);
                                        }
                                    });
                                    if (_targetPlayerList.length === 0) {
                                        error = "选中的玩家不存在";
                                        break;
                                    }
                                    chanceCard.use(sourcePlayer, _targetPlayerList);
                                    break;
                            }
                        } catch (e: any) {
                            error = e.message
                        }
                        if (error) {
                            const errorMsg: SocketMessage = {
                                type: SocketMsgType.MsgNotify,
                                data: "",
                                source: "server",
                                msg: {
                                    type: "error",
                                    content: error,
                                },
                            };
                            this.log(
                                `${chalkB.cyanBright(sourcePlayer.getName())} ${chalkB.bgRed(" 使用机会卡: ")} ${chalkB.yellowBright(
                                    chanceCard.getName()
                                )} ${chalkB.bgRed(" 失败: ")} ${chalkB.redBright(error)}`
                            );
                            sourcePlayer.send(errorMsg);
                        } else {
                            sourcePlayer.loseCard(chanceCardId);
                            const successMsg: SocketMessage = {
                                type: SocketMsgType.MsgNotify,
                                data: "",
                                source: "server",
                                msg: {
                                    type: "success",
                                    content: `机会卡 ${chanceCard.getName()} 使用成功！`,
                                },
                            };
                            this.log(
                                `${chalkB.cyanBright(sourcePlayer.getName())} ${chalkB.bgYellow(" 使用了机会卡: ")} ${chalkB.yellowBright(
                                    chanceCard.getName()
                                )}`
                            );
                            sourcePlayer.send(successMsg);
                        }

                        this.gameInfoBroadcast();
                    } else {
                        const errorMsg: SocketMessage = {
                            type: SocketMsgType.MsgNotify,
                            data: "",
                            source: "server",
                            msg: {
                                type: "error",
                                content: "机会卡使用失败: 未知的机会卡ID",
                            },
                        };
                        sourcePlayer.send(errorMsg);
                    }
                });
            }
        });
    }

    private async waitRollDice(player: Player) {
        const userId = player.getId();
        //等待客户端点击回馈
        await OperateListener.getInstance().once(userId, OperateType.RollDice, () => {
        });
        this.gameBroadcast({
            type: SocketMsgType.RollDiceStart,
            source: "server",
            data: "",
            roomId: this.roomInstance.getRoomId(),
        });
        //摇骰子
        this.dice.roll();
        //让骰子摇一会 :P
        await this.sleep(1500);
        //发送信息
        const msgToRollDice: SocketMessage = {
            type: SocketMsgType.RollDiceResult,
            source: "server",
            data: {
                rollDiceResult: this.dice.getResultArray(),
                rollDiveCount: this.dice.getResultNumber(),
                rollDicePlayerId: this.currentPlayerInRound.getId(),
            },
            msg: {
                type: "info",
                content: `${player.getUser().username}摇到的点数是: ${this.dice.getResultArray().join("-")}`,
            },
            roomId: this.roomInstance.getRoomId(),
        };
        this.log(
            `${chalkB.cyanBright(player.getName())} ${chalkB.bgCyan(" 摇到了: ")} ${chalkB.greenBright(
                this.dice.getResultArray().join("-")
            )}`
        );
        //通知全部客户端
        this.gameBroadcast(msgToRollDice);
        //设置玩家的位置
        player.setPositionIndex((player.getPositionIndex() + this.dice.getResultNumber()) % this.mapIndexList.length);
        //更新游戏信息
        this.gameInfoBroadcast();

        //在计划的动画完成事件后取消监听, 防止客户端因特殊情况没有发送动画完成的指令造成永久等待
        const animationDuration = this.animationStepDuration_ms * (this.dice.getResultNumber() + 5);
        let animationTimer = setTimeout(() => {
            OperateListener.getInstance().emit(userId, OperateType.Animation);
        }, animationDuration);
        await OperateListener.getInstance().once(userId, OperateType.Animation, () => {
            clearTimeout(animationTimer);
        });
    }

    private async handleArriveEvent(arrivedPlayer: Player) {
        const playerPositionIndex = arrivedPlayer.getPositionIndex();
        const arriveItemId = this.mapIndexList[playerPositionIndex];
        const arriveItem = this.mapItemsList.get(arriveItemId);

        if (!arriveItem) return;
        if (arriveItem.linkto) {
            const linkMapItem = arriveItem.linkto;
            if (!linkMapItem.property) return;
            const property = this.propertiesList.get(linkMapItem.property.id);
            if (!property) return;
            const arriveProperty: SocketMessage = {
                type: SocketMsgType.BuyProperty,
                source: "server",
                data: property.getPropertyInfo(),
                msg: {
                    type: "",
                    content: "",
                },
                roomId: this.roomInstance.getRoomId(),
            };

            let roundRemainingTime = this.gameSetting.roundTime;
            let intervalTimer: any;
            const owner = property.getOwner();
            if (owner) {
                //地皮有主人
                if (owner.id === arrivedPlayer.getId()) {
                    //地产是自己的
                    if (property.getBuildingLevel() < 2) {
                        //添加定时器计算操作剩余时间
                        this.roundRemainingTimeBroadcast(roundRemainingTime);
                        intervalTimer = setInterval(() => {
                            this.roundRemainingTimeBroadcast(roundRemainingTime);
                            if (roundRemainingTime > 0) {
                                roundRemainingTime--;
                            } else {
                                OperateListener.getInstance().emit(arrivedPlayer.getId(), OperateType.BuildHouse, false);
                            }
                        }, 1000);
                        this.intervalTimerList.push(intervalTimer);
                        //已有房产, 升级房屋
                        arriveProperty.type = SocketMsgType.BuildHouse;
                        arriveProperty.msg = {
                            type: "success",
                            content: `你到达了你的${property.getName()}，可以升级房子`,
                        };
                        arrivedPlayer.send(arriveProperty);
                        const [playerRes] = await OperateListener.getInstance().once(
                            arrivedPlayer.getId(),
                            OperateType.BuildHouse,
                            () => {
                            }
                        );
                        this.roundRemainingTimeBroadcast(0);
                        clearInterval(intervalTimer);
                        if (playerRes) {
                            this.handlePlayerBuildUp(arrivedPlayer, property);
                            this.log(
                                `${chalkB.cyanBright(arrivedPlayer.getName())} ${chalkB.blue("升级了")} ${chalkB.greenBright(
                                    property.getName()
                                )} ${chalkB.blue("的房屋")}`
                            );
                        }
                    }
                } else {
                    //地产是别人的
                    const ownerPlayer = this.getPlayerById(owner.id);
                    if (!ownerPlayer) return;
                    const passCost = property.getPassCost() * this.currentMultiplier;
                    this.handlePayToSomeOne(arrivedPlayer, ownerPlayer, passCost);
                    arriveProperty.type = SocketMsgType.MsgNotify;
                    arriveProperty.msg = {
                        type: "error",
                        content: `你到达了${owner.name}的${property.getName()}，支付了${passCost}￥过路费`,
                    };
                    arrivedPlayer.send(arriveProperty);
                    arriveProperty.msg = {
                        type: "success",
                        content: `${arrivedPlayer.getName()}到达了你的${property.getName()}，支付了${passCost}￥过路费`,
                    };
                    ownerPlayer.send(arriveProperty);
                    this.log(
                        `${chalkB.cyanBright(arrivedPlayer.getName())} ${chalkB.blue("到达了")} ${chalkB.cyanBright(
                            ownerPlayer.getName()
                        )} ${chalkB.blue("的地皮")} ${chalkB.blue("支付了")} ${chalkB.red(passCost)} ${chalkB.blue("的过路费")}`
                    );
                }
            } else {
                //地皮没有主人
                //添加定时器计算操作剩余时间
                this.roundRemainingTimeBroadcast(roundRemainingTime);
                intervalTimer = setInterval(() => {
                    this.roundRemainingTimeBroadcast(roundRemainingTime);
                    if (roundRemainingTime > 0) {
                        roundRemainingTime--;
                    } else {
                        OperateListener.getInstance().emit(arrivedPlayer.getId(), OperateType.BuyProperty, false);
                    }
                }, 1000);
                this.intervalTimerList.push(intervalTimer);
                //地皮没有购买
                arriveProperty.type = SocketMsgType.BuyProperty;
                arriveProperty.msg = {
                    type: "success",
                    content: `你到达了${property.getName()}，可以买下这块地皮`,
                };
                //空地, 买房
                arrivedPlayer.send(arriveProperty);
                //等待客户端回应买房
                const [playerRes] = await OperateListener.getInstance().once(
                    arrivedPlayer.getId(),
                    OperateType.BuyProperty,
                    () => {
                    }
                );
                this.roundRemainingTimeBroadcast(0);
                clearInterval(intervalTimer);
                if (playerRes) {
                    this.handlePlayerBuyProperty(arrivedPlayer, property);
                    this.log(
                        `${chalkB.cyanBright(arrivedPlayer.getName())} ${chalkB.blue("购买了")} ${chalkB.greenBright(
                            property.getName()
                        )}`
                    );
                }
            }
        } else if (arriveItem.arrivedEvent) {
            const effectCode = arriveItem.arrivedEvent.effectCode;
            effectCode && new Function("arrivedPlayer", effectCode)(arrivedPlayer);
        }
        this.gameInfoBroadcast();
    }

    private nextRound() {
        const _this = this;
        this.currentRound++;
        const gameOverRule = this.gameSetting.gameOverRule;
        switch (gameOverRule) {
            case GameOverRule.Earn100000:
                if (this.playersList.some(player => player.getMoney() >= 100000)) gameOver();
                break;
        }

        if (this.currentRound % this.gameSetting.multiplierIncreaseRounds === 0) {
            this.currentMultiplier += this.gameSetting.multiplier;
        }

        function gameOver() {
            _this.gameBroadcast({
                type: SocketMsgType.GameOver,
                source: "server",
                data: "游戏结束",
                msg: {content: "游戏结束", type: "info"},
            });
            _this.isDistory = true;
        }
    }

    //游戏循环
    private handlePlayerBuyProperty(player: Player, property: Property) {
        const msgToSend: SocketMessage = {
            type: SocketMsgType.MsgNotify,
            source: "server",
            data: "",
            msg: {
                type: "",
                content: "",
            },
            roomId: this.roomInstance.getRoomId(),
        };
        if (player.getMoney() > property.getSellCost()) {
            if (player.cost(property.getSellCost())) {
                property.setOwner(player);
                msgToSend.msg = {type: "success", content: `购买 ${property.getName()} 成功！`};
            } else {
                msgToSend.msg = {type: "warning", content: "买完就没钱咯"};
            }
        } else {
            msgToSend.msg = {type: "error", content: "不够钱啊穷鬼"};
        }
        player.send(msgToSend);
        return;
    }

    private handlePlayerBuildUp(player: Player, property: Property) {
        const msgToSend: SocketMessage = {
            type: SocketMsgType.MsgNotify,
            source: "server",
            data: "",
            msg: {
                type: "",
                content: "",
            },
            roomId: this.roomInstance.getRoomId(),
        };
        if (player.getMoney() > property.getSellCost()) {
            if (player.cost(property.getBuildCost())) {
                property.buildUp();
                msgToSend.msg = {type: "success", content: `BuildUP ${property.getName()} 成功！`};
            } else {
                msgToSend.msg = {type: "warning", content: "升级完就没钱咯"};
            }
        } else {
            msgToSend.msg = {type: "error", content: "不够钱啊穷鬼"};
        }
        player.send(msgToSend);
        return;
    }

    private getRandomChanceCard(num: number): ChanceCard[] {
        let tempChanceCardList: ChanceCard[] = [];
        for (let i = 0; i < num; i++) {
            const getIndex = Math.floor(Math.random() * this.chanceCardsList.length);
            const card = this.chanceCardsList[getIndex];
            if (card) tempChanceCardList.push(new ChanceCard(card));
        }
        return tempChanceCardList;
    }

    private handlePayToSomeOne(source: Player, target: Player, money: number) {
        target.gain(money);
        return source.cost(money);
    }

    public distory() {
        this.isDistory = true;
        this.intervalTimerList.forEach((id) => {
            clearInterval(id);
        });
        this.timeoutList.forEach((id) => {
            clearTimeout(id);
        });
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private loadPlayer(userList: UserInRoom[]) {
        return userList.map((user) => new Player(user, this.gameSetting.initMoney, 0));
    }

    public gameInitBroadcast() {
        const gameInitInfo: GameInitInfo = {
            mapId: this.mapId,
            mapName: this.mapName,
            mapBackground: this.mapBackground,
            mapItemsList: Array.from(this.mapItemsList.values()),
            mapIndexList: this.mapIndexList,
            itemTypesList: this.itemTypesList,
            streetsList: this.streetsList,
            playerList: this.playersList.map((player) => player.getPlayerInfo()),
            properties: Array.from(this.propertiesList.values()).map((property) => property.getPropertyInfo()),
            chanceCards: this.chanceCardsList,
            currentPlayerInRound: this.currentPlayerInRound.getId(),
            currentRound: this.currentRound,
            currentMultiplier: this.currentMultiplier,
        };

        this.gameBroadcast({
            type: SocketMsgType.GameInit,
            source: "server",
            data: gameInitInfo,
            roomId: this.roomInstance.getRoomId(),
        });
    }

    public gameInfoBroadcast() {
        const gameInfo: GameInfo = {
            currentPlayerInRound: this.currentPlayerInRound.getId(),
            currentRound: this.currentRound,
            currentMultiplier: this.currentMultiplier,
            playerList: this.playersList.map((player) => player.getPlayerInfo()),
            properties: Array.from(this.propertiesList.values()).map((property) => property.getPropertyInfo()),
        };
        this.gameBroadcast({
            type: SocketMsgType.GameInfo,
            source: "server",
            data: gameInfo,
            roomId: this.roomInstance.getRoomId(),
        });
    }

    public roundRemainingTimeBroadcast = (remainingTime: number) => {
        const msg: SocketMessage = {
            type: SocketMsgType.RemainingTime,
            source: "server",
            data: remainingTime,
        };
        this.gameBroadcast(msg);
    };

    public gameBroadcast(msg: SocketMessage) {
        this.playersList.forEach((player: Player) => {
            player.send(msg);
        });
    }

    private getPlayerById(id: string) {
        return this.playersList.find((player) => player.getId() === id);
    }

    private log(message: string, level: "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly" = "info") {
        this.logger.log(level, message);
    }

    public handlePlayerDisconnect(userId: string) {
        const player = this.getPlayerById(userId);
        if (player) {
            player.setIsOffline(true);
            this.gameInfoBroadcast();
        }
    }

    public handlePlayerReconnect(user: User) {
        const player = this.playersList.find((player) => player.getUser().userId === user.userId);
        if (player) {
            player.setIsOffline(false);
            const gameInitInfo: GameInitInfo = {
                mapId: this.mapId,
                mapName: this.mapName,
                mapBackground: this.mapBackground,
                mapItemsList: Array.from(this.mapItemsList.values()),
                mapIndexList: this.mapIndexList,
                itemTypesList: this.itemTypesList,
                streetsList: this.streetsList,
                playerList: this.playersList.map((player) => player.getPlayerInfo()),
                properties: Array.from(this.propertiesList.values()).map((property) => property.getPropertyInfo()),
                chanceCards: this.chanceCardsList,
                currentPlayerInRound: this.currentPlayerInRound.getId(),
                currentRound: this.currentRound,
                currentMultiplier: this.currentMultiplier,
            };
            const reloadCommand: SocketMessage = {
                type: SocketMsgType.GameInit,
                source: "server",
                data: gameInitInfo,
                roomId: this.roomInstance.getRoomId(),
            };
            player.send(reloadCommand);
            this.gameInfoBroadcast();
        } else {
            console.log("奇怪的玩家 in game");
        }
    }

    public getPlayerIsOffline(userId: string): boolean {
        const player = this.getPlayerById(userId);
        if (player) {
            return player.getIsOffline();
        } else {
            return true;
        }
    }

    public getIsAllPlayerOffline(): boolean {
        return this.playersList.every((player) => player.getIsOffline());
    }
}
