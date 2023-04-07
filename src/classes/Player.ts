import { SocketMessage, User } from "../interfaces/bace";
import { PlayerInfo, PlayerInterface } from "../interfaces/game";
import { ChanceCard } from "./ChanceCard";
import { Property } from "./Property";

export class Player implements PlayerInterface {
	private user: User;
	private money: number;
	private properties: Property[];
	private chanceCards: ChanceCard[];
	private positionIndex: number; //所在棋盘格子的下标
	private isStop: number; //是否停止回合

	constructor(user: User, initMoney: number, initPositionIndex: number) {
		this.user = user;
		this.money = initMoney;
		this.properties = [];
		this.chanceCards = [];
		this.positionIndex = initPositionIndex;
		this.isStop = 0;
	}

	//玩家信息相关
	public getUser = () => this.user;

	public getId = () => this.user.userId;

	public getName = () => this.user.username;

	//地产相关
	public getPropertiesList = () => this.properties;

	public setPropertiesList = (newPropertiesList: Property[]) => {
		this.properties = newPropertiesList;
	};

	public gainProperty = (property: Property) => {
		property.setOwner(this);
		this.properties.push(property);
	};

	public loseProperty = (propertyId: string) => {
		const index = this.properties.findIndex((property) => property.getId() === propertyId);
		if (index != -1) {
			this.properties.splice(index, 1);
		}
	};

	//机会卡相关
	public getCardsList = () => this.chanceCards;

	public setCardsList = (newChanceCardList: ChanceCard[]) => {
		this.chanceCards = newChanceCardList;
	};

	public gainCard = (card: ChanceCard) => {
		if (this.chanceCards.length < 4) {
			this.chanceCards.push(card);
		}
	};

	public loseCard = (cardId: string) => {
		const index = this.chanceCards.findIndex((card) => card.getId() === cardId);
		if (index != -1) {
			this.chanceCards.splice(index, 1);
		}
	};

	//钱相关
	public getMoney = () => this.money;

	public setMoney = (money: number) => {
		this.money = money;
	};

	public cost(money: number) {
		this.money -= money;
		return this.money > 0;
	}

	public gain(money: number) {
		this.money += money;
		return this.money;
	}

	//游戏相关
	public setStop = (stop: number) => {
		this.isStop = stop;
	};

	public getStop = () => {
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
			id: this.user.userId,
			user: userInfo,
			money: this.money,
			properties: this.properties.map((property) => property.getPropertyInfo()),
			chanceCards: this.chanceCards.map((card) => card.getChanceCardInfo()),
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
