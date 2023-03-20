import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
	type: "mysql",
	host: "localhost",
	port: 3306,
	username: "root",
	password: "root",
	database: "monopoly",
	synchronize: true,
	entities: [__dirname + "/entities/*{.js,.ts}"],
});

export default AppDataSource;
