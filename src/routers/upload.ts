import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createModel } from "../utils/db/api/Model";
import { ResInterface } from "../interfaces/res";

const upload = multer({ dest: "public/models" });
const routerUpload = Router();

routerUpload.post("/model", upload.single("model"), async (req, res, next) => {
	// console.log(req.file);
	if (req.file?.originalname) {
		const fileType = path.parse(req.file?.originalname).ext;
		if (!fileType) {
			const resMsg: ResInterface = {
				status: 500,
				msg: "文件后缀名不合法",
			};
			res.json(resMsg);
			return;
		}
		const oldName = req.file.path;
		const newName = oldName + fileType;
		fs.renameSync(oldName, newName);

		if (req.body.name) {
			const modelName = req.body.name;
			try {
				await createModel(modelName, req.file.filename + fileType);
			} catch {
				const resMsg: ResInterface = {
					status: 500,
					msg: "数据创建失败",
				};
				res.json(resMsg);
				return;
			}
			const resMsg: ResInterface = {
				status: 200,
				msg: "模型创建成功",
			};
			res.json(resMsg);
		} else {
			const resMsg: ResInterface = {
				status: 500,
				msg: "没有模型文件名",
			};
			res.json(resMsg);
			return;
		}
	}
});

export default routerUpload;