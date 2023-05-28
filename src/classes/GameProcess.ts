import { ItemType, MapItem, SocketMessage, Street, User } from "../interfaces/bace";
import { GameSetting, GameInfo, GameInitInfo, ChanceCardInfo } from "../interfaces/game";
import { ChanceCardType, SocketMsgType } from "../enums/bace";
import { Room } from "./Room";
import { Player } from "./Player";
import { Property } from "./Property";
import { ChanceCard } from "./ChanceCard";
import { OperateListener } from "../utils/OperateListener";
import { OperateType } from "../enums/game";
import Dice from "./Dice";
import { getMapById } from "../utils/db/api/Map";
import winston from "winston";
import { gameLoggerFactory } from "../utils/logger";
import chalk from "chalk";
import { getRandomInteger } from "../utils";

const chalkB = chalk.bold;

export class GameProcess {
	//Setting
	private gameSetting: GameSetting;
	private isDistory: boolean;

	//Static Data
	private roomInstance: Room;
	private mapId: string;
	private mapName: string;
	private propertiesList: Map<string, Property>;
	private mapItemsList: Map<string, MapItem>;
	private chanceCardsList: ChanceCard[];
	private mapIndexList: string[];
	private playersList: Player[];
	private itemTypesLsit: ItemType[];
	private streetsList: Street[];

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
		this.roomInstance = room;
		this.propertiesList = new Map();
		this.mapItemsList = new Map();
		this.chanceCardsList = [];
		this.mapIndexList = [];
		this.itemTypesLsit = [];
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
			msg: { type: "success", content: "游戏开始" },
			roomId: this.roomInstance.getRoomId(),
		});

		//加载游戏地图
		await this.loadGameMap();

		await this.gameLoop();
	}

	private async loadGameMap() {
		const gameMapInfo = await getMapById(this.mapId);
		if (gameMapInfo) {
			const { name, mapItems, indexList, properties, chanceCards, itemTypes, streets } = gameMapInfo;
			this.mapName = name;
			mapItems.forEach((item) => {
				this.mapItemsList.set(item.id, item);
			});
			this.mapIndexList = indexList;
			properties.forEach((property) => {
				this.propertiesList.set(property.id, new Property(property));
			});
			this.chanceCardsList = chanceCards.map((chanceCard) => new ChanceCard(chanceCard));
			this.itemTypesLsit = itemTypes;
			this.streetsList = streets;
		}

		//发送游戏初始化完成的信息, 客户端离开加载页面, 进入游戏
		this.playersList.forEach((player) => player.setCardsList(this.handleGetRadomChanceCard(4)));

		this.playersList.forEach((player) => {
			player.setPositionIndex(getRandomInteger(0, this.mapIndexList.length - 1));
		});
		this.gameInfoBroadcast();
		this.gameInitBroadcast();
	}

	//游戏循环
	private async gameLoop() {
		while (!this.isDistory) {
			let currentPlayerIndex = 0;
			while (currentPlayerIndex < this.playersList.length) {
				this.currentPlayerInRound = this.playersList[currentPlayerIndex];
				this.roundTurnNotify(this.currentPlayerInRound);

				this.waitUseChanceCardListener(this.currentPlayerInRound); //监听使用机会卡
				await this.waitRollDice(this.currentPlayerInRound); //监听投骰子
				await this.handleArriveEvent(this.currentPlayerInRound); //处理玩家到达某个格子的事件

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
				type: "message",
				content: "现在是你的回合啦！",
			},
			roomId: this.roomInstance.getRoomId(),
		};
		this.log(`${chalkB.blue("现在是")} ${chalkB.cyanBright(player.getName())} ${chalkB.blue("的回合")}`);
		player.send(msgToSend);
	}

	private async waitUseChanceCardListener(player: Player) {
		const userId = player.getId();
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
					this.log(`${chalkB.cyanBright(player.getName())} ${chalkB.blue("的回合超时了")}`);
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
			OperateListener.getInstance().on(userId, OperateType.RollDice, rollDiceCallBack);

			while (!isRoundEnd) {
				//监听使用机会卡事件并且处理事件
				await OperateListener.getInstance().on(userId, OperateType.UseChanceCard, (resultArr: any) => {
					roundRemainingTime = roundTime; //重置回合剩余时间
					const [chanceCardId, targetIdList = new Array<string>()] = resultArr;
					const chanceCard = this.chanceCardsList.find((card) => card.getId() === chanceCardId);
					if (chanceCard) {
						let error = ""; //收集错误信息
						switch (
							chanceCard.getType() //根据机会卡的类型执行不同操作
						) {
							case ChanceCardType.ToSelf:
								chanceCard.use(player, player); //直接使用
								break;
							case ChanceCardType.ToSinglePlayer:
								const _targetPlayer = this.playersList.find((player) => player.getId() === targetIdList[0]); //获取目标玩家对象
								if (!_targetPlayer) {
									error = "目标玩家不存在";
									break;
								}
								chanceCard.use(player, _targetPlayer);
								break;
							case ChanceCardType.ToMultiPlayers:
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
								chanceCard.use(player, _targetPlayerList);
								break;
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
								`${chalkB.cyanBright(player.getName())} ${chalkB.bgRed(" 使用机会卡: ")} ${chalkB.yellowBright(
									chanceCard.getName()
								)} ${chalkB.bgRed(" 失败: ")} ${chalkB.redBright(error)}`
							);
							player.send(errorMsg);
						} else {
							player.loseCard(chanceCardId);
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
								`${chalkB.cyanBright(player.getName())} ${chalkB.bgYellow(" 使用了机会卡: ")} ${chalkB.yellowBright(
									chanceCard.getName()
								)}`
							);
							player.send(successMsg);
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
						player.send(errorMsg);
					}
				});
			}
		});
	}

	private async waitRollDice(player: Player) {
		const userId = player.getId();
		//等待客户端点击回馈
		await OperateListener.getInstance().on(userId, OperateType.RollDice, () => {});
		//摇骰子
		this.dice.roll();
		//让骰子摇一会 :P
		await this.sleep(1500);
		//发送信息
		const msgToRollDice: SocketMessage = {
			type: SocketMsgType.RollDice,
			source: "server",
			data: {
				rollDiceResult: this.dice.getResultArray(),
				rollDiveCount: this.dice.getResultNumber(),
				rollDicePlayerId: this.currentPlayerInRound.getId(),
			},
			msg: {
				type: "message",
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

		await OperateListener.getInstance().on(userId, OperateType.Animation, () => {});
	}

	private async handleArriveEvent(player: Player) {
		const playerPositionIndex = player.getPositionIndex();
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
				if (owner.id === player.getId()) {
					if (property.getBuildingLevel() < 2) {
						//添加定时器计算操作剩余时间
						this.roundRemainingTimeBroadcast(roundRemainingTime);
						intervalTimer = setInterval(() => {
							this.roundRemainingTimeBroadcast(roundRemainingTime);
							if (roundRemainingTime > 0) {
								roundRemainingTime--;
							} else {
								OperateListener.getInstance().emit(player.getId(), OperateType.BuildHouse, false);
							}
						}, 1000);
						this.intervalTimerList.push(intervalTimer);
						//地产是自己的
						//已有房产, 升级房屋
						arriveProperty.type = SocketMsgType.BuildHouse;
						arriveProperty.msg = {
							type: "success",
							content: `你到达了你的${property.getName()}，可以升级房子`,
						};
						player.send(arriveProperty);
						const [playerRes] = await OperateListener.getInstance().on(
							player.getId(),
							OperateType.BuildHouse,
							() => {}
						);
						this.roundRemainingTimeBroadcast(0);
						clearInterval(intervalTimer);
						if (playerRes) {
							this.handlePlayerBuildUp(player, property);
							this.log(
								`${chalkB.cyanBright(player.getName())} ${chalkB.blue("升级了")} ${chalkB.greenBright(
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
					this.handlePayToSomeOne(player, ownerPlayer, passCost);
					arriveProperty.type = SocketMsgType.MsgNotify;
					arriveProperty.msg = {
						type: "error",
						content: `你到达了${owner.name}的${property.getName()}，支付了${passCost}￥过路费`,
					};
					player.send(arriveProperty);
					arriveProperty.msg = {
						type: "success",
						content: `${player.getName()}到达了你的${property.getName()}，支付了${passCost}￥过路费`,
					};
					ownerPlayer.send(arriveProperty);
					this.log(
						`${chalkB.cyanBright(player.getName())} ${chalkB.blue("到达了")} ${chalkB.cyanBright(
							ownerPlayer.getName()
						)} ${chalkB.blue("的地皮")} ${chalkB.blue("支付了")} ${chalkB.red(passCost)} ${chalkB.blue("的过路费")}`
					);
				}
			} else {
				//地皮没有主人
				if (property.getBuildingLevel() === 0) {
					//添加定时器计算操作剩余时间
					this.roundRemainingTimeBroadcast(roundRemainingTime);
					intervalTimer = setInterval(() => {
						this.roundRemainingTimeBroadcast(roundRemainingTime);
						if (roundRemainingTime > 0) {
							roundRemainingTime--;
						} else {
							OperateListener.getInstance().emit(player.getId(), OperateType.BuyProperty, false);
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
					player.send(arriveProperty);
					//等待客户端回应买房
					const [playerRes] = await OperateListener.getInstance().on(player.getId(), OperateType.BuyProperty, () => {});
					this.roundRemainingTimeBroadcast(0);
					clearInterval(intervalTimer);
					if (playerRes) {
						this.handlePlayerBuyProperty(player, property);
						this.log(
							`${chalkB.cyanBright(player.getName())} ${chalkB.blue("购买了")} ${chalkB.greenBright(
								property.getName()
							)}`
						);
					}
				}
			}
		} else {
			return;
		}
		this.gameInfoBroadcast();
	}

	private nextRound() {
		this.currentRound++;
		if (this.currentRound % this.gameSetting.multiplierIncreaseRounds === 0) {
			this.currentMultiplier += this.gameSetting.multiplier;
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
				msgToSend.msg = { type: "success", content: `购买 ${property.getName()} 成功！` };
			} else {
				msgToSend.msg = { type: "warning", content: "买完就没钱咯" };
			}
		} else {
			msgToSend.msg = { type: "error", content: "不够钱啊穷鬼" };
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
				msgToSend.msg = { type: "success", content: `BuildUP ${property.getName()} 成功！` };
			} else {
				msgToSend.msg = { type: "warning", content: "升级完就没钱咯" };
			}
		} else {
			msgToSend.msg = { type: "error", content: "不够钱啊穷鬼" };
		}
		player.send(msgToSend);
		return;
	}

	private handleGetRadomChanceCard(num: number): ChanceCard[] {
		let tempChanceCardList: ChanceCard[] = [];
		for (let i = 0; i < num; i++) {
			const getIndex = Math.floor(Math.random() * this.chanceCardsList.length);
			tempChanceCardList.push(this.chanceCardsList[getIndex]);
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

	private loadPlayer(userList: User[]) {
		return userList.map((user) => new Player(user, this.gameSetting.initMoney, 0));
	}

	public gameInitBroadcast() {
		const gameInitInfo: GameInitInfo = {
			mapId: this.mapId,
			mapName: this.mapName,
			mapItemsList: Array.from(this.mapItemsList.values()),
			mapIndexList: this.mapIndexList,
			itemTypesList: this.itemTypesLsit,
			streetsList: this.streetsList,
			playerList: this.playersList.map((player) => player.getPlayerInfo()),
			properties: Array.from(this.propertiesList.values()).map((property) => property.getPropertyInfo()),
			chanceCards: this.chanceCardsList.map((chanceCard) => chanceCard.getChanceCardInfo()),
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
}
