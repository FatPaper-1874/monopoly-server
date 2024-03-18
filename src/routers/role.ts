import {Router} from "express";
import {ResInterface} from "../interfaces/res";
import {createRole, deleteRole, getRoleList, updateRole} from "../db/api/role";
import path from "path";
import fs from "fs";
import multer from "multer";
import crypto from "crypto";
import {deleteModel} from "../db/api/model";

export const routerRole = Router();
const roleUploaderMulter = multer({dest: "public/roles"});
const rolePreUploaderMulter = multer({dest: "public/temp"});

routerRole.get("/list", async (req, res, next) => {
    const {page = 1, size = 8} = req.query;
    try {
        const {roleList, total} = await getRoleList(parseInt(page.toString()), parseInt(size.toString()));
        const resMsg: ResInterface = {
            status: 200,
            data: {total, current: parseInt(page.toString()), roleList},
        };
        res.json(resMsg);
    } catch {
        const resMsg: ResInterface = {
            status: 500,
            msg: "获取游戏角色列表失败",
        };
        res.json(resMsg);
    }
});


routerRole.post("/create", roleUploaderMulter.array("role"), async (req, res, next) => {
    // console.log(req.file);
    const files = req.files;
    const acceptTypes = ['.json', '.atlas', '.png'];
    if (files && files instanceof Array) {
        //检查是否为三种文件;
        if (!checkFileTypes(acceptTypes, files)) {
            const resMsg: ResInterface = {
                status: 400,
                msg: "文件类型不正确，请上传.json, .atlas, .png三种文件",
            };
            res.status(400).json(resMsg);
            files.forEach(file => fs.unlink(file.path, (e) => {
            }))
            return
        }

        //对文件进行修改操作
        const tempName = crypto.randomUUID();
        files.forEach(file => {
            const fileType = path.parse(file.originalname).ext;
            const oldFileName = file.path;
            const newFileName = `public\\roles\\${tempName + fileType}`;
            fs.renameSync(oldFileName, newFileName);
            if (fileType === ".atlas") {
                //修改atlas文件的png文件名
                try {
                    const data = fs.readFileSync(newFileName, 'utf-8');
                    const lines = data.split('\n');
                    if (lines.length < 1) {
                        throw new Error();
                    }
                    lines[1] = tempName + '.png';

                    // 将修改后的内容重新组合成一个字符串
                    const modifiedData = lines.join('\n');
                    fs.writeFileSync(newFileName, modifiedData, 'utf-8');
                } catch (e: any) {
                    const resMsg: ResInterface = {
                        status: 500,
                        msg: "在修改atlas文件时出错",
                    };
                    res.status(500).json(resMsg);

                }
            }
        })

        const rolelName = req.body.name;
        const roleColor = req.body.color;
        if (rolelName && roleColor) {
            try {
                await createRole(rolelName, tempName, roleColor);
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
                status: 400,
                msg: "没有文件",
            };
            res.status(400).json(resMsg);
            return;
        }
    } else {
        const resMsg: ResInterface = {
            status: 500,
            msg: "没有上传文件",
        };
        res.status(500).json(resMsg);
    }
});

routerRole.post("/update", roleUploaderMulter.array("role"), async (req, res, next) => {
    // console.log(req.file);
    const files = req.files;
    const acceptTypes = ['.json', '.atlas', '.png'];

    let fileName = "";
    if (files && files instanceof Array && files.length === 3) {
        //检查是否为三种文件;
        if (!checkFileTypes(acceptTypes, files)) {
            const resMsg: ResInterface = {
                status: 400,
                msg: "文件类型不正确，请上传.json, .atlas, .png三种文件",
            };
            res.status(400).json(resMsg);
            files.forEach(file => fs.unlink(file.path, (e) => {
            }))
            return
        }

        //对文件进行修改操作
        const _fileName = crypto.randomUUID();
        files.forEach(file => {
            const fileType = path.parse(file.originalname).ext;
            const oldFileName = file.path;
            const newFileName = `public\\roles\\${_fileName + fileType}`;
            fs.renameSync(oldFileName, newFileName);
            if (fileType === ".atlas") {
                //修改atlas文件的png文件名
                try {
                    const data = fs.readFileSync(newFileName, 'utf-8');
                    const lines = data.split('\n');
                    if (lines.length < 1) {
                        throw new Error();
                    }
                    lines[1] = _fileName + '.png';

                    // 将修改后的内容重新组合成一个字符串
                    const modifiedData = lines.join('\n');
                    fs.writeFileSync(newFileName, modifiedData, 'utf-8');
                    fileName = _fileName
                } catch (e: any) {
                    const resMsg: ResInterface = {
                        status: 500,
                        msg: "在修改atlas文件时出错",
                    };
                    res.status(500).json(resMsg);

                }
            }
        })
    }
    const roleId = req.body.id;
    const roleName = req.body.name;
    const roleColor = req.body.color;
    if (roleId && roleName && roleColor) {
        try {
            await updateRole(roleId, roleName, roleColor, fileName);
        } catch {
            const resMsg: ResInterface = {
                status: 500,
                msg: "角色更新失败",
            };
            res.json(resMsg);
            return;
        }
        const resMsg: ResInterface = {
            status: 200,
            msg: "角色更新成功",
        };
        res.json(resMsg);
    } else {
        const resMsg: ResInterface = {
            status: 400,
            msg: "没有附带信息",
        };
        res.status(400).json(resMsg);
        return;
    }
});

routerRole.delete("/delete", async (req, res, next) => {
    const {id} = req.query;
    if (id) {
        try {
            const resMsg: ResInterface = {
                status: 200,
                msg: "删除成功",
                data: await deleteRole(id.toString()),
            };
            res.json(resMsg);
        } catch (e: any) {
            const resMsg: ResInterface = {
                status: 500,
                msg: e.message || "数据库请求错误",
            };
            res.json(resMsg);
        }
    }
})


routerRole.post("/pre-upload", rolePreUploaderMulter.array("role"), async (req, res, next) => {
    const files = req.files;
    const acceptTypes = ['.json', '.atlas', '.png'];
    if (files && files instanceof Array) {
        //检查是否为三种文件;
        if (!checkFileTypes(acceptTypes, files)) {
            const resMsg: ResInterface = {
                status: 400,
                msg: "文件类型不正确，请上传.json, .atlas, .png三种文件",
            };
            res.status(400).json(resMsg);
            files.forEach(file => fs.unlink(file.path, (e) => {
            }))
            return
        }

        const tempName = crypto.randomUUID();
        const tempFilePathList: string[] = [];
        files.forEach(file => {
            const fileType = path.parse(file.originalname).ext;
            const oldFileName = file.path;
            const newFileName = `public\\temp\\${tempName + fileType}`;
            tempFilePathList.push(newFileName);
            fs.renameSync(oldFileName, newFileName);
            if (fileType === ".atlas") {
                //修改atlas文件的png文件名
                try {
                    const data = fs.readFileSync(newFileName, 'utf-8');
                    const lines = data.split('\n');
                    if (lines.length < 1) {
                        throw new Error();
                    }
                    lines[1] = tempName + '.png';

                    // 将修改后的内容重新组合成一个字符串
                    const modifiedData = lines.join('\n');
                    fs.writeFileSync(newFileName, modifiedData, 'utf-8');
                } catch (e: any) {
                    const resMsg: ResInterface = {
                        status: 500,
                        msg: "在修改atlas文件时出错",
                    };
                    res.status(500).json(resMsg);

                }
            }
        })
        //五分钟后删除临时文件
        setTimeout(() => {
            tempFilePathList.forEach(filePath => {
                fs.unlink(filePath, () => {
                });
            })
        }, 30000)
        const resJson: ResInterface = {
            status: 200,
            data: {fileName: tempName},
            msg: '文件预检成功'
        }
        res.status(200).json(resJson);
    } else {
        const resMsg: ResInterface = {
            status: 400,
            msg: "没有文件",
        };
        res.status(400).json(resMsg);
        return;
    }
});


function checkFileTypes(typesArr: string[], filesArr: Express.Multer.File[]) {
    const typesMap = new Map<string, boolean>();
    typesArr.forEach(type => typesMap.set(type, false));
    filesArr.forEach(file => {
        const fileType = path.parse(file.originalname).ext;
        if (typesArr.includes(fileType)) {
            typesMap.set(fileType, true);
        }
    })
    return Array.from(typesMap.values()).every(b => b);
}
