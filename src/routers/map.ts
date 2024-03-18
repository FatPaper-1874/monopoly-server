import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import {
	createMap,
	getMapById,
	getMapsList,
	deleteMap,
	updateIndexList,
	setBackground,
	getMapIndexsByMapId,
} from "../db/api/map";
import { getMapItemListByMapId } from "../db/api/mapItem";
import { getStreetListByMapId } from "../db/api/street";
import { getItemTypeListByMapId } from "../db/api/item-type";
import { getPropertysListByMapId } from "../db/api/property";
import { getChanceCardsListByMapId } from "../db/api/chance-card";
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

routerMap.post("/update-index-list", async (req, res, next) => {
	const { id, indexList } = req.body;
	if (id && indexList) {
		try {
			await updateIndexList(id, indexList);
			if (indexList.length == 0) {
				const resMsg: ResInterface = {
					status: 400,
					msg: "已清空地图路径",
				};
				res.json(resMsg);
			} else {
				const resMsg: ResInterface = {
					status: 200,
					msg: "更新地图路径成功",
				};
				res.json(resMsg);
			}
		} catch {
			const resMsg: ResInterface = {
				status: 500,
				msg: "更新地图路径失败",
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
			await deleteMap(id.toString());
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
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
				data: await getItemTypeListByMapId(id),
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

routerMap.get("/street", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getStreetListByMapId(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/property", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getPropertysListByMapId(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/chance-card", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getChanceCardsListByMapId(id),
			};
			res.json(resMsg);
		} catch {}
	}
});

routerMap.get("/map-indexs", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getMapIndexsByMapId(id),
			};
			res.json(resMsg);
		} catch (e: any) {
			const resMsg: ResInterface = {
				status: 500,
				data: e.message,
			};
			res.json(resMsg);
		}
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
