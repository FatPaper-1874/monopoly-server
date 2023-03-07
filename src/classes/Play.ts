import { SocketMsgType } from "../enums/bace";
import { MapItem, SocketMessage, User } from "../interfaces/bace";
import {
	ChanceCardInterface,
	PlayerInfo,
	PlayerInterface,
	PropertyInterface,
	UserInfoClient,
} from "../interfaces/game";
import { ChanceCard } from "./ChanceCard";
import { Property } from "./Property";

export class Player implements PlayerInterface {
	private user: User;
	private money: number;
	private properties: Property[];
	private chanceCards: ChanceCard[];
	private positionIndex: number; //所在棋盘格子的下标
	private isStop: boolean; //是否停止回合

	constructor(user: User, initMoney: number, initPositionIndex: number) {
		this.user = user;
		this.money = initMoney;
		this.properties = [];
		this.chanceCards = [];
		this.positionIndex = initPositionIndex;
		this.isStop = false;
	}

	public getUser = () => this.user;
	public getMoney = () => this.money;
	public getProperties = () => this.properties;
	public getCards = () => this.chanceCards;

	public setStop = (stop: boolean) => {
		this.isStop = stop;
	};

	public getIsStop = () => {
		return this.isStop;
	};

	public setPositionIndex = (newIndex: number) => {
		this.positionIndex = newIndex;
	};

	public getPositionIndex = () => {
		return this.positionIndex;
	};

	public getPlayerInfo(): PlayerInfo {
		const { socketClient, ...userInfo } = this.user;
		const playerInfo: PlayerInfo = {
			user: userInfo,
			money: this.money,
			properties: this.properties.map((property) => property.getPropertyInfo()),
			cards: this.chanceCards.map((card) => card.getChanceCardInfo()),
			positionIndex: this.positionIndex,
			isStop: this.isStop,
		};
		return playerInfo;
	}

	/**
	 * 向指定客户端发送信息
	 * @param type 发送的信息类型
	 * @param data 发送的信息本体
	 * @param msg 可以使客户端触发message组件的信息
	 * @param roomId 房间Id
	 */
	public send(msgToSend: SocketMessage) {
		this.user.socketClient.send(JSON.stringify(msgToSend));
	}
}
