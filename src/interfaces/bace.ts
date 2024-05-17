import {WebSocket} from "ws";
import {ChatMessageType, SocketMsgType} from "../enums/bace";
import {GameSetting} from "./game";
import {Column} from "typeorm";

export interface SocketMessage {
    type: SocketMsgType;
    source: string;
    roomId?: string;
    data: any;
    msg?: {
        type: "info" | "success" | "warning" | "error" | "";
        content: string;
    };
    extra?: any;
}

export interface UserInDB {
    id: string;
    useraccount: string;
    username: string;
    avatar: string;
    color: string;
}

export interface User {
    userId: string;
    username: string;
    socketClient: WebSocket;
    avatar: string;
    color: string;
}

export interface UserInRoom extends User {
    role: Role;
    isReady: boolean;
}

export interface Role {
    id: string;
    baseUrl: string;
    roleName: string;
    fileName: string;
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
    effectCode?: string;
    hasEvent: boolean;
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

export interface ChatUserInfo {
    userId: string;
    username: string;
    isReady: boolean;
    avatar: string;
    color: string;
    role: Role;
}

export interface ChatMessage {
    id: string;
    type: ChatMessageType;
    user: ChatUserInfo;
    content: string;
    time: number;
}
