import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { getRoleList } from "../utils/db/api/Role";

export const routerRole = Router();

routerRole.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { roleList, total } = await getRoleList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), roleList },
		};
		res.json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取游戏角色列表失败",
		};
		res.json(resMsg);
	}
});
