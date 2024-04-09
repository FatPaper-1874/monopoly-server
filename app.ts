import "reflect-metadata";
import {GameSocketServer} from "./src/utils/websocket/fp-ws-server";
import AppDataSource from "./src/db/dbConnecter";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {expressjwt} from "express-jwt";
import routerUpload from "./src/routers/upload";
import routerModel from "./src/routers/model";
import {routerUser} from "./src/routers/user";
import {routerMap} from "./src/routers/map";
import {routerRole} from "./src/routers/role";
import {routerItemType} from "./src/routers/item-type";
import {routerMapItem} from "./src/routers/mapItem";
import {routerStreet} from "./src/routers/street";
import {routerProperty} from "./src/routers/property";
import {routerChanceCard} from "./src/routers/chance-card";
import {routerMusic} from "./src/routers/music";
import {serverLog} from "./src/utils/logger";
import chalk from "chalk";
import {__APIPORT__, __SOCKETPORT__} from "./global.config";
import {getPublicKey} from "./src/utils/api/keys";
import {roleValidation} from "./src/utils/role-validation";
import {login, login_cellphone} from "NeteaseCloudMusicApi";
import {initNeteaseCloudMusic} from "./src/utils/music";

// import { roleValidation } from "./src/utils/role-validation";

async function bootstrap() {
    try {
        await AppDataSource.initialize().then(() => {
            serverLog(`${chalk.bold.bgGreen(" 数据库连接成功 ")}`);
        });

        const publicKey = await getPublicKey();
        serverLog(`${chalk.bold.bgGreen(" 用户服务器连接成功 ")}`);

        // await initNeteaseCloudMusic('13431722727', 'max2684', "monopoly_music");

        const app = express();

        app.use(cors());

        app.use("/static", express.static("public"));

        app.use(roleValidation);	//身份验证

        app.use(bodyParser.json());

        app.use("/user", routerUser);
        app.use("/role", routerRole);
        app.use("/model", routerModel);
        app.use("/upload", routerUpload);
        app.use("/map", routerMap);
        app.use("/item-type", routerItemType);
        app.use("/map-item", routerMapItem);
        app.use("/street", routerStreet);
        app.use("/property", routerProperty);
        app.use("/chance-card", routerChanceCard);
        app.use("/music", routerMusic);

        app.listen(__APIPORT__, () => {
            serverLog(`${chalk.bold.bgGreen(` API服务启动成功 ${__APIPORT__}端口`)}`);
        });

        const gameSocketServer = new GameSocketServer(__SOCKETPORT__);
    } catch (e: any) {
        serverLog(`${chalk.bold.bgRed(` 服务器出错: `)}`, "error");
        console.log(e)
    }
}

bootstrap();
