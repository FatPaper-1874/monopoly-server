import AppDataSource from "../dbConnecter";
import { Model } from "../entities/Model";

const modelRepository = AppDataSource.getRepository(Model);

export const createModel = async (name: string, fileName: string) => {
	const model = new Model();
	model.name = name;
	model.fileName = fileName;
	console.log(model);
	await modelRepository.save(model);
};

export const deleteModel = async (id: string) => {
	const model = await modelRepository.findOne({
		where: { id },
	});
	if (model) {
		return modelRepository.remove(model);
	} else {
		null;
	}
};

export const updateModel = async (newModel: Model) => {
	modelRepository.merge(newModel);
};

export const getModelById = async (id: string) => {
	const model = await modelRepository.findOne({
		select: ["id", "name", "fileName"],
		where: { id },
	});
	if (model) {
		return model;
	} else {
		return null;
	}
};

export const getModelList = async (page: number, size: number) => {
	const modelList = await modelRepository.find({ skip: (page - 1) * size, take: size });
	// const total = Math.round((await modelRepository.count()) / size);
	const total = await modelRepository.count();
	return { modelList, total };
};
