import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"

@Entity()
export class Music {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @PrimaryColumn({ type: 'varchar', nullable: false})
    name: string

    @Column({ type: 'varchar', nullable: false})
    url: string
}