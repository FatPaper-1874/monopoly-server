import {Router} from "express";
import {} from "NeteaseCloudMusicApi"
import {ResInterface} from "../interfaces/res";
import {getMusicList} from "../utils/music";

export const routerMusic = Router();

routerMusic.get('/list', async (req, res, next) => {
    try {
        // const songList = await getMusicList();
        const resData: ResInterface = {
            status: 200,
            data: []
        }
        res.status(200).json(resData);
    } catch (e: any) {
        console.error(e)
        const resData: ResInterface = {
            status: 500,
            data: e.message,
            msg: "获取音乐歌单失败"
        }
        res.status(500).json(resData);
    }
})

