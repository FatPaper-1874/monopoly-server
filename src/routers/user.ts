import { Router } from "express";
import { getUserById } from "../utils/db/api/User";
import { verToken } from "../utils/token";
import { ResInterface } from "../interfaces/res";

const routerUser = Router();

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

export default routerUser;
