import { Router } from "express";
import { getUserById } from "../utils/db/api/User";
import { verToken } from "../utils/token";
import { ResInterface } from "../interfaces/res";

const routerUser = Router();

routerUser.get("/info", async (req, res, next) => {
	if (req.headers.authorization) {
		//@ts-ignore
		const { userId } = await verToken(req.headers.authorization);
		const user = await getUserById(userId);
		if (user) {
			const resMsg: ResInterface = {
				status: 200,
				data: user,
			};
			res.json(resMsg);
		} else {
			const resMsg: ResInterface = {
				status: 403,
				msg: "获取用户信息异常",
				data: {},
			};
			res.json(resMsg);
		}
	}
});

export default routerUser;
