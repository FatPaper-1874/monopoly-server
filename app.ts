import "reflect-metadata";
import { GameSocketServer } from "./src/utils/websocket/fp-ws-server";
import AppDataSource from "./src/utils/db/dbConnecter";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { expressjwt } from "express-jwt";
import routerUser from "./src/routers/user";
import routerUpload from "./src/routers/upload";
import { createUser } from "./src/utils/db/api/User";
import routerModel from "./src/routers/model";
import { routerMap } from "./src/routers/map";
import { routerRole } from "./src/routers/role";
import { routerItemType } from "./src/routers/itemType";
import { routerMapItem } from "./src/routers/mapItem";
import { routerStreet } from "./src/routers/street";
import { routerProperty } from "./src/routers/property";
import { routerChanceCard } from "./src/routers/chanceCard";
import { serverLog } from "./src/utils/logger";
import chalk from "chalk";

const APIPORT = 8000;
const SOCKETPORT = 8001;
const TOKENKEY = "Fat_PaperLoveMinecraft";

async function bootstrap() {
	await AppDataSource.initialize()
		.then(() => {
			serverLog(`${chalk.bold.bgGreen(" 数据库连接成功 ")}`);
		})
		.catch((e) => {
			serverLog(`${chalk.bold.bgGreen(" 数据库连接失败 ")}`, "error");
			serverLog(e, "error");
		});
	const app = express();

	app.use(cors());

	app.use(bodyParser.json());

	app.use("/static", express.static("public"));

	app.use(
		expressjwt({
			secret: TOKENKEY,
			algorithms: ["HS256"],
		}).unless({ path: ["/user/register", "/user/login", "/static"] })
	);

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

	//@ts-ignore
	app.use(function (err, req, res, next) {
		if (err.name === "UnauthorizedError") {
			console.error(req.path + ",无效token");
			res.json({
				status: 401,
				msg: "token过期或者无效, 请重新登录",
			});
			return;
		} else if (err.name === "TokenExpiredError") {
			console.log(err);
		} else {
			console.log(err);
		}
		next();
	});

	app.listen(APIPORT, () => {
		serverLog(`${chalk.bold.bgGreen(" API服务启动成功 ")}`);
	});

	const gameSocketServer = new GameSocketServer(SOCKETPORT);
}

bootstrap();
