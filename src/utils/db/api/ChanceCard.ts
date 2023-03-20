import AppDataSource from "../dbConnecter";
import { ChanceCard } from "../entities/ChanceCard";

const chanceCardRepository = AppDataSource.getRepository(ChanceCard);

export const createChanceCard = async (name: string, describe: string, icon: string, effectCode: string) => {
	const chanceCard = new ChanceCard();
	chanceCard.name = name;
	chanceCard.describe = describe;
	chanceCard.icon = icon;
	chanceCard.effectCode = effectCode;
	await chanceCardRepository.save(chanceCard);
};

export const deleteChanceCard = async (id: string) => {
	const chanceCard = await chanceCardRepository.findOne({
		where: { id },
	});
	if (chanceCard) {
		chanceCardRepository.remove(chanceCard);
		return true;
	} else return false;
};

export const updateChanceCard = async ( newChanceCard: ChanceCard) => {
  chanceCardRepository.merge(newChanceCard);
}
 
export const getChanceCardById = async (id: string) => {
	const chanceCard = await chanceCardRepository.findOne({
		select: ["id", "name", "describe", "icon", "effectCode"],
		where: { id },
	});
	if (chanceCard) {
		return chanceCard;
	} else {
		return null;
	}
};

export const getChanceCardsList = async () => {
	const chanceCardsList = await chanceCardRepository.find();
	return chanceCardsList;
};
