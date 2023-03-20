import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, ManyToOne, OneToOne } from "typeorm";
import { Map } from "./Map";
import { Street } from './Street';
import { MapItem } from './MapItem';

@Entity()
export class Property {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "int", nullable: false })
	sellCost: number;

	@Column({ type: "int", nullable: false })
	cost_lv0: number;

	@Column({ type: "int", nullable: false })
	cost_lv1: number;

	@Column({ type: "int", nullable: false })
	cost_lv2: number;

	@OneToOne(()=>MapItem, mapItem => mapItem.property, {  onDelete: "CASCADE", onUpdate: "CASCADE" })
	mapItem: MapItem;

	@ManyToOne(()=> Street, street => street.id, {  onDelete: "CASCADE", onUpdate: "CASCADE" })
	street: Street

	@ManyToOne(()=> Map, map => map.properties, {  onDelete: "CASCADE", onUpdate: "CASCADE" })
	map: Map
}
