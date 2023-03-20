import AppDataSource from "../dbConnecter";
import { Map } from "../entities/Map";
import { Model } from "../entities/Model";
import { ItemType } from "../entities/ItemType";

const mapRepository = AppDataSource.getRepository(Map);

export const createMap = async (name: string) => {
	const map = new Map();
	map.name = name;
	return await mapRepository.save(map);
};

export const deleteMap = async (id: string) => {
	const map = await mapRepository.findOne({
		where: { id },
	});
	if (map) {
		mapRepository.remove(map);
		return true;
	} else return false;
};

export const updateMap = async (newMap: Map) => {
	mapRepository.merge(newMap);
};

export const getMapById = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.mapItems", "mapItem")
		.leftJoinAndMapOne("mapItem.type", ItemType, "typeInMapItem", "mapItem.typeId = typeInMapItem.id")
		.leftJoinAndMapOne("typeInMapItem.model", Model, "modelInMapItem", "typeInMapItem.modelId = modelInMapItem.id")
		.leftJoinAndSelect("map.properties", "property")
		.leftJoinAndSelect("map.chanceCards", "chanceCard")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.leftJoinAndMapOne("itemType.model", Model, "model", "itemType.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	if (map) {
		return map;
	} else {
		return null;
	}
};

export const getTypeListByMapId = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.leftJoinAndMapOne("itemType.model", Model, "model", "itemType.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	const itemType = map?.itemTypes || null;
	return itemType;
};

export const getMapItemListByMapId = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.mapItems", "mapItem")
		.leftJoinAndMapOne("mapItem.type", ItemType, "type", "mapItem.typeId = type.id")
		.leftJoinAndMapOne("type.model", Model, "model", "type.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	const mapItems = map?.mapItems || null;
	return mapItems;
};

export const getMapsList = async (page: number, size: number) => {
	const mapsList = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.mapItems", "mapItem")
		.leftJoinAndSelect("map.properties", "property")
		.leftJoinAndSelect("map.chanceCards", "chanceCard")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.skip((page - 1) * size)
		.take(size)
		.getMany();
	const total = await mapRepository.count();
	return { mapsList, total };
};
