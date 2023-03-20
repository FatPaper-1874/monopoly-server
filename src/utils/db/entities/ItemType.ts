import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Map } from "./Map";
import { MapItem } from "./MapItem";
import { Model } from "./Model";

@Entity()
export class ItemType {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	color: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@ManyToOne(() => Model, (model) => model.itemType, {  onDelete: "CASCADE", onUpdate: "CASCADE" })
	model: Model;

	@Column({ type: "int", nullable: false })
	size: number;

	@Column({ type: "varchar", nullable: true })
	effectCode: string;

	@OneToMany(() => MapItem, (mapItem) => mapItem.type, { cascade: true })
	mapItem: MapItem;

	@ManyToOne(() => Map, (map) => map.itemTypes, {  onDelete: "CASCADE", onUpdate: "CASCADE" })
	map: Map;
}
