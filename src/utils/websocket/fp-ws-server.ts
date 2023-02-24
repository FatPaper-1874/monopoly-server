import { WebSocket, WebSocketServer } from "ws";
import { Room } from "../../classes/Room";
import { SocketMsgType } from "../../enums/bace";
import { SocketMessage, User } from "../../interfaces/bace";
const color = require("colors-console");

enum ServerStatus {
	"ONLINE",
	"OFFLINE",
}

/**
 * 扩写Map, 使Map在触发某些函数的时候自动触发自定义的函数;
 */
class FPMap<K, V> extends Map<K, V> {
	private setFunction: Function;
	private deleteFunction: Function;

	constructor(options: { setFunction: Function; deleteFunction: Function }) {
		super();
		this.setFunction = options.setFunction;
		this.deleteFunction = options.deleteFunction;
	}

	set(key: K, value: V): this {
		const res = super.set(key, value);
		this.setFunction(key, value);
		return res;
	}

	delete(key: K): boolean {
		const res = super.delete(key);
		this.deleteFunction(key);
		return res;
	}
}

export class GameSocketServer {
	private socketServer: WebSocketServer;
	private userList: FPMap<string, User>;
	private roomList: FPMap<string, Room>;
	// private roomList: Map

	public serverStatus: ServerStatus;

	constructor(port: number = 3001) {
		this.socketServer = new WebSocketServer({ port });
		console.log("SocketServer Open Success!");
		this.serverStatus = ServerStatus.ONLINE;

		//设置用户列表变动触发的函数
		this.userList = new FPMap({
			setFunction: (key: string, value: User) => {
				console.log("用户: " + color("magenta", value.userId) + color("green", " 连接成功"));
				this.serverBroadcast(SocketMsgType.UserList, this.getUserList()); //广播用户列表
				this.logUserList();
			},
			deleteFunction: (key: string) => {
				console.log("用户: " + color("magenta", key) + color("red", " 断开了连接"));
				this.serverBroadcast(SocketMsgType.UserList, this.getUserList()); //广播用户列表
				this.logUserList();
			},
		});

		this.roomList = new FPMap({
			setFunction: (key: string, value: Room) => {
				console.log("用户: " + color("magenta", value.getOwner().username) + color("green", " 创建了房间: ") + color("yellow", key));
				this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
				this.logRoomList();
			},
			deleteFunction: (key: string) => {
				console.log("房间: " + color("yellow", key) + color("red", " 解散了"));
				this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
				this.logRoomList();
			},
		});

		this.socketServer.on("connection", (socketClient: WebSocket) => {
			let clientUserId = "";
			socketClient.once("message", (data: Buffer) => {
				const resData = JSON.parse(JSON.parse(data.toString()).data);
				//接收客户端返回的账号信息
				const userId = resData.userId || "";
				const username = resData.username || "";
				const avatar = resData.avatar || "";
				const color = resData.color || "";

				if (userId && username) {
					//如果收到的信息有效, 就把用户加进userList并回复客户端
					clientUserId = userId;
					this.userList.set(userId, {
						userId,
						username,
						socketClient,
						isReady: false,
						avatar,
						color,
					});
					this.sendToClient(socketClient, SocketMsgType.ConfirmIdentity, "success", {
						type: "success",
						content: "Socket服务器连接成功 !",
					}); //向客户端返回获得账号信息成功
					this.sendToClient(socketClient, SocketMsgType.RoomList, this.getRoomList()); //向客户端发送房间信息
				} else {
					this.sendToClient(socketClient, SocketMsgType.ConfirmIdentity, "fail", {
						type: "error",
						content: "Socket服务器获取用户失败, 关闭Socket连接",
					});
					socketClient.close();
				}
			});

			socketClient.on("message", (data: Buffer) => {
				const socketMessage: SocketMessage = JSON.parse(data.toString());
				switch (socketMessage.type) {
					case SocketMsgType.JoinRoom:
						this.handleJoinRoom(socketClient, socketMessage, clientUserId);
						break;
					case SocketMsgType.LeaveRoom:
						this.handleLeaveRoom(socketClient, socketMessage, clientUserId);
						break;
					case SocketMsgType.ReadyToggle:
						this.handleReadyToggle(socketClient, socketMessage, clientUserId);
						break;
					case SocketMsgType.GameStart:
						this.handleGameStart(socketClient, socketMessage, clientUserId);
				}
			});

			socketClient.on("close", () => {
				if (this.userList.has(clientUserId)) {
					const roomId = this.userInWhichRoom(clientUserId);
					if (roomId) {
						if (this.roomList.get(roomId)?.leave(clientUserId)) {
							//如果用户离开后房间为空
							this.roomList.delete(roomId); //解散房间
						}
						this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
					}
					this.userList.delete(clientUserId);
				}
			});

			socketClient.on("error", () => {
				if (this.userList.has(clientUserId)) {
					const roomId = this.userInWhichRoom(clientUserId);
					if (roomId) {
						if (this.roomList.get(roomId)?.leave(clientUserId)) {
							//如果用户离开后房间为空
							this.roomList.delete(roomId); //解散房间
						}
						this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
					}
					this.userList.delete(clientUserId);
				}
			});
		});
	}

	/**
	 * 服务器广播(所有客户端都可以收到)
	 * @param type 发送的信息类型
	 * @param data 发送的信息本体
	 * @param msg 可以使客户端触发message组件的信息
	 */
	public serverBroadcast(type: SocketMsgType, data: any, msg?: { type: string; content: string }) {
		const msgToSend: SocketMessage = {
			type,
			data,
			source: "server",
			msg,
		};
		this.socketServer.clients.forEach((client) => {
			client.send(JSON.stringify(msgToSend));
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
	public sendToClient(socketClient: WebSocket, type: SocketMsgType, data: any, msg?: { type: "success" | "warning" | "error" | "message"; content: string }, roomId?: string) {
		const msgToSend: SocketMessage = {
			type,
			data,
			source: "server",
			roomId,
			msg,
		};
		socketClient.send(JSON.stringify(msgToSend));
	}

	/**
	 * 打印当前已连接的用户的名字和id
	 */
	private logUserList() {
		const userIdArr = Array.from(this.userList.values());
		const userListStr = userIdArr.map((item) => `${color("yellow", item.username)}: ${color("magenta", item.userId)}`).join("\n");
		console.log(`---------当前用户(${this.userList.size}) ---------\n${userListStr}\n------------------------------\n`);
	}

	private logRoomList() {
		const roomList = this.getRoomList();
		const roomListStr = roomList.map((item) => `${color("yellow", item.ownerName)}: ${color("magenta", item.roomId)}`).join("\n");
		console.log(`---------当前房间(${this.roomList.size}) ---------\n${roomListStr}\n------------------------------\n`);
	}

	/**
	 * 获取当前已连接的用户的名字和id
	 * @returns 当前已连接的用户的名字和id
	 */
	private getUserList() {
		return Array.from(this.userList.values()).map((user) => ({ userId: user.userId, username: user.username, avatar: user.avatar, color: user.color }));
	}

	/**
	 * 获取当前所有房间的id, 房主的id 和 用户名
	 * @returns 当前所有房间的id, 房主的id 和 用户名
	 */
	private getRoomList() {
		return Array.from(this.roomList.values()).map((room) => {
			const user = room.getOwner();
			return { roomId: room.getRoomId(), ownerId: user.userId, ownerName: user.username, userNum: room.getUserNum() };
		});
	}

	private userInWhichRoom(userId: string) {
		let roomId = "";
		Array.from(this.roomList.values()).forEach((room) => {
			if (room.hasUser(userId)) {
				roomId = room.getRoomId();
			}
		});
		return roomId;
	}

	// -----处理socket信息的函数-----

	/**
	 * 处理客户端加入房间的请求
	 * @param socketClient 发送信息的socket客户端实例
	 * @param data 收到的信息
	 * @param clientUserId 触发函数的用户id
	 */
	private handleJoinRoom(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
		const user = this.userList.get(clientUserId);
		const roomId = data.roomId;
		if (user) {
			if (this.userInWhichRoom(user.userId)) {
				//如果用户在某个房间里面 就不能创建或加入房间
				this.sendToClient(socketClient, SocketMsgType.JoinRoom, "fail", { type: "error", content: "你已经在房间内" }, this.userInWhichRoom(user.userId));
				return;
			}
			if (roomId) {
				//	有roomId要加入房间
				const roomToJoin = this.roomList.get(roomId);
				if (roomToJoin) {
					if (roomToJoin.join(user)) {
						this.sendToClient(user.socketClient, SocketMsgType.JoinRoom, "success", { type: "success", content: `成功加入了${roomToJoin.getOwner().username}的房间` }, roomId);
						this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); // 有人加入房间后广播房间列表
					} else {
						this.sendToClient(user.socketClient, SocketMsgType.JoinRoom, "fail", { type: "warning", content: "你已经在房间内" }, roomId);
					}
				} else {
					this.sendToClient(socketClient, SocketMsgType.JoinRoom, "fail", { type: "error", content: "房间不存在" });
				}
			} else {
				//	没有roomId就表示要创建房间
				const newRoom = new Room(user);
				this.roomList.set(newRoom.getRoomId(), newRoom);
				this.sendToClient(socketClient, SocketMsgType.JoinRoom, "success", { type: "success", content: "创建房间成功" }, newRoom.getRoomId());
			}
		}
	}

	/**
	 * 处理离开房间
	 * @param socketClient 发送信息的socket客户端实例
	 * @param data 收到的信息
	 * @param clientUserId 触发函数的用户id
	 */
	private handleLeaveRoom(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
		if (this.userList.has(clientUserId)) {
			const roomId = this.userInWhichRoom(clientUserId);
			if (roomId && data.roomId === roomId) {
				if (this.roomList.get(roomId)?.leave(clientUserId)) {
					//如果用户离开后房间为空
					this.roomList.delete(roomId); //解散房间
				}
				this.sendToClient(socketClient, SocketMsgType.LeaveRoom, "success", { type: "success", content: "你离开了房间" });
				this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
			} else {
				this.sendToClient(socketClient, SocketMsgType.LeaveRoom, "error", { type: "error", content: "非法的房间号" });
			}
		}
	}

	private handleReadyToggle(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
		if (this.userList.has(clientUserId)) {
			const roomId = this.userInWhichRoom(clientUserId);
			if (roomId && data.roomId === roomId) {
				const room = this.roomList.get(roomId);
				if (room) {
					room.readyToggle(clientUserId);
				} else {
					this.sendToClient(socketClient, SocketMsgType.ReadyToggle, "error", { type: "error", content: "非法的房间号" });
				}
			} else {
				this.sendToClient(socketClient, SocketMsgType.ReadyToggle, "error", { type: "error", content: "不在房间内" });
			}
		}
	}

	private handleGameStart(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
		if (this.userList.has(clientUserId)) {
			const roomId = this.userInWhichRoom(clientUserId);
			const room = this.roomList.get(roomId);
			if (room) {
				room.startGame();
			}
		}
	}
}

export function createSocketServer() {}