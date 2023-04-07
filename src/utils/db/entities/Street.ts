import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Property } from "./Property";
import { Map } from "./Map";

@Entity()
export class Street {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "float", nullable: false })
	increase: number;

	@OneToMany(() => Property, (property) => property.street, { cascade: true })
	properties: Property;

	@ManyToOne(() => Map, (map) => map.streets, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	map: Map;
}
