import {Router} from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {createModel} from "../db/api/model";
import {ResInterface} from "../interfaces/res";
import {setBackground} from "../db/api/map";
import {uploadFile} from "../utils/COS-uploader";

const modelUploaderMulter = multer({dest: "public/models"});
const backgroundMulter = multer({dest: "public/backgrounds"});
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
            res.status(resMsg.status).json(resMsg);
            return;
        }
        const filePath = req.file.path;
        const fileName = req.file.filename + fileType;
        const fileUrl = await uploadFile({filePath, targetPath: "monopoly/models/", name: fileName})

        if (req.body.name) {
            const modelName = req.body.name;
            try {
                await createModel(modelName, fileUrl, fileName);
            } catch {
                const resMsg: ResInterface = {
                    status: 500,
                    msg: "模型创建失败",
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

routerUpload.post("/background", backgroundMulter.single("background"), async (req, res, next) => {
    // console.log(req.file);
    if (req.file?.originalname) {
        const fileType = path.parse(req.file?.originalname).ext;
        if (!fileType && !fileType.includes("png") && !fileType.includes("jpg")) {
            const resMsg: ResInterface = {
                status: 500,
                msg: "文件后缀名不合法",
            };
            res.status(resMsg.status).json(resMsg);
            return;
        }
        const filePath = req.file.path;
        const fileName = req.file.filename + fileType;
        const fileUrl = await uploadFile({filePath, targetPath: "monopoly/backgrounds/", name: fileName})

        if (req.body.mapId) {
            const mapId = req.body.mapId;
            try {
                await setBackground(mapId, fileUrl);
            } catch {
                const resMsg: ResInterface = {
                    status: 500,
                    msg: "背景添加失败",
                };
                res.status(resMsg.status).json(resMsg);
                return;
            }
            const resMsg: ResInterface = {
                status: 200,
                msg: "背景添加成功",
                data: fileUrl,
            };
            res.status(resMsg.status).json(resMsg);
        } else {
            const resMsg: ResInterface = {
                status: 500,
                msg: "没有文件名",
            };
            res.status(resMsg.status).json(resMsg);
            return;
        }
    }
});
export default routerUpload;
