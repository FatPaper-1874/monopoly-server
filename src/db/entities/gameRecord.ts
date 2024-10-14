import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity()
export class GameRecord {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@PrimaryColumn({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "int", nullable: false })
	duration: number;

	@CreateDateColumn({ name: "create_time", nullable: false })
  createTime: Date;
}
