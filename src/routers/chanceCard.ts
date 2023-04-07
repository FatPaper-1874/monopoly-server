import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import {
	createChanceCard,
	getChanceCardById,
	getChanceCardsList,
	deleteChanceCard,
	updateChanceCard,
	saveChanceCardInMap,
} from "../utils/db/api/ChanceCard";
export const routerChanceCard = Router();

routerChanceCard.post("/create", async (req, res, next) => {
	const { name, describe, type, icon, color, effectCode } = req.body;
	if (name && describe && type && icon && color && effectCode != undefined) {
		try {
			await createChanceCard(name, describe, type, icon, color, effectCode);
			const resMsg: ResInterface = {
				status: 200,
				msg: "机会卡创建成功",
			};
			res.json(resMsg);
		} catch {
			const resMsg: ResInterface = {
				status: 500,
				msg: "机会卡创建失败",
			};
			res.json(resMsg);
			return;
		}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "参数错误",
		};
		res.json(resMsg);
		return;
	}
});

routerChanceCard.post("/update", async (req, res, next) => {
	const { id, name, describe, type, icon, color, effectCode } = req.body;
	if (id && name && describe && type && icon && color && effectCode) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "更新机会卡信息成功",
				data: await updateChanceCard(id, name, describe, type, icon, color, effectCode),
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

routerChanceCard.get("/info", async (req, res, next) => {
	const id = req.query.id as string;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				data: await getChanceCardById(id),
			};
			res.json(resMsg);
		} catch {}
	} else {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取机会卡信息失败, 无效的id",
		};
		res.json(resMsg);
	}
});

routerChanceCard.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			await deleteChanceCard(id.toString());
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

routerChanceCard.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { chanceCardsList, total } = await getChanceCardsList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), chanceCardsList },
		};
		res.json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取机会卡列表失败",
		};
		res.json(resMsg);
	}
});

routerChanceCard.post("/bind-map", async (req, res, next) => {
	const { chanceCardIdList, mapId } = req.body;
	if (mapId) {
		try {
			await saveChanceCardInMap(chanceCardIdList, mapId);
			const resMsg: ResInterface = {
				status: 200,
				msg: "修改地图的机会卡成功",
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
