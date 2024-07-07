import {Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn, OneToMany} from "typeorm";
import {Map} from "./map";
import {ItemType} from "./itemTypes";
import {Property} from "./property";
import {ArrivedEvent} from "./arrivedEvent";

@Entity()
export class MapItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type: "varchar", nullable: false})
    _id: string;

    @Column({type: "int", nullable: false})
    x: number;

    @Column({type: "int", nullable: false})
    y: number;

    @Column({type: "int", nullable: false, default: 0})
    rotation: 0 | 1 | 2 | 3;

    @ManyToOne(() => ItemType, (itemType) => itemType.mapItem, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    type: ItemType;

    @ManyToOne(() => MapItem, (mapItem) => mapItem.belinked, {onDelete: "SET NULL"})
    @JoinColumn()
    linkto?: MapItem;

    @OneToMany(() => MapItem, (mapItem) => mapItem.linkto, {onDelete: "DEFAULT"})
    @JoinColumn()
    belinked?: MapItem[];

    @OneToOne(() => Property, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    @JoinColumn()
    property?: Property;

    @ManyToOne(() => ArrivedEvent, (arriveEvent) => arriveEvent.mapItem, {onDelete: "SET NULL", onUpdate: "CASCADE"})
    @JoinColumn()
    arrivedEvent?: ArrivedEvent;

    @ManyToOne(() => Map, (map) => map.mapItems, {onDelete: "CASCADE", onUpdate: "CASCADE"})
    map: Map;
}
