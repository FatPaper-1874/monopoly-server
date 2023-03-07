import { ChanceCardInterface, ChanceCardInfo } from "../interfaces/game";
import { Player } from "./Play";
import { Property } from "./Property";

export class ChanceCard implements ChanceCardInterface {
	private id: string;
	private name: string;
	private describe: string;
	private icon: string;
	effectFunction: (sourcePlayer: Player, target: Player | Property | Player[] | Property[]) => void;

  constructor(id:string, name:string, describe:string, icon:string){

  }

	getId: () => string;
	getName: () => string;
	getDescribe: () => string;
	getIcon: () => string;

	public use(sourcePlayer: Player, target: Player | Property | Player[] | Property[]) {}

	public getChanceCardInfo(): ChanceCardInfo {
		const chanceCardInfo: ChanceCardInfo = {
			id: this.id,
			name: this.name,
			describe: this.describe,
			icon: this.icon,
		};
		return chanceCardInfo;
	}
}
