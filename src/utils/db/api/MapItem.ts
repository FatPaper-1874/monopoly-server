import { ResInterface } from "../../../interfaces/res";
import AppDataSource from "../dbConnecter";
import { ItemType } from "../entities/ItemType";
import { Map } from "../entities/Map";
import { MapItem } from "../entities/MapItem";
import { Model } from "../entities/Model";
import { Property } from "../entities/Property";

const mapItemRepository = AppDataSource.getRepository(MapItem);
const mapRepository = AppDataSource.getRepository(Map);
const itemTypeRepository = AppDataSource.getRepository(ItemType);

export const createMapItem = async (_id: string, x: number, y: number, typeId: string, mapId: string) => {
	const itemType = await itemTypeRepository.findOne({ where: { id: typeId } });
	const map = await mapRepository.findOne({ where: { id: mapId } });

	if (itemType && map) {
		const mapItem = new MapItem();
		mapItem._id = _id;
		mapItem.x = x;
		mapItem.y = y;
		mapItem.type = itemType;
		mapItem.map = map;

		return await mapItemRepository.save(mapItem);
	} else {
		new Error("不存在的地图Id或类型Id");
	}
};

export const deleteMapItem = async (id: string) => {
	const mapItem = await mapItemRepository.findOne({
		where: { id },
	});
	if (mapItem) {
		mapItemRepository.remove(mapItem);
		return true;
	} else return false;
};

export const linkMapItem = async (sourceId: string, targetId: string) => {
	const targetMapItem = await mapItemRepository.findOne({ where: { id: targetId } });
	if (targetMapItem) {
		mapItemRepository
			.createQueryBuilder("mapItem")
			.update(MapItem)
			.set({ linkto: targetMapItem })
			.where("id = :id", { id: sourceId })
			.execute();
	} else {
		new Error("不存在的目标id");
	}
};

export const updateMapItem = async (newMapItem: MapItem) => {
	mapItemRepository.merge(newMapItem);
};

export const getMapItemById = async (id: string) => {
	const mapItem = await mapItemRepository.findOne({
		select: ["_id", "id", "x", "y", "type", "linkto"],
		where: { id },
	});
	if (mapItem) {
		return mapItem;
	} else {
		return null;
	}
};

export const getMapItemsList = async () => {
	const mapItemsList = await mapItemRepository.find();
	return mapItemsList;
};

export const getMapItemListByMapId = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.mapItems", "mapItem")
		.leftJoinAndMapOne("mapItem.linkto", MapItem, "mapItemInMapItem", "mapItem.linktoId = mapItemInMapItem.id")
		.leftJoinAndMapOne(
			"mapItemInMapItem.type",
			ItemType,
			"typeInMapItemLink",
			"mapItemInMapItem.typeId = typeInMapItemLink.id"
		)
		.leftJoinAndMapOne("mapItem.type", ItemType, "type", "mapItem.typeId = type.id")
		.leftJoinAndMapOne("type.model", Model, "model", "type.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	const mapItems = map?.mapItems || null;
	return mapItems;
};
