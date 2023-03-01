import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @PrimaryColumn({ type: 'varchar', nullable: false})
  rolename: string

  @Column({ type: 'varchar', nullable: false})
  filename: string

  @Column({ type: 'varchar', nullable: false})
  color: string
}