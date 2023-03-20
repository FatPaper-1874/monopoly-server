import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { createItemTypes } from "../utils/db/api/ItemType";

export const routerItemType = Router();

routerItemType.post("/create", async (req, res, next) => {
	const { name, color, size, modelId, mapId } = req.body;
	if (name && color && modelId && size && mapId) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await createItemTypes(name, color, size, modelId, mapId),
			};
			res.json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: e as string,
			};
			res.json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "请求的参数错误",
		};
		res.json(resMsg);
	}
});
