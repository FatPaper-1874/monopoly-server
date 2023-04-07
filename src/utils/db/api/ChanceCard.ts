import { ChanceCardType } from "@/enums/bace";
import AppDataSource from "../dbConnecter";
import { ChanceCard } from "../entities/ChanceCard";
import { Map } from "../entities/Map";

const chanceCardRepository = AppDataSource.getRepository(ChanceCard);
const mapRepository = AppDataSource.getRepository(Map);

export const createChanceCard = async (
	name: string,
	describe: string,
	type: ChanceCardType,
	icon: string,
	color: string,
	effectCode: string
) => {
	const chanceCard = new ChanceCard();
	chanceCard.name = name;
	chanceCard.describe = describe;
	chanceCard.type = type;
	chanceCard.icon = icon;
	chanceCard.color = color;
	chanceCard.effectCode = effectCode;
	await chanceCardRepository.save(chanceCard);
};

export const deleteChanceCard = async (id: string) => {
	const chanceCard = await chanceCardRepository.findOne({
		where: { id },
	});
	if (chanceCard) {
		chanceCardRepository.remove(chanceCard);
		return;
	} else {
		throw new Error("无效的id");
	}
};

export const updateChanceCard = async (
	id: string,
	name: string,
	describe: string,
	type: ChanceCardType,
	icon: string,
	color: string,
	effectCode: string
) => {
	await chanceCardRepository
		.createQueryBuilder()
		.update(ChanceCard)
		.set({ id, name, describe, type, icon, color, effectCode })
		.where("id = :id", { id })
		.execute();
	return await chanceCardRepository.createQueryBuilder().where("id = :id", { id }).getOne();
};

export const saveChanceCardInMap = async (chanceCardIdList: string[], mapId: string) => {
	const map = await mapRepository.findOne({ where: { id: mapId } });
	if (map) {
		const chanceCards = await chanceCardRepository
			.createQueryBuilder("chanceCard")
			.whereInIds(chanceCardIdList)
			.getMany();
		map.chanceCards = chanceCards;
		mapRepository.save(map);
	}
};

export const getChanceCardsListByMapId = async (id: string) => {
	const map = await mapRepository
		.createQueryBuilder("map")
		.leftJoinAndSelect("map.chanceCards", "chanceCards")
		.where("map.id = :id", { id })
		.getOne();
	const chanceCards = map?.chanceCards || null;
	return chanceCards;
};

export const getChanceCardById = async (id: string) => {
	const chanceCard = await chanceCardRepository.findOne({
		select: ["id", "name", "describe", "type", "icon", "color", "effectCode"],
		where: { id },
	});
	if (chanceCard) {
		return chanceCard;
	} else {
		return null;
	}
};

export const getChanceCardsList = async (page: number, size: number) => {
	const chanceCardsList = await chanceCardRepository.find({ skip: (page - 1) * size, take: size });
	// const total = Math.round((await chanceCardRepository.count()) / size);
	const total = await chanceCardRepository.count();
	return { chanceCardsList, total };
};