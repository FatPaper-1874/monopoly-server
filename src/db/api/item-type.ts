import { IsNull } from "typeorm";
import AppDataSource from "../dbConnecter";
import { ItemType } from "../entities/itemTypes";
import { Map } from "../entities/map";
import { Model } from "../entities/model";

const itemTypeRepository = AppDataSource.getRepository(ItemType);
const modelRepository = AppDataSource.getRepository(Model);
const mapRepository = AppDataSource.getRepository(Map);

export const createItemTypes = async (name: string, color: string, size: number, modelId: string, mapId: string) => {
	const model = await modelRepository.findOne({ where: { id: modelId } });
	const map = await mapRepository.findOne({ where: { id: mapId } });

	if (model) {
		const itemType = new ItemType();
		itemType.name = name;
		itemType.color = color;
		itemType.model = model;
		itemType.size = size;
		if (map) itemType.map = [map];
		return await itemTypeRepository.save(itemType);
	} else {
		throw new Error("不存在的模型Id");
	}
};

export const createEventItemTypes = async (
	name: string,
	color: string,
	size: number,
	modelId: string,
	effectCode: string
) => {
	const model = await modelRepository.findOne({ where: { id: modelId } });

	if (model) {
		const itemType = new ItemType();
		itemType.name = name;
		itemType.color = color;
		itemType.model = model;
		itemType.size = size;
		itemType.map = [];
		itemType.effectCode = effectCode;
		itemType.hasEvent = true;
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

export const updateItemType = async (
	id: string,
	name: string,
	color: string,
	size: number,
	modelId: string,
	effectCode: string = ""
) => {
	await itemTypeRepository
		.createQueryBuilder()
		.update(ItemType)
		.set({ id, name, color, size, model: { id: modelId }, effectCode })
		.where("id = :id", { id })
		.execute();
	return await itemTypeRepository.findOne({ where: { id } });
};

export const getItemTypeById = async (id: string) => {
	const itemType = await itemTypeRepository.findOne({
		relations: ["model"],
		where: { id },
	});
	if (itemType) {
		return itemType;
	} else {
		return null;
	}
};

export const getItemTypesList = async () => {
	const itemTypesList = await itemTypeRepository.find({
		select: ["id", "name", "color", "model", "size", "hasEvent"],
		relations: ["model"],
	});
	return itemTypesList;
};

export const getEventItemTypesList = async (page: number, size: number) => {
	const eventItemtypesList = await itemTypeRepository.find({
		where: { hasEvent: true },
		skip: (page - 1) * size,
		take: size,
		relations: ["model"],
	});
	const total = await itemTypeRepository.count({ where: { hasEvent: true } });
	return { eventItemtypesList, total };
};

export const getItemTypeListByMapId = async (id: string) => {
	const itemType = await itemTypeRepository.find({
		where: [{ map: { id } }, { hasEvent: true }],
		select: ["id", "name", "color", "model", "size", "hasEvent"],
		relations: ["model"],
	});
	return itemType;
};
