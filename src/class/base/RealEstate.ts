import CostInterface from "../Interface/CostInterface";
import MapItemInterface from "../Interface/MapItemInterface";
import Player from "./Player";
import RealEstateInterface from "../Interface/RealEstateInterface";
import { newRealEstateId } from "../utils";
import RealEstateInfoInterface from "../Interface/comm/game/RealEstateInfoInterface";
import colors from "colors";
import CommInterface from "../Interface/comm/CommInterface";
import CommTypes from "../enums/CommTypes";

class RealEstate implements MapItemInterface {
	private id: string;
	private name: string;
	private color: string;
	private costList: CostInterface;
	private owner: Player | undefined;
	private buildingNum: number = 0;
	private haveBuildingCost: number[];

	constructor(info: RealEstateInterface) {
		this.id = newRealEstateId();
		this.name = info.name;
		this.costList = info.costList;
		this.color = info.color;
		this.haveBuildingCost = [this.costList.pass, this.costList.oneHouse, this.costList.towHouse, this.costList.villa];
	}

	public getName() {
		return this.name;
	}

	public getCostList(){
		return this.costList;
	}

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

	public setOwner(newOwner: Player){
		this.owner = newOwner;
	}

	public arrivalEvent = (player: Player) => {
		const eventMsg: CommInterface = {
			type: CommTypes.RoomMsgRadio,
			msg: {
				sourceId: "server",
				targetId: player.getId(),
				data: "warn",
				extra: "你到达了" + this.name,
			},
		};
		$socketServer.sendMsgToOneClientById(player.getId(), eventMsg);
		if (this.owner) {
			if (this.owner == player) {
				//路过的玩家是地产主人, 则可以选择建房;
				if (this.buildingNum < 2) {
					const buildingMsg: CommInterface = {
						type: CommTypes.RoomMsgRadio,
						msg: {
							sourceId: "server",
							targetId: player.getId(),
							data: this.id,
							extra: "你可以为你的"+ this.name +"建楼",
						},
					};
				}
			} else {
				//路过别人的地产，傍水给别人
				player.payToOtherPlayer(this.owner, this.haveBuildingCost[this.buildingNum]);
			}
		} else {
			const buyMsg: CommInterface = {
				type: CommTypes.BuyRealEstate,
				msg: {
					sourceId: "server",
					targetId: player.getId(),
					data: this.id,
					extra: "你可以买下"+ this.name +"这块地",
				},
			};
			$socketServer.sendMsgToOneClientById(player.getId(), buyMsg);
		}
	};
}

export default RealEstate;
