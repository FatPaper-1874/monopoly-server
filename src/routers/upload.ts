import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createModel } from "../utils/db/api/Model";
import { ResInterface } from "../interfaces/res";
import { createRole } from "../utils/db/api/Role";

const modelUploaderMulter = multer({ dest: "public/models" });
const roleUploaderMulter = multer({ dest: "public/roles" });
const routerUpload = Router();

routerUpload.post("/model", modelUploaderMulter.single("model"), async (req, res, next) => {
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
					msg: "模型创建失败",
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

routerUpload.post("/role", roleUploaderMulter.single("role"), async (req, res, next) => {
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
			const rolelName = req.body.name;
			const roleColor = req.body.color;
			try {
				await createRole(rolelName, req.file.filename + fileType, roleColor);
			} catch {
				const resMsg: ResInterface = {
					status: 500,
					msg: "角色创建失败",
				};
				res.json(resMsg);
				return;
			}
			const resMsg: ResInterface = {
				status: 200,
				msg: "角色创建成功",
			};
			res.json(resMsg);
		} else {
			const resMsg: ResInterface = {
				status: 500,
				msg: "没有角色文件名",
			};
			res.json(resMsg);
			return;
		}
	}
});

export default routerUpload;
