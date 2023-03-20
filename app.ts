import "reflect-metadata";
import { GameSocketServer } from "./src/utils/websocket/fp-ws-server";
import AppDataSource from "./src/utils/db/dbConnecter";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { expressjwt } from "express-jwt";
import routerLogin from "./src/routers/login";
import routerUser from "./src/routers/user";
import routerUpload from "./src/routers/upload";
import { createUser } from "./src/utils/db/api/User";
import { createRole } from "./src/utils/db/api/Role";
import routerModel from "./src/routers/model";
import { routerMap } from "./src/routers/map";
import { routerItemType } from './src/routers/itemType';
import { routerMapItem } from './src/routers/mapItem';

const APIPORT = 8000;
const SOCKETPORT = 8001;
const TOKENKEY = "Fat_PaperLoveMinecraft";

async function bootstrap() {
	await AppDataSource.initialize()
		.then(() => {
			console.log("DataBase Connect Success!");
		})
		.catch((e) => {
			console.error("DataBase Connect Fail");
			console.info(e);
		});
	const app = express();

	app.use(cors());

	app.use(bodyParser.json());

	app.use('/static', express.static('public'))

	app.use("/login", routerLogin);
	app.use("/user", routerUser);
	app.use("/model", routerModel);
	app.use("/upload", routerUpload);
	app.use("/map", routerMap);
	app.use("/item-type", routerItemType);
	app.use("/map-item", routerMapItem)

	app.use(
		expressjwt({
			secret: TOKENKEY,
			algorithms: ["HS256"],
		}).unless({ path: ["/login", "/static/*"] })
	);

	//@ts-ignore
	app.use(function (err, req, res, next) {
		if (err.name === "UnauthorizedError") {
			console.error(req.path + ",无效token");
			res.json({
				status: 401,
				msg: "token过期或者无效, 请重新登录",
			});
			return;
		}
		next();
	});

	app.listen(APIPORT, () => {
		console.log("API Server Open Success!");
	});

	const gameSocketServer = new GameSocketServer(SOCKETPORT);
}

bootstrap();
