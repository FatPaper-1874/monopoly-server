import AppDataSource from "../dbConnecter";
import { Map } from "../entities/Map";
import { Model } from "../entities/Model";
import { ItemType } from "../entities/ItemType";
import { Street } from "../entities/Street";
import { MapItem } from "../entities/MapItem";
import { Property } from "../entities/Property";

const mapRepository = AppDataSource.getRepository(Map);

export const createMap = async (name: string) => {
	const map = new Map();
	map.name = name;
	map.indexList = [];
	return await mapRepository.save(map);
};

export const deleteMap = async (id: string) => {
	const map = await mapRepository.findOne({
		where: { id },
	});
	if (map) {
		mapRepository.remove(map);
		return;
	} else {
		throw new Error("无效的id");
	}
};

export const updateIndexList = async (id: string, indexList: string[]) => {
	mapRepository.createQueryBuilder().update(Map).set({ indexList }).where("id = :id", { id }).execute();
};

export const getMapById = async (id: string) => {
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
			"mapItemInMapItem.property",
			Property,
			"propertyInMapItemLink",
			"mapItemInMapItem.propertyId = propertyInMapItemLink.id"
		)
		.leftJoinAndMapOne(
			"propertyInMapItemLink.street",
			Street,
			"streetInPropertyInMapItemLink",
			"propertyInMapItemLink.streetId = streetInPropertyInMapItemLink.id"
		)
		.leftJoinAndMapOne("mapItem.type", ItemType, "typeInMapItem", "mapItem.typeId = typeInMapItem.id")
		.leftJoinAndMapOne("typeInMapItem.model", Model, "modelInMapItem", "typeInMapItem.modelId = modelInMapItem.id")
		.leftJoinAndMapOne("mapItem.property", Property, "propertyInMapItem", "mapItem.propertyId = propertyInMapItem.id")
		.leftJoinAndMapOne(
			"propertyInMapItem.street",
			Street,
			"streetInPropertyInMapItem",
			"propertyInMapItem.streetId = streetInPropertyInMapItem.id"
		)
		.leftJoinAndSelect("map.properties", "property")
		.leftJoinAndMapOne("property.street", Street, "streetInProperty", "property.streetId = streetInProperty.id")
		.leftJoinAndSelect("map.chanceCards", "chanceCard")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.leftJoinAndMapOne("itemType.model", Model, "model", "itemType.modelId = model.id")
		.leftJoinAndSelect("map.streets", "street")
		.where("map.id = :id", { id })
		.getOne();
	if (map) {
		return map;
	} else {
		return null;
	}
};

export const getMapsList = async (page: number, size: number) => {
	const mapsList = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.mapItems", "mapItem")
		.leftJoinAndMapOne("mapItem.type", ItemType, "typeInMapItem", "mapItem.typeId = typeInMapItem.id")
		.leftJoinAndMapOne("typeInMapItem.model", Model, "modelInMapItem", "typeInMapItem.modelId = modelInMapItem.id")
		.leftJoinAndSelect("map.itemTypes", "itemType")
		.leftJoinAndMapOne("itemType.model", Model, "model", "itemType.modelId = model.id")
		.leftJoinAndSelect("map.chanceCards", "chanceCard")
		.skip((page - 1) * size)
		.take(size)
		.getMany();
	const total = await mapRepository.count();
	return { mapsList, total };
};
