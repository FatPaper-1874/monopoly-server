import { getItemTypesFromMapItems } from "../../utils";
import AppDataSource from "../dbConnecter";
import { Map } from "../entities/map";
import { unlinkSync } from "fs";
import path from "path";
import { deleteFiles } from "../../utils/file-uploader";

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
		await mapRepository.remove(map);
		return;
	} else {
		throw new Error("无效的id");
	}
};

export const setBackground = async (mapId: string, backgroundUrl: string) => {
	const { background: oldBg } = (await mapRepository.findOne({ where: { id: mapId }, select: ["background"] })) || {
		background: "",
	};
	if (oldBg) {
		const filePathArr = oldBg.split("/");
		const fileName = filePathArr[filePathArr.length - 1 >= 0 ? filePathArr.length - 1 : 0];
		try {
			await deleteFiles([`monopoly/backgrounds/${fileName}`]);
		} catch (e: any) {
			throw new Error(`在删除原有Background时发生错误：${e.message}`);
		}
	}

	await mapRepository
		.createQueryBuilder()
		.update(Map)
		.set({ background: backgroundUrl })
		.where("id = :id", { id: mapId })
		.execute();
};

export const updateIndexList = async (id: string, indexList: string[]) => {
	mapRepository.createQueryBuilder().update(Map).set({ indexList }).where("id = :id", { id }).execute();
};

export const getMapById = async (id: string) => {
	console.time("getMapInfo");
	const map = await mapRepository.findOne({
		where: { id },
		relations: [
			"mapItems",
			"mapItems.linkto",
			"mapItems.linkto.type",
			"mapItems.linkto.property",
			"mapItems.linkto.property.street",
			"mapItems.type",
			"mapItems.type.model",
			"mapItems.arrivedEvent",
			"mapItems.property",
			"mapItems.property.street",
			"properties",
			"properties.street",
			"chanceCards",
			"streets",
		],
	});
	console.timeLog("getMapInfo");
	if (map) {
		// map.itemTypes = getItemTypesFromMapItems(map.mapItems) as any;
		console.timeEnd("getMapInfo");
		return map;
	} else {
		return null;
	}
};

export const getMapsList = async (page: number, size: number) => {
	const mapsList = await mapRepository.find({
		relations: ["mapItems", "mapItems.type", "mapItems.type.model", "chanceCards"],
		skip: (page - 1) * size,
		take: size,
	});
	mapsList.map((map) => {
		map.itemTypes = getItemTypesFromMapItems(map.mapItems) as any;
		return map;
	});
	const total = await mapRepository.count();
	return { mapsList, total };
};

export const getMapIndexsByMapId = async (id: string) => {
	const map = await mapRepository.findOne({ where: { id }, select: ["indexList"] });
	if (map) {
		return map.indexList;
	} else {
		throw new Error("地图不存在");
	}
};
