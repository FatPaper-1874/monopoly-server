import AppDataSource from "../dbConnecter";
import {Role} from "../entities/role";
import {Role as RoleInterface} from "../../interfaces/bace";
import fs from "fs";

const roleRepository = AppDataSource.getRepository(Role);

export const createRole = async (rolename: string, filename: string, color: string) => {
    const roleToCreate = new Role();
    roleToCreate.rolename = rolename;
    roleToCreate.filename = filename;
    roleToCreate.color = color;
    await roleRepository.save(roleToCreate);
    return roleToCreate;
};

export const updateRole = async (id: string, rolename: string, color: string, filename?: string) => {
    const roleToUpdate = await roleRepository.findOne({where: {id}});
    if (roleToUpdate) {
        if(filename) {
            deleteRoleFile(roleToUpdate.filename)
            roleToUpdate.filename = filename;
        }
        roleToUpdate.rolename = rolename;
        roleToUpdate.color = color;
        await roleRepository.save(roleToUpdate);
    } else {
        throw new Error("不存在的角色")
    }
    return roleToUpdate;
};

export const deleteRole = async (id: string) => {
    const role = await roleRepository.findOne({
        where: {id},
    });
    if (role) {
        deleteRoleFile(role.filename)
        return roleRepository.remove(role);
    } else {
        throw new Error("不存在的角色");
    }
};

export const getRoleList = async (page: number, size: number) => {
    const roleList = await roleRepository.find({skip: (page - 1) * size, take: size});
    const total = await roleRepository.count();
    return {roleList, total};
};

function deleteRoleFile(fileName:string){
    fs.unlinkSync(`${process.cwd()}/public/roles/${fileName}.json`);
    fs.unlinkSync(`${process.cwd()}/public/roles/${fileName}.png`);
    fs.unlinkSync(`${process.cwd()}/public/roles/${fileName}.atlas`);
}