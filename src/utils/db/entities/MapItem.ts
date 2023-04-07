import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
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

	@ManyToOne(() => MapItem, (mapItem) => mapItem.belinked, { onDelete: "SET NULL" })
	@JoinColumn()
	linkto?: MapItem;

	@OneToMany(() => MapItem, (mapItem) => mapItem.linkto, { onDelete: "DEFAULT" })
	belinked?: MapItem[];

	@OneToOne(() => Property, { cascade: true })
	@JoinColumn()
	property?: Property;

	@ManyToOne(() => Map, (map) => map.mapItems, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	map: Map;
}
