import CostInterface from "../Interface/CostInterface";

class RealEstate {
	private id: number;
	private name: string = "";
	private costList: CostInterface;
	private ownerName: string = "";
	private buildingNum: number = 0;

	constructor(id: number, name: string, costList: CostInterface) {
		this.id = id;
		this.name = name;
		this.costList = costList;
	}
}

export default RealEstate;