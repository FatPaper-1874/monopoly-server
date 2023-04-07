import { WebSocket } from "ws";
import { SocketMsgType } from "../enums/bace";
import { GameSetting } from "./game";

export interface SocketMessage {
	type: SocketMsgType;
	source: string;
	roomId?: string;
	data: any;
	msg?: {
		type: "success" | "warning" | "error" | "message" | "";
		content: string;
	};
	extra?: any;
}

export interface User {
	userId: string;
	username: string;
	socketClient: WebSocket;
	isReady: boolean;
	avatar: string;
	color: string;
	role: Role;
}

export interface Role {
	id: string;
	rolename: string;
	filename: string;
	color: string;
}

export interface RoomInfo {
	roomId: string;
	userList: Array<{
		userId: string;
		username: string;
		isReady: boolean;
		color: string;
		avatar: string;
	}>;
	isStarted: boolean;
	ownerId: string;
	ownerName: string;
	roleList: Role[];
	gameSetting: GameSetting;
}

export interface MapItem {
	_id: string;
	id: string;
	x: number;
	y: number;
	type: ItemType;
	linkto?: MapItem;
	property?: Property;
}

export interface Property {
	id: string;
	name: string;
	sellCost: number;
	buildCost: number;
	cost_lv0: number;
	cost_lv1: number;
	cost_lv2: number;
	street: Street;
}

export interface ItemType {
	id: string;
	color: string;
	name: string;
	model: Model;
	size: number;
}

export interface Model {
	id: string;
	name: string;
	fileName: string;
}

export interface Street {
	id: string;
	name: string;
	increase: number;
}
