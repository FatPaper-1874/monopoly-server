import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne } from "typeorm";
import { Map } from "./Map";
import { ItemType } from "./ItemType";
import { Property } from "./Property";

@Entity()
export class MapItem {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	_id: string;

	@Column({ type: "int", nullable: false })
	x: number;

	@Column({ type: "int", nullable: false })
	y: number;

	@ManyToOne(() => ItemType, (itemType) => itemType.mapItem, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	type: ItemType;

	@OneToOne(() => MapItem, mapItem => mapItem.linkto)
	linkto?: MapItem;

	@OneToOne(() => Property, (property) => property.mapItem, { cascade: true })
	property?: Property;

	@ManyToOne(() => Map, (map) => map.mapItems, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	map: Map;
}
