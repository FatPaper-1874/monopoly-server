import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Map } from "./map";
import { MapItem } from "./mapItem";
import { Model } from "./model";

@Entity()
export class ItemType {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	color: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@ManyToOne(() => Model, (model) => model.itemType, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	model: Model;

	@Column({ type: "int", nullable: false })
	size: number;

	@Column({ type: "varchar", nullable: true })
	effectCode: string;

	@OneToMany(() => MapItem, (mapItem) => mapItem.type, { cascade: true })
	mapItem: MapItem;

	@Column({type: "boolean", nullable: false, default: false})
	hasEvent: boolean;

	@ManyToMany(() => Map, (map) => map.itemTypes)
	@JoinTable({name: "itemtype_map"})
	map: Map[];
}