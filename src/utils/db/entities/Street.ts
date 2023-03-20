import { Entity, PrimaryGeneratedColumn, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Property } from "./Property";

@Entity()
export class Street {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@PrimaryColumn({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "float", nullable: false })
	increase: number;

	@OneToMany(() => Property, (property) => property.street, { cascade: true })
	properties: Property;
}
