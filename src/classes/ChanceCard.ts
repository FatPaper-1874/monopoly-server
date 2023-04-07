import { ChanceCardInterface, ChanceCardInfo } from "../interfaces/game";
import { ChanceCard as ChanceCardFromDB } from "@/utils/db/entities/ChanceCard";
import { Player } from "./Player";
import { Property } from "./Property";
import { ChanceCardType } from "@/enums/bace";
import { log } from "console";

export class ChanceCard implements ChanceCardInterface {
	private id: string;
	private name: string;
	private describe: string;
	private type: ChanceCardType;
	private color: string;
	private icon: string;
	private effectCode: string;
	private effectFunction: Function;

	constructor(chanceCard: ChanceCardFromDB) {
		this.id = chanceCard.id;
		this.name = chanceCard.name;
		this.describe = chanceCard.describe;
		this.type = chanceCard.type;
		this.color = chanceCard.color;
		this.icon = chanceCard.icon;
		this.effectCode = chanceCard.effectCode;
		this.effectFunction = new Function("sourcePlayer", "target", this.effectCode);
	}

	public getId = () => this.id;
	public getName = () => this.name;
	public getDescribe = () => this.describe;
	public getColor = () => this.color;
	public getType = () => this.type;
	public getIcon = () => this.icon;
	public getEffectCode = () => this.effectCode;

	public use(sourcePlayer: Player, target: Player | Property | Player[] | Property[] | null) {
		this.effectFunction(sourcePlayer, target);
	}

	public getChanceCardInfo(): ChanceCardInfo {
		const chanceCardInfo: ChanceCardInfo = {
			id: this.id,
			name: this.name,
			describe: this.describe,
			color: this.color,
			type: this.type,
			icon: this.icon,
		};
		return chanceCardInfo;
	}
}
