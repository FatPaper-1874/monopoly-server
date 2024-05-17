import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from "typeorm";
import { ItemType } from "./itemTypes";

@Entity()
export class Model {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({ type: "varchar", nullable: false })
	name: string;

	@Column({ type: "varchar", nullable: false })
	fileUrl: string;

	@Column({ type: "varchar", nullable: false })
	fileName: string;

	@OneToMany(() => ItemType, (itemType) => itemType.model, { cascade: true })
	itemType: ItemType;
}
