import AppDataSource from "../dbConnecter";
import { ItemType } from "../entities/ItemType";
import { Map } from "../entities/Map";
import { Model } from "../entities/Model";

const itemTypeRepository = AppDataSource.getRepository(ItemType);
const modelRepository = AppDataSource.getRepository(Model);
const mapRepository = AppDataSource.getRepository(Map);

export const createItemTypes = async (name: string, color: string, size: number, modelId: string, mapId: string) => {
	const model = await modelRepository.findOne({ where: { id: modelId } });
	const map = await mapRepository.findOne({ where: { id: mapId } });

	if (model && map) {
		const itemType = new ItemType();
		itemType.name = name;
		itemType.color = color;
		itemType.model = model;
		itemType.size = size;
		itemType.map = map;
		return await itemTypeRepository.save(itemType);
	} else {
		throw new Error("不存在的模型Id");
	}
};

export const deleteItemTypes = async (id: string) => {
	const itemType = await itemTypeRepository.findOne({
		where: { id },
	});
	if (itemType) {
		itemTypeRepository.remove(itemType);
		return true;
	} else return false;
};

export const updateItemType = async (newItemType: ItemType) => {
	itemTypeRepository.merge(newItemType);
};

export const getItemTypesById = async (id: string) => {
	const itemType = await itemTypeRepository.findOne({
		select: ["id", "name", "color", "model", "size"],
		where: { id },
	});
	if (itemType) {
		return itemType;
	} else {
		return null;
	}
};

export const getItemTypessList = async () => {
	const itemTypesList = await itemTypeRepository.find();
	return itemTypesList;
};

export const getItemTypeListByMapId = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.leftJoinAndMapOne("itemType.model", Model, "model", "itemType.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	const itemType = map?.itemTypes || null;
	return itemType;
};
