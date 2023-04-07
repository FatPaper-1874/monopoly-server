import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { createMapItem, deleteMapItem, linkMapItem } from "../utils/db/api/MapItem";
export const routerMapItem = Router();

routerMapItem.post("/create", async (req, res, next) => {
	const { _id, x, y, typeId, mapId } = req.body;
	if (_id && x && y && typeId && mapId) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await createMapItem(_id, x, y, typeId, mapId),
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

routerMapItem.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			await deleteMapItem(id.toString());
			const resMsg: ResInterface = {
				status: 200,
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

routerMapItem.post("/link", async (req, res, next) => {
	const { sourceId, targetId } = req.body;
	if (sourceId && targetId) {
		try {
			await linkMapItem(sourceId.toString(), targetId.toString());
			const resMsg: ResInterface = {
				status: 200,
				msg: '连接MapItem成功'
			};
			res.json(resMsg);
		} catch (e: any) {
			const resMsg: ResInterface = {
				status: 500,
				msg: e.toString(),
			};
			res.json(resMsg);
		}
	}
});