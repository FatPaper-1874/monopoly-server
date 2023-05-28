import AppDataSource from "../dbConnecter";
import { Role } from "../entities/Role";
import { Role as RoleInterface } from "../../../interfaces/bace";

const roleRepository = AppDataSource.getRepository(Role);

export const createRole = async (rolename: string, filename: string, color: string) => {
	const roleToCreate = new Role();
	roleToCreate.rolename = rolename;
	roleToCreate.filename = filename;
	roleToCreate.color = color;
	await AppDataSource.manager.save(roleToCreate);
	return roleToCreate;
};

export const getRoleList = async (page: number, size: number) => {
	const roleList = await roleRepository.find({ skip: (page - 1) * size, take: size });
	const total = await roleRepository.count();
	return { roleList, total };
};