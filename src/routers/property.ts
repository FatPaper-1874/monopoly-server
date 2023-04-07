import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { createProperty, updateProperty } from "../utils/db/api/Property";
export const routerProperty = Router();

routerProperty.post("/create", async (req, res, next) => {
	const { name, sellCost, buildCost, cost_lv0, cost_lv1, cost_lv2, mapItemId, streetId, mapId } = req.body;
	if (name && sellCost && buildCost && cost_lv0 && cost_lv1 && cost_lv2 && mapItemId && streetId && mapId) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "创建地皮成功",
				data: await createProperty(name, sellCost, buildCost, cost_lv0, cost_lv1, cost_lv2, mapItemId, streetId, mapId),
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

routerProperty.post("/update", async (req, res, next) => {
	const { id, name, sellCost, buildCost, cost_lv0, cost_lv1, cost_lv2, streetId } = req.body;
	if (id && name && sellCost && buildCost && cost_lv0 && cost_lv1 && cost_lv2 && streetId) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "更新地皮信息成功",
				data: await updateProperty(id, name, sellCost, buildCost, cost_lv0, cost_lv1, cost_lv2, streetId),
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
