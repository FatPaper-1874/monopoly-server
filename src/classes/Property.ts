import { PropertyInfo, PropertyInterface } from "../interfaces/game";
export class Property implements PropertyInterface {
	private id: string;
	private name: string;
	private buildingLevel: number;
	private sellCost: number;
	private cost_lv0: number;
	private cost_lv1: number;
	private cost_lv2: number;
	private owner: { id: string; name: string };

	public getId = () => this.id;
	public getName = () => this.name;
	public getBuildingLevel = () => this.buildingLevel;
	public getSellCost = () => this.sellCost;
	public getCost_lv0 = () => this.cost_lv0;
	public getCost_lv1 = () => this.cost_lv1;
	public getCost_lv2 = () => this.cost_lv2;
	public getOwner = () => this.owner;

	public getPropertyInfo(): PropertyInfo {
		const propertyInfo: PropertyInfo = {
			id: this.id,
			name: this.name,
			buildingLevel: this.buildingLevel,
			sellCost: this.sellCost,
			cost_lv0: this.cost_lv0,
			cost_lv1: this.cost_lv1,
			cost_lv2: this.cost_lv2,
			owner: this.owner,
		};
		return propertyInfo;
	}
}
