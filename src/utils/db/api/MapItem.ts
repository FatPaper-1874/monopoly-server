import { ResInterface } from "../../../interfaces/res";
import AppDataSource from "../dbConnecter";
import { ItemType } from "../entities/ItemType";
import { Map } from "../entities/Map";
import { MapItem } from "../entities/MapItem";
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
	console.log(id);
	
	const mapItem = await mapItemRepository.findOne({
		where: { id },
	});
	if (mapItem) {
		mapItemRepository.remove(mapItem);
		return true;
	} else return false;
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
