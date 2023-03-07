import { readFileSync } from "fs";
import path from "path";
import { MapItem, SocketMessage, User } from "../interfaces/bace";
import { GameProcessSetting, GameInfo, GameInitInfo } from "../interfaces/game";
import { SocketMsgType } from "../enums/bace";
import { Room } from "./Room";
import { Player } from "./Play";
import { Property } from "./Property";
import { ChanceCard } from "./ChanceCard";
import { OperateListener } from "../utils/OperateListener";
import { OperateType } from "../enums/game";
import Dice from "./Dice";

export class GameProcess {
	//Setting
	private setting: GameProcessSetting;
	private isDistory: boolean;

	//Static Data
	private roomInstance: Room;
	private mapName: string;
	private properts: Property[];
	private chanceCards: ChanceCard[];
	private mapData: MapItem[];
	private mapIndex: string[];
	private playerList: Player[];

	//Dynamic Data
	private currentPlayerInRound: Player;
	private totalRound: number;

	//Utils
	private dice: Dice;

	constructor(setting: GameProcessSetting, room: Room) {
		//Setting
		this.setting = setting;
		this.isDistory = false;

		//Static Data
		this.mapName = setting.mapName;
		this.roomInstance = room;
		this.properts = [];
		this.chanceCards = [];
		this.mapData = [];
		this.mapIndex = [];
		this.playerList = this.loadPlayer(room.getUserList());

		//Dynamic Data
		this.currentPlayerInRound = this.playerList[0];
		this.totalRound = 0;

		//Utils
		this.dice = new Dice(setting.diceNum);
	}

	public async start() {
		//发送游戏开始, 让客户端进入加载页面
		this.gameBroadcast({
			type: SocketMsgType.GameStart,
			source: "server",
			data: "",
			msg: { type: "success", content: "游戏开始" },
			roomId: this.roomInstance.getRoomId(),
		});
		await this.loadMap(this.setting.mapName);

		//发送游戏初始化完成的信息, 客户端离开加载页面, 进入游戏
		this.gameInitBroadcast();

		await this.gameLoop();
	}

	//游戏循环
	private async gameLoop() {
		while (!this.isDistory) {
			console.log(this.currentPlayerInRound);
			this.roundTurnNotify(this.currentPlayerInRound);
			await this.waitRollDice(this.currentPlayerInRound);
			this.nextRound();
		}
	}

	private roundTurnNotify(player: Player) {
		const msgToSend: SocketMessage = {
			type: SocketMsgType.RoundTurn,
			source: "server",
			data: "",
			msg: {
				type: "success",
				content: "现在是你的回合啦！",
			},
			roomId: this.roomInstance.getRoomId(),
		};
		player.send(msgToSend);
	}

	private async waitRollDice(player: Player) {
		const userId = player.getUser().userId;
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
			data: this.dice.getResultArray(),
			msg: {
				type: "success",
				content: `${player.getUser().username}摇到的点数是: ${this.dice.getResultArray().join("-")}`,
			},
			roomId: this.roomInstance.getRoomId(),
		};
		//通知全部客户端
		this.gameBroadcast(msgToRollDice);
		//设置玩家的位置
		player.setPositionIndex((player.getPositionIndex() + this.dice.getResultNumber()) % this.mapData.length);
		//更新游戏信息
		this.gameInfoBroadcast();
	}

	private nextRound() {}

	//游戏循环

	public distory() {
		this.isDistory = true;
	}

	private sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private loadPlayer(userList: User[]) {
		return userList.map(
			(user) => new Player(user, this.setting.initMoney, Math.floor(Math.random() * this.mapIndex.length))
		);
	}

	private async loadMap(mapName: string) {
		const filePath = path.join(__dirname, `../../public/map-${mapName}.json`);
		try {
			interface MapFromFile {
				name: string;
				data: MapItem[];
				index: string[];
			}
			const tempMapData = JSON.parse(readFileSync(filePath, "utf-8")) as MapFromFile;
			const { name, data, index } = tempMapData;
			this.mapName = name;
			this.mapData = data;
			this.mapIndex = index;
		} catch {
			return;
		}
	}

	public gameInitBroadcast() {
		const gameInitInfo: GameInitInfo = {
			mapData: this.mapData,
			mapIndex: this.mapIndex,
			playerList: this.playerList.map((player) => player.getPlayerInfo()),
			properties: this.properts.map((property) => property.getPropertyInfo()),
			chanceCards: this.chanceCards.map((chanceCard) => chanceCard.getChanceCardInfo()),
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
			playerList: this.playerList.map((player) => player.getPlayerInfo()),
			properties: this.properts.map((property) => property.getPropertyInfo()),
		};
		this.gameBroadcast({
			type: SocketMsgType.GameInfo,
			source: "server",
			data: gameInfo,
			roomId: this.roomInstance.getRoomId(),
		});
	}

	public gameBroadcast(msg: SocketMessage) {
		this.playerList.forEach((player: Player) => {
			player.send(msg);
		});
	}
}
