import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import {
	createMap,
	getMapById,
	getTypeListByMapId,
	getMapsList,
	getMapItemListByMapId,
	deleteMap,
} from "../utils/db/api/Map";
export const routerMap = Router();

routerMap.post("/create", async (req, res, next) => {
	const { name } = req.body;
	if (name) {
		try {
			res.json({ data: await createMap(name) });
		} catch {
			const resMsg: ResInterface = {
				status: 500,
				msg: "创建地图失败",
			};
			res.json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "没有传递name",
		};
		res.json(resMsg);
	}
});

routerMap.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
				data: await deleteMap(id.toString()),
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

routerMap.get("/info", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getMapById(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/item-type", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getTypeListByMapId(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/map-item", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getMapItemListByMapId(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { mapsList, total } = await getMapsList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), mapsList },
		};
		res.json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取地图列表失败",
		};
		res.json(resMsg);
	}
});
