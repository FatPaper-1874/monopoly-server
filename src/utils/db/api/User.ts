import { User } from "../entities/User";
import AppDataSource from "../dbConnecter";
import { randomColor } from "../../index";

export const createUser = async (username: string, password: string, avatar?: string) => {
	const userToCreate = new User();
	userToCreate.username = username;
	userToCreate.password = password;
	userToCreate.avatar = avatar || "user";
	userToCreate.color = randomColor();
	await AppDataSource.manager.save(userToCreate);
	return userToCreate;
};

export const getUserById = async (userId: string) => {
	const user = await AppDataSource.manager.findOne(User, {
		select: ["id", "username", "avatar", "color"],
		where: { id: userId },
	});
	if (user) {
		return user;
	} else {
		return null;
	}
};

export const UserLogin = async (username: string) => {
	const user = await AppDataSource.manager.findOneBy(User, { username });
	if (user) {
		return user;
	} else {
		return null;
	}
};
