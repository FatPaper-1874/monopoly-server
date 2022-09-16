import PlayerInfoInterface from "../Interface/comm/game/PlayerInfoInterface";
import Icon from "../utils/Icon";
import ChanceCard from "./ChanceCard";
import RealEstate from "./RealEstate";

class Player {
	private name: string = "";
	private id: string = "";
	private color: string = "";
	private icon: string = "";
	private ready: boolean = false;
	private stop: boolean = false;

	private money: number = 0; //拥有金钱
	private currentGrid: number = 0;
	private ownRealEstateList: Array<string> = []; //拥有的房地产名称
	private ownChanceCardList: Array<ChanceCard> = []; //拥有的机会卡

	constructor(name: string, id: string) {
		this.name = name;
		this.id = id;
		this.color = this.randomColor();
		this.icon = Icon.getRandomIcon();
	}

	public gainMoney(money: number) {
		this.money += money;
	}

	public costMoney(money: number): boolean {
		if (this.money < money) {
			return false;
		}
		this.money -= money;
		return true;
	}

	public gainRealEstate(realEstate: RealEstate) {
		this.ownRealEstateList.push(realEstate.getName());
	}

	public loseRealEstate(realEstate: RealEstate) {
		const loseRealEstateIndex = this.ownRealEstateList.indexOf(realEstate.getName());
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

	public getIcon() {
		return this.icon;
	}

	public isReady() {
		return this.ready;
	}

	public getMoney() {
		return this.money;
	}

	public walk(step: number) {
		this.currentGrid = (this.currentGrid + step) % 42;
	}

	public getCurrentGrid() {
		return this.currentGrid;
	}

	public isStop() {
		return this.stop;
	}

	public setReady(isReady: boolean) {
		this.ready = isReady;
	}

	public setStop(isStop: boolean) {
		this.stop = isStop;
	}

	public payToOtherPlayer(targetPlayer: Player, money: number) {
		this.costMoney(money);
		targetPlayer.gainMoney(money);
	}

	public getInfo(): PlayerInfoInterface {
		return { name: this.getName(), id: this.getId(), color: this.getColor(), icon: this.getIcon(), ready: this.isReady(), money: this.getMoney(), currentGrid: this.getCurrentGrid(), stop: this.isStop(), ownRealEstate: this.ownRealEstateList };
	}

	public getOwnRealEstateList() {
		return this.ownRealEstateList;
	}

	private randomColor() {
		const H = Math.random();
		const S = Math.random();
		const L = 0.5;
		let ret = [H, S, L];
		ret[1] = 0.6 + ret[1] * 0.2; // [0.7 - 0.9] 排除过灰颜色

		// 数据转化到小数点后两位
		ret = ret.map(function (item) {
			return parseFloat(item.toFixed(2));
		});
		console.log(ret);

		let R, G, B;

		const hue2rgb = function hue2rgb(p: any, q: any, t: any) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		let Q = L < 0.5 ? L * (1 + S) : L + S - L * S;
		let P = 2 * L - Q;
		R = hue2rgb(P, Q, H + 1 / 3) * 255;
		G = hue2rgb(P, Q, H) * 255;
		B = hue2rgb(P, Q, H - 1 / 3) * 255;

		console.log(`rgb(${R}, ${G}, ${B})`);
		return `rgb(${R}, ${G}, ${B})`;
	}
}

export default Player;
