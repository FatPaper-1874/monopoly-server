import AppDataSource from "../dbConnecter";
import { Property } from "../entities/Property";
import { Street } from "../entities/Street";
import { Map } from "../entities/Map";

const propertyRepository = AppDataSource.getRepository(Property);

export const createProperty = async (
	name: string,
	sellCost: number,
	cost_lv0: number,
	cost_lv1: number,
	cost_lv2: number,
	street: Street,
	map: Map
) => {
	const property = new Property();
	property.name = name;
	property.sellCost = sellCost;
	property.cost_lv0 = cost_lv0;
	property.cost_lv1 = cost_lv1;
	property.cost_lv2 = cost_lv2;
	property.street = street;
	property.map = map;
	await propertyRepository.save(property);
};

export const deleteProperty = async (id: string) => {
	const property = await propertyRepository.findOne({
		where: { id },
	});
	if (property) {
		propertyRepository.remove(property);
		return true;
	} else return false;
};

export const updateProperty = async (newProperty: Property) => {
	propertyRepository.merge(newProperty);
};

export const getPropertyById = async (id: string) => {
	const property = await propertyRepository.findOne({
		select: ["id", "name", "sellCost", "cost_lv0", "cost_lv1", "cost_lv2"],
		where: { id },
	});
	if (property) {
		return property;
	} else {
		return null;
	}
};

export const getPropertysList = async () => {
	const propertysList = await propertyRepository.find();
	return propertysList;
};
