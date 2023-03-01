import "reflect-metadata";
import { GameSocketServer } from "./src/utils/websocket/fp-ws-server";
import AppDataSource from "./src/utils/db/dbConnecter";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { expressjwt } from "express-jwt";
import routerLogin from "./src/routers/login";
import routerUser from './src/routers/user'
import routerTest from "./src/routers/test";
import { UserCreate } from './src/utils/db/api/User';
import { RoleCreate } from './src/utils/db/api/Role';

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

	// app.use(function (req, res, next) {
	// 	var token = req.headers["authorization"];
	// 	if (token == undefined) {
	// 		return next();
	// 	} else {
	// 		verToken(token)
	// 			.then((data) => {
  //         console.log(data);
	// 				return next();
	// 			})
	// 			.catch((error) => {
	// 				return next();
	// 			});
	// 	}
	// });

	app.use(
		expressjwt({
			secret: TOKENKEY,
			algorithms: ["HS256"],
		}).unless({ path: ["/login"] })
	);

	app.use("/login", routerLogin);
	app.use("/user", routerUser);
	app.use("/test", routerTest);

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
