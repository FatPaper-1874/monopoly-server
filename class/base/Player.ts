import RealEstate from "./RealEstate";
import ChanceCard from "./ChanceCard";
import { WebSocket } from "ws";
import Icon from "../utils/Icon";

class Player {
	private name: string = "";
	private id: string = "";
	private color: string = "";
	private icon: string = "";
	private ready: boolean = false;
	private socketClient: WebSocket;
	private money: number = 0; //拥有金钱
	private ownRealEstateList: Array<RealEstate> = []; //拥有的房地产
	private ownChanceCardList: Array<ChanceCard> = []; //拥有的机会卡

	constructor(name: string, id: string, socketClient: WebSocket) {
		this.name = name;
		this.id = id;
		this.socketClient = socketClient;
		this.color = this.randomColor();
		this.icon = Icon.getRandomIcon();
	}

	public gainMoney(money: number) {
		this.money = +money;
	}

	public costMoney(money: number) {
		this.money = -money;
	}

	public gainRealEstate(realEstate: RealEstate) {
		this.ownRealEstateList.push(realEstate);
	}

	public loseRealEstate(realEstate: RealEstate) {
		const loseRealEstateIndex = this.ownRealEstateList.indexOf(realEstate);
		this.ownRealEstateList.splice(loseRealEstateIndex, 1);
	}

	public gainChanceCard(chanceCard: ChanceCard) {
		this.ownChanceCardList.push(chanceCard);
	}

	public loseChanceCard(chanceCard: ChanceCard) {
		const loseChanceCardIndex = this.ownChanceCardList.indexOf(chanceCard);
		this.ownChanceCardList.splice(loseChanceCardIndex, 1);
	}

	public getName() {
		return this.name;
	}

	public getId() {
		return this.id;
	}

	public getColor() {
		return this.color;
	}

	public getIcon(){
		return this.icon;
	}

	public isReady() {
		return this.ready;
	}

	public getMoney() {
		return this.money;
	}

	public getInfo() {
		return { name: this.getName(), id: this.getId(), color: this.getColor(), icon: this.getIcon(), ready: this.isReady() };
	}

	public getSocketClient() {
		return this.socketClient;
	}

	public getOwnRealEstateList() {
		return this.ownRealEstateList;
	}

	private randomColor() {
		return `#${Math.floor(Math.random() * 0xffffff)
			.toString(16)
			.padEnd(6, "0")}`;
	}
}

export default Player;
