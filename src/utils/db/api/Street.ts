import AppDataSource from "../dbConnecter";
import { Street } from "../entities/Street";

const streetRepository = AppDataSource.getRepository(Street);

export const createStreet = async (name: string, increase: number) => {
	const street = new Street();
	street.name = name;
	street.increase = increase;
	await streetRepository.save(street);
};

export const deleteStreet = async (id: string) => {
	const street = await streetRepository.findOne({
		where: { id },
	});
	if (street) {
		streetRepository.remove(street);
		return true;
	} else return false;
};

export const updateStreet = async (newStreet: Street) => {
	streetRepository.merge(newStreet);
};

export const getStreetById = async (id: string) => {
	const street = await streetRepository.findOne({
		select: ["id", "name", "increase"],
		where: { id },
	});
	if (street) {
		return street;
	} else {
		return null;
	}
};

export const getStreetsList = async () => {
	const streetsList = await streetRepository.find();
	return streetsList;
};
