import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { UserLogin } from "../utils/db/api/User";
import { setToken } from "../utils/token";

const routerLogin = Router();

routerLogin.post("/", async (req, res) => {
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

export default routerLogin;
