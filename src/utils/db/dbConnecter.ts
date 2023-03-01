import { DataSource } from "typeorm";
import { User } from './entitys/User';
import { Role } from './entitys/Role';

const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "root",
  database: "test",
  synchronize: true,
  entities: [User, Role]
})

export default AppDataSource;
