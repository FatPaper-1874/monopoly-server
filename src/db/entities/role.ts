import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @PrimaryColumn({ type: 'varchar', nullable: false})
  roleName: string

  @Column({ type: 'varchar', nullable: false})
  baseUrl: string

  @Column({ type: 'varchar', nullable: false})
  fileName: string

  @Column({ type: 'varchar', nullable: false})
  color: string
}