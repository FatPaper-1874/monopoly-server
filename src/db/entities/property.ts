import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToOne, JoinColumn, Index } from "typeorm";
import { Map } from "./map";
import { Street } from "./street";
import { MapItem } from "./mapItem";

@Entity()
export class Property {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "int", nullable: false })
	sellCost: number;

	@Column({ type: "int", nullable: false })
	buildCost: number;

	@Column({ type: "int", nullable: false })
	cost_lv0: number;

	@Column({ type: "int", nullable: false })
	cost_lv1: number;

	@Column({ type: "int", nullable: false })
	cost_lv2: number;

	@Column({ type: "varchar", nullable: true })
	effectCode: string;

	@OneToOne(() => MapItem, (mapItem) => mapItem.property, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	mapItem: MapItem;

	@ManyToOne(() => Street, (street) => street.id, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@Index()
	street: Street;

	@ManyToOne(() => Map, (map) => map.properties, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@Index()
	map: Map;
}
