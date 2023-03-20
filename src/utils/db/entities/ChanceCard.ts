import { Entity, PrimaryGeneratedColumn, Column, JoinTable, ManyToMany } from "typeorm";
import { Map } from "./Map";

@Entity()
export class ChanceCard {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "varchar", nullable: false })
	describe: string;

	@Column({ type: "varchar", nullable: false })
	icon: string;

	@Column({ type: "varchar", nullable: false })
	effectCode: string;

	@ManyToMany(() => Map, (map) => map.chanceCards)
	@JoinTable({ name: "map_chance_card" })
	maps: Map[];
}
