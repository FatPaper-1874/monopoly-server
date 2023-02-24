import { WebSocket } from "ws";
import { SocketMsgType } from "../enums/bace";
import { User, SocketMessage, RoomInfo } from "../interfaces/bace";
import fs from "fs";
import path from "path";

export class Room {
	private roomId: string;
	private userList: Map<string, User>;
	private isStarted: boolean;
	private ownerId: string;

	constructor(owner: User) {
		this.roomId = this.newRoomId();
		this.ownerId = owner.userId;
		this.userList = new Map();
		this.join(owner);
		this.isStarted = false;
	}

	public getRoomId() {
		return this.roomId;
	}

	public getOwner() {
		return {
			userId: this.ownerId,
			username: this.userList.get(this.ownerId)!.username,
		};
	}

	/**
	 * 将房间的信息广播到房间内的全部用户, 通常在房间界面会用到
	 */
	public roomInfoBroadcast() {
		const roomInfo = this.getRoomInfo();
		const msg: SocketMessage = {
			type: SocketMsgType.RoomInfo,
			source: "server",
			roomId: this.roomId,
			data: roomInfo,
		};
		this.roomBroadcast(msg);
	}

	/**
	 * 将信息广播到房间内的全部用户
	 */
	public roomBroadcast(msg: SocketMessage) {
		Array.from(this.userList.values()).forEach((user: User) => {
			user.socketClient.send(JSON.stringify(msg));
		});
	}

	/**
	 * 获取房间的信息
	 * @returns 返回房间的信息
	 */
	private getRoomInfo(): RoomInfo {
		const roomInfo: RoomInfo = {
			roomId: this.roomId,
			userList: Array.from(this.userList.values()).map((user) => ({ userId: user.userId, username: user.username, isReady: user.isReady, color: user.color, avatar: user.avatar })),
			isStarted: this.isStarted,
			ownerId: this.getOwner().userId,
			ownerName: this.getOwner().username,
		};
		return roomInfo;
	}

	/**
	 * 转变某个用户的准备状态
	 * @param _user 要转变准备状态用户的id或实例
	 */
	readyToggle(_user: User): boolean;
	readyToggle(_user: string): boolean;
	public readyToggle(_user: User | string) {
		const user = this.userList.get(typeof _user === "string" ? _user : _user.userId);
		if (user) {
			user.isReady = !user.isReady;
			this.roomInfoBroadcast();
			return user.isReady;
		}
		return false;
	}

	/**
	 * 用户加入房间
	 * @param user 加入房间的用户的id或实例
	 * @returns 是否加入成功
	 */
	public join(user: User) {
		user.isReady = false;
		if (this.userList.has(user.userId)) {
			//用户已在房间内
			return false;
		} else {
			this.userList.set(user.userId, user);
			this.roomInfoBroadcast();
			return true;
		}
	}

	/**
	 * 用户离开房间
	 * @param user 离开房间的用户的id
	 * @returns 玩家离开后房间是否为空
	 */
	public leave(userId: string): boolean {
		this.userList.delete(userId);
		if (this.userList.size == 0) {
			return true;
		} else {
			if (this.ownerId === userId) {
				//如果是房主离开, 转移房主
				this.ownerId = Array.from(this.userList.keys())[0];
				const owner = this.userList.get(this.ownerId);
				if (owner) owner.isReady = false;
			}
			this.roomInfoBroadcast();
			return false;
		}
	}

	public async startGame() {
		if (!Array.from(this.userList).every((item) => item[1].userId == this.ownerId || item[1].isReady)) {
			this.roomBroadcast({ type: SocketMsgType.GameStart , source: "server", data: "error", msg: { type: "warning", content: "有玩家未准备" } });
			return;
		}
		const filePath = path.join(__dirname, "../../public/map-ji.json");
		const mapData = await fs.readFileSync(filePath, "utf-8");
		this.roomBroadcast({ type: SocketMsgType.GameStart, source: "server", data: mapData});
	}

	/**
	 * 获取房间内用户数量
	 * @return  用户数量
	 */
	public getUserNum() {
		return this.userList.size;
	}

	/**
	 * 房间中是否存在该用户
	 * @param _user 要查找的用户的id或实例
	 */
	public hasUser(_user: User): boolean;
	public hasUser(_user: string): boolean;
	public hasUser(_user: User | string): boolean {
		return this.userList.has(typeof _user === "string" ? _user : _user.userId);
	}

	/**
	 * 生成新的房间id
	 * @returns 返回的id
	 */
	private newRoomId() {
		return "room-xxxx-xxxx-xxxxxx".replace(/[x]/g, (c) => {
			const r = (Math.random() * 16) | 0,
				v = c == "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	/**
	 * 向指定客户端发送信息
	 * @param socketClient 要发送信息的客户端/或者用户id
	 * @param type 发送的信息类型
	 * @param data 发送的信息本体
	 * @param msg 可以使客户端触发message组件的信息
	 * @param roomId 房间Id
	 */
	public sendToClient(socketClient: WebSocket, type: SocketMsgType, data: any, msg?: { type: string; content: string }, roomId?: string) {
		const msgToSend: SocketMessage = {
			type,
			data,
			source: "server",
			roomId,
			msg,
		};
		socketClient.send(JSON.stringify(msgToSend));
	}
}
