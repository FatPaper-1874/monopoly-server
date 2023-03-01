import AppDataSource from "../dbConnecter";
import { Role } from "../entitys/Role";
import { Role as RoleInterface } from "../../../../../monopoly-client/src/interfaces/bace";

export const RoleCreate = async (rolename: string, filename: string, color: string) => {
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
