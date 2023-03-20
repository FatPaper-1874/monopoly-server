import AppDataSource from "../dbConnecter";
import { Role } from "../entities/Role";
import { Role as RoleInterface } from "../../../interfaces/bace";

export const createRole = async (rolename: string, filename: string, color: string) => {
	const roleToCreate = new Role();
	roleToCreate.rolename = rolename;
	roleToCreate.filename = filename;
	roleToCreate.color = color;
	await AppDataSource.manager.save(roleToCreate);
	return roleToCreate;
};

export const getRoleList = async () => {
	const roleList = await AppDataSource.manager.find(Role);
	return roleList.map((role): RoleInterface => ({ ...role }));
};
