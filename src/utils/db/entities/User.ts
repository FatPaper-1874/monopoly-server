import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from "typeorm"

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @PrimaryColumn({ type: 'varchar', length: 9, nullable: false})
  username: string

  @Column({ type: 'varchar', nullable: false})
  password: string

  @Column({ type: 'varchar', nullable: true, default: "user"})
  avatar: string

  @Column({ type: 'varchar', nullable: false, })
  color: string
}