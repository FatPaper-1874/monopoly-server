import CostInterface from "../Interface/CostInterface";
import MapItemInterface from "../Interface/MapItemInterface";
import Player from "./Player";
import RealEstateInterface from "../Interface/RealEstateInterface";
import { newRealEstateId } from "../utils";
import RealEstateInfoInterface from "../Interface/comm/game/RealEstateInfoInterface";
import colors from "colors";

class RealEstate implements MapItemInterface {
	private id: string;
	private name: string;
	private color: string;
	private costList: CostInterface;
	private owner: Player | undefined;
	private buildingNum: number = 0;

	constructor(info: RealEstateInterface) {
		this.id = newRealEstateId();
		this.name = info.name;
		this.costList = info.costList;
		this.color = info.color;
	}

	public arrivalEvent = (player: Player) => {
		console.info(player.getName() + "到达" + this.name);
	};

	public getMapItemInfo = () => {
		const mapItemInfo: RealEstateInfoInterface = {
			id: this.id,
			name: this.name,
			costList: this.costList,
			owner: this.owner?.getInfo(),
			buildingNum: this.buildingNum,
			color: this.color,
		};
		return mapItemInfo;
	};
}

export default RealEstate;
