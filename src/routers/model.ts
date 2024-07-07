import { Router } from "express";
import { ResInterface } from "../interfaces/res";
import { createModel, deleteModel, getModelList } from "../db/api/model";
import multer from "multer";
import path from "path";
import { uploadFile } from "../utils/COS-uploader";

const routerModel = Router();
const modelUploaderMulter = multer({ dest: "public/models" });

routerModel.get("/list", async (req, res, next) => {
	const { page = 1, size = 8 } = req.query;
	try {
		const { modelList, total } = await getModelList(parseInt(page.toString()), parseInt(size.toString()));
		const resMsg: ResInterface = {
			status: 200,
			data: { total, current: parseInt(page.toString()), modelList },
		};
		res.status(resMsg.status).json(resMsg);
	} catch {
		const resMsg: ResInterface = {
			status: 500,
			msg: "获取模型列表失败",
		};
		res.status(resMsg.status).json(resMsg);
	}
});

routerModel.delete("/delete", async (req, res, next) => {
	const { id } = req.query;
	if (id) {
		try {
			await deleteModel(id.toString());
			const resMsg: ResInterface = {
				status: 200,
				msg: "删除成功",
				data: "",
			};
			res.status(resMsg.status).json(resMsg);
		} catch (e) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "数据库请求错误",
			};
			res.status(resMsg.status).json(resMsg);
		}
	}
});

routerModel.post("/create", modelUploaderMulter.single("model"), async (req, res, next) => {
	// console.log(req.file);
	if (req.file?.originalname) {
		const fileType = path.parse(req.file?.originalname).ext;
		if (!fileType) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "文件后缀名不合法",
			};
			res.status(resMsg.status).json(resMsg);
			return;
		}
		const filePath = req.file.path;
		const fileName = req.file.filename + fileType;
		const fileUrl = await uploadFile({ filePath, targetPath: "monopoly/models/", name: fileName });

		if (req.body.name) {
			const modelName = req.body.name;
			try {
				await createModel(modelName, fileUrl, fileName);
			} catch(e: any) {
				const resMsg: ResInterface = {
					status: 500,
					msg: e.message,
				};
				res.status(resMsg.status).json(resMsg);
				return;
			}
			const resMsg: ResInterface = {
				status: 200,
				msg: "模型创建成功",
			};
			res.status(resMsg.status).json(resMsg);
		} else {
			const resMsg: ResInterface = {
				status: 500,
				msg: "没有模型文件名",
			};
			res.status(resMsg.status).json(resMsg);
			return;
		}
	}
});

export default routerModel;
