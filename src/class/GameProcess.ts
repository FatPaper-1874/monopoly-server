import Dice from "./base/Dice";
import Player from "./base/Player";
import RealEstate from "./base/RealEstate";
import { GameOverRule } from "./enums/GameRules";
import MapInterface from "./Interface/MapInterface";
import EnPingMap from "../maps/EnPingMap";
import CommInterface from "./Interface/comm/CommInterface";
import CommTypes from "./enums/CommTypes";
import GameFrameInterface from "./Interface/comm/game/GameFrameInterface";
import EventResultTypes from './enums/EventResultTypes';

export default class GameProcess {
	private roomId: string;
	private currentRound: number = 1; //当前回合计数
	private currentPlayerIndex: number = 0; //当前玩家回合
	private initEveryPlayerMoney: number = 0; //玩家初始金钱
	private gameOverRule: number = GameOverRule.OnePlayerGoBroke; //游戏结束条件(默认一位玩家破产)
	private dice: Dice;
	private playerList: Array<Player> = [];
	private map: MapInterface;

	constructor(roomId: string, playerList: Array<Player>, initEveryPlayerMoney: number, gameOverRule: GameOverRule, diceNum: number) {
		this.roomId = roomId; //当前房间id
		this.playerList = playerList; //当前房间玩家列表
		this.initEveryPlayerMoney = initEveryPlayerMoney; //初始金钱
		this.gameOverRule = gameOverRule;
		this.map = new EnPingMap(); //设置地图

		this.dice = new Dice(diceNum); //实例化骰子

		this.giveEveryPlayerMoney(initEveryPlayerMoney); //初始化金钱

		this.gameFrameRadio(); //第一次游戏帧广播

		this.startGameGameThread();
	}

	private async startGameGameThread() {
		while (1) {
			const currentPlayer = this.playerList[this.currentPlayerIndex];
			const waitingRollDice = new Promise<void>((resolve, rejects) => {
				console.info("等待" + this.getCurrentRoundPlayerId().green + "摇骰子");
				const roundNotice: CommInterface = { type: CommTypes.RoomMsgRadio, msg: { sourceId: "server", targetId: "", data: "warn", extra: "到你的回合啦 :)" } };
				$socketServer.sendMsgToOneClientById(currentPlayer.getId(), roundNotice);	//提醒回合到了
				$evenListen.once(`${currentPlayer.getId()}-rollDice`, () => {
					this.dice.roll(); //摇骰子
					currentPlayer.walk(this.dice.getResultNumber());
					console.info(currentPlayer.getId().green + " 摇到了: " + this.dice.getResultArray() + "--" + this.dice.getResultNumber());
					const replyMsg: CommInterface = {
						type: CommTypes.RollDice,
						msg: {
							sourceId: "server",
							targetId: currentPlayer.getId(),
							data: JSON.stringify(this.dice.getResultArray()),
							extra: this.dice.getResultNumber() + "",
						},
					};
					this.gameMsgRadio(replyMsg);
					setTimeout(() => {
						this.handleArrivalEvent(currentPlayer);
						this.gameFrameRadio();
						resolve();
					}, 1200); //假装延迟给前端扭骰子动画时间
				});
			});

			const waitingHandleArrivalEvent = new Promise<void>((resolve, rejects) => {
				$evenListen.once(`${this.getCurrentRoundPlayerId()}-arrivalEvent`, (result: EventResultTypes) => {
					//收到客户端的交易结果
					if(result === EventResultTypes.Agree){
						this.handleBuyRealEstate(currentPlayer);
						const roundNotice: CommInterface = { type: CommTypes.RoomMsgRadio, msg: { sourceId: "server", targetId: "", data: "success", extra: "购买成功 ;)" } };
						$socketServer.sendMsgToOneClientById(currentPlayer.getId(), roundNotice);	//提醒回合到了
					}
					resolve();
				});
			});

			// const waitingUseCard = new Promise<void>((resolve, rejects) => {
			// 	console.info("promise1");
			// 	$evenListen.once(`${this.getCurrentRoundPlayerId()}-useCard`, () => {
			// 		resolve();
			// 	});
			// });

			// await Promise.all([waitingRollDice, waitingHandleArrivalEvent, waitingUseCard]).then();
			await Promise.all([waitingRollDice, waitingHandleArrivalEvent]).then(() => {
				const roundNotice: CommInterface = { type: CommTypes.RoundEnd, msg: { sourceId: "server", targetId: "", data: "warn", extra: "你的回合结束辣 :)" } };	//所有promise结束, 回合结束
				$socketServer.sendMsgToOneClientById(currentPlayer.getId(), roundNotice);
				this.nextRound();
				this.gameFrameRadio();
			});
		}
	}

	nextRound() {
		this.currentRound++;
		this.currentPlayerIndex++;
		if (this.currentPlayerIndex == this.playerList.length) this.currentPlayerIndex = 0;
	}

	gameMsgRadio(msg: CommInterface) {
		const playerList = this.playerList; //获取当前房间的玩家列表
		playerList.forEach((player) => {
			$socketServer.sendMsgToOneClientById(player.getId(), msg);
		});
	}

	gameFrameRadio() {
		const playerList = this.playerList; //获取当前房间的玩家列表
		const gameInfo: GameFrameInterface = {
			gameInfo: { currentRound: this.currentRound, currentRoundPlayerId: this.getCurrentRoundPlayerId() },
			playerInfoList: this.playerList.map((player) => player.getInfo()),
			mapInfo: this.map.getMapInfo(),
		};
		const gameFrameMsg: CommInterface = {
			//填写广播的信息
			type: CommTypes.GameFrame,
			msg: {
				sourceId: this.roomId,
				targetId: "",
				data: JSON.stringify(gameInfo),
				extra: "",
			},
		};
		playerList.forEach((player) => {
			$socketServer.sendMsgToOneClientById(player.getId(), gameFrameMsg);
		});
	}

	getCurrentRoundPlayerId() {
		return this.playerList[this.currentPlayerIndex].getId();
	}

	//给所有玩家pang钱
	giveEveryPlayerMoney(money: number) {
		this.playerList.forEach((player) => {
			player.gainMoney(money);
		});
	}

	handleArrivalEvent(player: Player) {
		this.map.mapItemList[player.getCurrentGrid()].arrivalEvent(player);
	}

	handleBuyRealEstate(player: Player){
		const realEstate:RealEstate =  this.map.mapItemList[player.getCurrentGrid()] as RealEstate;
		player.costMoney(realEstate.getCostList().buy);
		realEstate.setOwner(player);
		player.gainRealEstate(realEstate);
	}
}
