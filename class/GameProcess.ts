import Dice from "./base/Dice";
import Player from "./base/Player";
import RealEstate from "./base/RealEstate";
import { GameOverRule } from "./enums/GameRules";
import MapInterface from "./Interface/MapInterface";
import EnPingMap from "../maps/EnPingMap";
import CommInterface from "./Interface/comm/CommInterface";
import CommTypes from "./enums/CommTypes";
import GameFrameInterface from './Interface/comm/game/GameFrameInterface';

export default class GameProcess {
	private roomId: string;
	private currentRound: number = 0; //当前回合
	private currentPlayerIndex: number = 0; //当前玩家回合
	private initEveryPlayerMoney: number = 0; //玩家初始金钱
	private gameOverRule: number = GameOverRule.OnePlayerGoBroke; //游戏结束条件(默认一位玩家破产)
	private dice: Dice;
	private playerList: Array<Player> = [];
	private map: MapInterface;

	constructor(roomId: string, playerList: Array<Player>, initEveryPlayerMoney: number, gameOverRule: GameOverRule, diceNum: number) {
		this.roomId = roomId;
		this.playerList = playerList;
		this.initEveryPlayerMoney = initEveryPlayerMoney;
		this.gameOverRule = gameOverRule;
		this.map = new EnPingMap();

		this.dice = new Dice(diceNum); //实例化骰子

		this.giveEveryPlayerMoney(initEveryPlayerMoney); //初始化金钱

		this.gameFrameRadio();	//第一次游戏帧广播
	}

	startGameGameThread() {
		// while(1){
		// }
	}

	gameFrameRadio() {
		const playerList = this.playerList; //获取当前房间的玩家列表
		const gameInfo:GameFrameInterface = {
			playerInfoList: this.playerList.map(player => player.getInfo()),
			mapInfo: this.map.getMapInfo(),
		}
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
			player.getSocketClient().send(JSON.stringify(gameFrameMsg));
		});
	}

	//给所有玩家pang钱
	giveEveryPlayerMoney(money: number) {
		this.playerList.forEach((item) => {
			item.gainMoney(money);
		});
	}
}
