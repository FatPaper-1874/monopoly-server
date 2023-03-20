import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { deleteModel, getModelList } from "../utils/db/api/Model";

const routerModel = Router();

routerModel.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { modelList, total } = await getModelList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), modelList },
		};
		res.json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取模型列表失败",
		};
		res.json(resMsg);
	}
});

routerModel.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
				data: await deleteModel(id.toString()),
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

export default routerModel;
