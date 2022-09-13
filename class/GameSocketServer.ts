import { WebSocket, WebSocketServer } from "ws";
import CommInterface from "./Interface/CommInterface";
import CommTypes from "./enums/CommTypes";
import Player from "./base/Player";
import Room from "./base/Room";
import { newRoomId } from "./utils";
import MsgInterface from "./Interface/MsgInterface";
import colors from "colors";
require("colors");

interface SocketClientListInterface {
	[key: string]: WebSocket;
}

class GameSocketServer {
	private socketServer: WebSocketServer;
	private socketClientList: SocketClientListInterface = {};
	private roomList: Array<Room> = [];

	constructor() {
		this.socketServer = new WebSocketServer({
			port: 3010,
		}); //开启socket

		this.socketServer.on("connection", (socketClient: WebSocket) => {
			let player: Player; //连接成功后生成一个玩家类;

			socketClient.on("error", () => {
				if (Object.prototype.hasOwnProperty.call(this.socketClientList, player.getId())) {
					this.deletePlayer(player.getId());
					delete this.socketClientList[player.getId()];
				}
			});

			socketClient.on("close", () => {
				if (Object.prototype.hasOwnProperty.call(this.socketClientList, player.getId())) {
					this.deletePlayer(player.getId());
					delete this.socketClientList[player.getId()];
				}
			});

			socketClient.on("message", (data) => {
				let receivedData: CommInterface = JSON.parse(data.toString());
				let receivedMsg: MsgInterface = receivedData.msg;
				switch (receivedData.type) {
					case CommTypes.ConnectSuccess:
						if(receivedMsg.data == '') console.info("有空字符")
						player = new Player(receivedMsg.data, receivedMsg.sourceId, socketClient);
						this.handleConnectSuccess(socketClient, player.getId());
						break;
					case CommTypes.GetRoomList: //处理玩家查询全部房间信息
						this.handleGetRoomList(socketClient);
						break;
					case CommTypes.JoinRoom: //处理玩家加入房间
						this.handleJoinRoom(player, receivedMsg.targetId);
						break;
					case CommTypes.LeaveRoom: //处理玩家离开房间
						this.handleLeaveRoom(socketClient, receivedMsg.sourceId, receivedMsg.targetId);
						break;
				}
			});
		});
	}

	//向全体玩家发送房间更新信息
	roomListRadio() {
		const radioMsg: CommInterface = {
			type: CommTypes.GetRoomList,
			msg: {
				sourceId: "server",
				targetId: "",
				data: JSON.stringify(this.getRoomListInfo()),
				extra: "",
			},
		};
		this.socketServer.clients.forEach((socketClient) => {
			this.sendMsgToOneClient(socketClient, radioMsg);
		});
	}

	//广播房间内状态
	roomRadio(roomId: string) {
		let currentRoom = this.getRoomById(roomId); //获取当前房间
		let playerList = currentRoom.getPlayerList(); //获取当前房间的玩家列表
		const roomMsg: CommInterface = {
			//填写广播的信息
			type: CommTypes.RoomRadio,
			msg: {
				sourceId: roomId,
				targetId: "",
				data: JSON.stringify(currentRoom.getInfo()),
				extra: "",
			},
		};
		playerList.forEach((player) => {
			player.getSocketClient().send(JSON.stringify(roomMsg));
		});
		this.roomListRadio(); //更新房间状态
	}

	deletePlayer(playerId: string) {
		console.info("玩家:  ".gray + playerId.yellow + " 断开连接".red);
		let emptyRoomIndex = -1;
		this.roomList.forEach((room, index) => {
			if (room.hasPlayerById(playerId)) {
				//寻找离开的玩家所在房间
				room.leave(playerId);
				if (room.isEmpty()) {
					//玩家离开后房间为空就删除房间
					emptyRoomIndex = index;
				} else {
					this.roomRadio(room.getId());
				}
			}
		});
		if (emptyRoomIndex != -1) {
			this.roomList.splice(emptyRoomIndex, 1);
			this.roomListRadio(); //通知全体在线玩家更新房间列表
		}
	}

	handleConnectSuccess(socketClient: WebSocket, playerId: string) {
		console.info("玩家: ".gray, playerId.yellow, "连接成功".green);
		this.socketClientList[playerId] = socketClient;
		const replyMsg: CommInterface = {
			type: CommTypes.ConnectSuccess,
			msg: {
				sourceId: "server",
				targetId: "",
				data: "连接服务器Socket成功!",
				extra: "",
			},
		};
		this.sendMsgToOneClient(socketClient, replyMsg);
	}

	//向某个客户端发送全体房间信息
	handleGetRoomList(socketClient: WebSocket) {
		const roomListInfo = this.getRoomListInfo();
		const replyMsg: CommInterface = {
			type: CommTypes.GetRoomList,
			msg: {
				sourceId: "server",
				targetId: "",
				data: JSON.stringify(roomListInfo),
				extra: "",
			},
		};
		this.sendMsgToOneClient(socketClient, replyMsg);
	}

	handleJoinRoom(player: Player, roomId: string) {
		let roomIndex = this.getRoomIndexById(roomId);
		let currentRoom: Room;
		//判断房间是否存在, 不存在就创建
		if (roomIndex === -1) {
			roomId = newRoomId();
			currentRoom = new Room(roomId, player);
			this.roomList.push(currentRoom);
			this.roomListRadio(); //创建房间后向全体玩家发送房间列表更新的信息
			console.info("玩家: ".gray, player.getId().yellow, "创建房间:".gray, roomId.yellow);
		} else {
			currentRoom = this.roomList[roomIndex];
			console.info("玩家: ".gray, player.getId().yellow, "进入房间:".gray, roomId.yellow);
		}
		currentRoom.join(player); //玩家进入房间

		const replyMsg: CommInterface = {
			//设置加入成功的回复信息
			type: CommTypes.JoinRoom,
			msg: {
				sourceId: roomId,
				targetId: player.getId(),
				data: "",
				extra: "",
			},
		};
		this.sendMsgToOneClient(player.getSocketClient(), replyMsg);
		this.roomRadio(roomId);
	}

	handleLeaveRoom(socketClient: WebSocket, playerId: string, roomId: string) {
		console.info("玩家: ".gray, playerId.yellow, "离开房间:".red, roomId.yellow);
		//处理玩家离开房间
		const currentRoom = this.roomList[this.getRoomIndexById(roomId)];
		const leaveRoomMsg: CommInterface = {
			type: CommTypes.LeaveRoom,
			msg: {
				sourceId: "server",
				targetId: "",
				data: "",
				extra: "",
			},
		};
		currentRoom.leave(playerId);
		this.sendMsgToOneClient(socketClient, leaveRoomMsg);
		if (currentRoom.isEmpty()) {
			//玩家离开后房间为空就删除房间
			this.roomList.splice(this.getRoomIndexById(currentRoom.getId()), 1);
			this.roomListRadio(); //通知全体在线玩家更新房间列表
		} else {
			this.roomRadio(roomId); //离开后通知房间内其他玩家更新信息
		}
	}

	getRoomIndexById(roomId: string) {
		return this.roomList.findIndex((item) => item.getId() == roomId);
	}

	getRoomById(roomId: string) {
		return this.roomList[this.getRoomIndexById(roomId)];
	}

	getRoomListInfo() {
		return this.roomList.map((room) => {
			return room.getInfo();
		});
	}

	sendMsgToOneClient(socketClient: WebSocket, msg: CommInterface) {
		socketClient.send(JSON.stringify(msg));
	}
}

export default GameSocketServer;