import CostInterface from "../Interface/CostInterface";
import MapItemInterface from "../Interface/MapItemInterface";
import Player from "./Player";
import RealEstateInterface from "../Interface/RealEstateInterface";
import { newRealEstateId } from "../utils";
import RealEstateInfoInterface from "../Interface/comm/game/RealEstateInfoInterface";
import colors from "colors";
import CommInterface from "../Interface/comm/CommInterface";
import CommTypes from "../enums/CommTypes";
import MapItemTypes from "../enums/MapItemTypes";

class RealEstate implements MapItemInterface {
	type: MapItemTypes = MapItemTypes.RealEstate;
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

	public getCostList() {
		return this.costList;
	}

	public addBuilding(): boolean {
		if (this.buildingNum < 3) {
			this.buildingNum++;
			return true;
		}
		return false;
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

	public setOwner(newOwner: Player) {
		this.owner = newOwner;
	}

	public arrivalEvent = (player: Player) => {
		if (this.owner) {
			if (this.owner == player) {
				//路过的玩家是地产主人, 则可以选择建房;
				if (this.buildingNum < 2) {
					const buildingMsg: CommInterface = {
						type: CommTypes.BuildHouse,
						msg: {
							sourceId: "server",
							targetId: player.getId(),
							data: this.id,
							extra: "你可以为你的" + this.name + "建楼",
						},
					};
					$socketServer.sendMsgToOneClientById(player.getId(), buildingMsg);
				}
			} else {
				//路过别人的地产，傍水给别人
				const eventMsgToPayer: CommInterface = {
					//通知黑仔
					type: CommTypes.RoomMsgRadio,
					msg: {
						sourceId: "server",
						targetId: player.getId(),
						data: "error",
						extra: `你到达了${this.owner.getName()}的-${this.name}-，给了他${this.haveBuildingCost[this.buildingNum]}￥`,
					},
				};
				$socketServer.sendMsgToOneClientById(player.getId(), eventMsgToPayer);

				const eventMsgToOwner: CommInterface = {
					//通知拿钱的人
					type: CommTypes.RoomMsgRadio,
					msg: {
						sourceId: "server",
						targetId: this.owner.getId(),
						data: "success",
						extra: `${player.getName()}到达了你的-${this.name}-，给了你${this.haveBuildingCost[this.buildingNum]}￥`,
					},
				};
				$socketServer.sendMsgToOneClientById(this.owner.getId(), eventMsgToOwner);

				const specialEventMsg: CommInterface = {
					//因为服务器要等待客户的回应，而踩别人格子给钱不需要回应，因此发送特殊事件（类似于踩到监狱之类的），客户端会自动回应
					//填写广播的信息
					type: CommTypes.SpecialEvent,
					msg: {
						sourceId: this.id,
						targetId: "",
						data: "warn",
						extra: "你到达了" + this.name,
					},
				};
				$socketServer.sendMsgToOneClientById(player.getId(), specialEventMsg);

				player.payToOtherPlayer(this.owner, this.haveBuildingCost[this.buildingNum]);
			}
		} else {
			const buyMsg: CommInterface = {
				type: CommTypes.BuyRealEstate,
				msg: {
					sourceId: "server",
					targetId: player.getId(),
					data: this.id,
					extra: "你可以买下" + this.name + "这块地",
				},
			};
			$socketServer.sendMsgToOneClientById(player.getId(), buyMsg);
		}
	};
}

export default RealEstate;
