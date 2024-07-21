import { DataSource } from "typeorm";
import {MYSQL_PORT} from "../../../global.config";

const AppDataSource = new DataSource({
	type: "mysql",
	host: process.env.NODE_ENV == "production" ? "mysql" : "localhost",
	port: MYSQL_PORT,
	username: "root",
	password: "root",
	database: "monopoly",
	synchronize: true,
	entities: [__dirname + "/entities/*{.js,.ts}"],
});

export default AppDataSource;
