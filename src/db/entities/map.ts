import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, ManyToOne, JoinTable } from "typeorm";
import { MapItem } from "./mapItem";
import { ChanceCard } from "./chanceCard";
import { Property } from "./property";
import { ItemType } from "./itemTypes";
import { Street } from "./street";

@Entity()
export class Map {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@OneToMany(() => MapItem, (mapItem) => mapItem.map, { cascade: true })
	mapItems: MapItem[];

	@OneToMany(() => Property, (property) => property.map, { cascade: true })
	properties: Property[];

	@ManyToMany(() => ChanceCard, (chanceCard) => chanceCard.maps)
	chanceCards: ChanceCard[];

	@ManyToMany(() => ItemType, (itemType) => itemType.map, { cascade: true })
	itemTypes: ItemType[];

	@OneToMany(() => Street, (street) => street.map, { cascade: true })
	streets: Street[];

	@Column({ type: "text", nullable: true })
	background: string;

	@Column({ type: "simple-array", nullable: true })
	indexList: Array<string>;
}
