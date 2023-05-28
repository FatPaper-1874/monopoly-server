import { Router } from "express";
import {
	UserLogin,
	UserRegister,
	createUser,
	deleteUser,
	getUserById,
	getUserList,
	updateUser,
} from "../utils/db/api/User";
import { setToken, verToken } from "../utils/token";
import { ResInterface } from "../interfaces/res";

const routerUser = Router();

routerUser.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { userList, total } = await getUserList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), userList },
		};
		res.json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取用户列表失败",
		};
		res.json(resMsg);
	}
});

routerUser.get("/info", async (req, res, next) => {
	if (req.headers.authorization) {
		try {
			//@ts-ignore
			const { userId } = verToken(req.headers.authorization);
			const user = await getUserById(userId);
			if (user) {
				const resMsg: ResInterface = {
					status: 200,
					data: user,
				};
				res.json(resMsg);
			} else {
				const resMsg: ResInterface = {
					status: 401,
					msg: "获取用户信息异常",
					data: {},
				};
				res.json(resMsg);
			}
		} catch (err: any) {
			const resMsg: ResInterface = {
				status: 401,
				msg: err.message,
				data: {},
			};
			res.json(resMsg);
		}
	}
});

routerUser.post("/create", async (req, res, next) => {
	const { username, password, avatar, color } = req.body;
	if (username && password) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "创建用户成功",
				data: await createUser(username, password, avatar, color),
			};
			res.json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "数据库请求错误",
			};
			res.json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "参数错误",
		};
		res.json(resMsg);
	}
});

routerUser.post("/update", async (req, res, next) => {
	const { id, username, avatar, color, password } = req.body;
	if (id && username && avatar && color) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "更新用户信息成功",
				data: await updateUser(id, username, avatar, color, password),
			};
			res.json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "数据库请求错误",
			};
			res.json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "参数错误",
		};
		res.json(resMsg);
	}
});

routerUser.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
				data: await deleteUser(id.toString()),
			};
			res.json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "数据库请求错误",
			};
			res.json(resMsg);
		}
	}
});

routerUser.post("/login", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const user = await UserLogin(username);
	if (user) {
		//用户存在, 且密码正确
		if (password === user.password) {
			const token = await setToken(user.username, user.id);
			const resContent: ResInterface = {
				status: 200,
				msg: "登录成功",
				data: {
					token,
				},
			};
			res.json(resContent);
		} else {
			//密码错误
			const resContent: ResInterface = {
				status: 403,
				msg: "登录失败，密码错误",
				data: {},
			};
			res.json(resContent);
		}
	} else {
		//找不到用户
		const resContent: ResInterface = {
			status: 403,
			msg: "登录失败，用户不存在",
			data: {},
		};
		res.json(resContent);
	}
});

routerUser.post("/register", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	try {
		const user = await UserRegister(username, password);
		const resContent: ResInterface = {
			status: 200,
			msg: "注册成功",
		};
		res.json(resContent);
	} catch (e: any) {
		const resContent: ResInterface = {
			status: 500,
			msg: e.message,
		};
		res.json(resContent);
	}
});

export default routerUser;
