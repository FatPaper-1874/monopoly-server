import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { MapItem } from "./MapItem";
import { ChanceCard } from "./ChanceCard";
import { Property } from "./Property";
import { ItemType } from './ItemType';

@Entity()
export class Map {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@OneToMany(() => MapItem, (mapItem) => mapItem.map, { cascade: true })
	mapItems: MapItem;

	@OneToMany(() => Property, (property) => property.map, { cascade: true })
	properties: Property;

	@ManyToMany(() => ChanceCard, (chanceCard) => chanceCard.maps)
	chanceCards: ChanceCard;

	@OneToMany(() => ItemType, (itemType) => itemType.map, { cascade: true })
	itemTypes: ItemType;
}
