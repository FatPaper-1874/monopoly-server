import { User } from "../entities/User";
import AppDataSource from "../dbConnecter";
import { randomColor } from "../../index";

const userRepository = AppDataSource.getRepository(User);

export const createUser = async (username: string, password: string, avatar?: string, color?: string) => {
	const userToCreate = new User();
	userToCreate.username = username;
	userToCreate.password = password;
	userToCreate.avatar = avatar || "user";
	userToCreate.color = color || randomColor();
	await AppDataSource.manager.save(userToCreate);
	return userToCreate;
};

export const updateUser = async (id: string, username: string, avatar: string, color: string, password?: string) => {
	try {
		if (password) {
			await userRepository
				.createQueryBuilder()
				.update(User)
				.set({ username, avatar, color, password })
				.where("id = :id", { id })
				.execute();
		} else {
			await userRepository
				.createQueryBuilder()
				.update(User)
				.set({ username, avatar, color })
				.where("id = :id", { id })
				.execute();
		}
	} catch (e: any) {}
	return userRepository.createQueryBuilder().where("id = :id", { id }).getOne();
};

export const deleteUser = async (id: string) => {
	const user = await userRepository.findOne({
		where: { id },
	});
	if (user) {
		return userRepository.remove(user);
	} else {
		null;
	}
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

export const UserRegister = async (username: string, password: string) => {
	const user = await AppDataSource.manager.findOneBy(User, { username });
	if (user) {
		throw Error("用户名已存在");
	} else {
		const newUser = await createUser(username, password);
		return newUser;
	}
};

export const getUserList = async (page: number, size: number) => {
	const userList = await userRepository.find({
		skip: (page - 1) * size,
		take: size,
		select: ["id", "username", "avatar", "color"],
	});
	// const total = Math.round((await userRepository.count()) / size);
	const total = await userRepository.count();
	return { userList, total };
};
