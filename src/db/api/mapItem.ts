import { ResInterface } from "../../interfaces/res";
import AppDataSource from "../dbConnecter";
import { ItemType } from "../entities/itemTypes";
import { Map } from "../entities/map";
import { MapItem } from "../entities/mapItem";
import { Model } from "../entities/model";
import { Property } from "../entities/property";
import { Street } from "../entities/street";

const mapItemRepository = AppDataSource.getRepository(MapItem);
const mapRepository = AppDataSource.getRepository(Map);
const itemTypeRepository = AppDataSource.getRepository(ItemType);

export const createMapItem = async (_id: string, x: number, y: number, typeId: string, mapId: string) => {
	const itemType = await itemTypeRepository.findOne({ where: { id: typeId } });
	const map = await mapRepository.findOne({ where: { id: mapId }, relations: ["mapItems"] });

	if (itemType && map) {
		if (!map.mapItems.some((item) => item.x == x && item.y == y)) {
			const mapItem = new MapItem();
			mapItem._id = _id;
			mapItem.x = x;
			mapItem.y = y;
			mapItem.type = itemType;
			mapItem.map = map;

			return await mapItemRepository.save(mapItem);
		} else {
			throw new Error("不能在已存在MapItem的坐标放置新的MapItem");
		}
	} else {
		throw new Error("不存在的地图Id或类型Id");
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
		select: ["_id", "id", "x", "y", "type", "linkto", "property"],
		where: { id },
	});
	if (mapItem) {
		return mapItem;
	} else {
		return null;
	}
};

export const getMapItemsList = async () => {
	const mapItemsList = await mapItemRepository.find({ relations: ["property", "linkto", "type"] });
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
		.leftJoinAndMapOne(
			"mapItem.property",
			Property,
			"propertyInMapItemLink",
			"mapItem.propertyId = propertyInMapItemLink.id"
		)
		.leftJoinAndMapOne(
			"propertyInMapItemLink.street",
			Street,
			"streetInPropertyInMapItemLink",
			"propertyInMapItemLink.streetId = streetInPropertyInMapItemLink.id"
		)
		.leftJoinAndMapOne("mapItem.type", ItemType, "type", "mapItem.typeId = type.id")
		.leftJoinAndMapOne("type.model", Model, "model", "type.modelId = model.id")
		.where("map.id = :id", { id })
		.getOne();
	const mapItems = map?.mapItems || null;
	return mapItems;
};
