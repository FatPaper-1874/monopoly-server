import { WebSocket, WebSocketServer } from "ws";
import CommInterface from "./Interface/comm/CommInterface";
import CommTypes from "./enums/CommTypes";
import Player from "./base/Player";
import Room from "./base/Room";
import { newRoomId } from "./utils";
import MsgInterface from "./Interface/comm/MsgInterface";
import colors from "colors";
import EventResultTypes from './enums/EventResultTypes';
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
						player = new Player(receivedMsg.data, receivedMsg.sourceId);
						this.handleConnectSuccess(socketClient, player.getId());
						break;
					case CommTypes.GetRoomList: //处理玩家查询全部房间信息
						this.handleGetRoomList(player.getId());
						break;
					case CommTypes.JoinRoom: //处理玩家加入房间
						this.handleJoinRoom(player, receivedMsg.targetId);
						break;
					case CommTypes.LeaveRoom: //处理玩家离开房间
						this.handleLeaveRoom(player, receivedMsg.targetId);
						break;
					case CommTypes.StartGame: //处理开始游戏
						this.handleStartGame(receivedMsg.targetId);
						break;
					case CommTypes.RollDice: //处理摇骰子信号
						this.handleRollDice(player.getId(), receivedMsg);
						break;
					case CommTypes.BuyRealEstate: //处理买地
						this.handleBuyRealEstate(player.getId(), receivedMsg);
						break;
					case CommTypes.UseChanceCard: //处理使用道具卡
						this.handleUseChanceCard(player.getId(), receivedMsg);
						break;
					default:
						break;
				}
			});
		});
	}

	handleConnectSuccess(socketClient: WebSocket, playerId: string) {
		console.info("玩家: ".gray, playerId.yellow, "连接成功".green);
		this.socketClientList[playerId] = socketClient;
		const replyMsg: CommInterface = {
			type: CommTypes.ConnectSuccess,
			msg: {
				sourceId: "server",
				targetId: "",
				data: "",
				extra: "连接服务器Socket成功!",
			},
		};
		this.sendMsgToOneClientById(playerId, replyMsg);
	}

	//向某个客户端发送全体房间信息
	handleGetRoomList(playerId: string) {
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
		this.sendMsgToOneClientById(playerId, replyMsg);
	}

	handleJoinRoom(player: Player, roomId: string) {
		let roomIndex = this.getRoomIndexById(roomId);
		let currentRoom: Room;
		let extraMsg = "";
		//判断房间是否存在, 不存在就创建
		if (roomIndex === -1) {
			roomId = newRoomId();
			currentRoom = new Room(roomId, player);
			this.roomList.push(currentRoom);
			this.roomListRadio(); //创建房间后向全体玩家发送房间列表更新的信息
			extraMsg = "创建房间成功！";
			console.info("玩家: ".gray, player.getId().yellow, "创建房间:".gray, roomId.yellow);
		} else {
			currentRoom = this.roomList[roomIndex];
			extraMsg = "进入房间成功！";
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
				extra: extraMsg,
			},
		};
		this.sendMsgToOneClientById(player.getId(), replyMsg);
		this.roomMsgRaido(roomId, `${player.getName()} 进入了房间`, player.getId());
		this.roomRadio(roomId);
	}

	handleLeaveRoom(player: Player, roomId: string) {
		const playerId = player.getId();
		console.info("玩家: ".gray, playerId.yellow, "离开房间:".red, roomId.yellow);
		//处理玩家离开房间
		const currentRoom = this.roomList[this.getRoomIndexById(roomId)];
		const leaveRoomMsg: CommInterface = {
			type: CommTypes.LeaveRoom,
			msg: {
				sourceId: "server",
				targetId: "",
				data: "",
				extra: `你离开了${currentRoom.getOwner().getName()}的房间`,
			},
		};
		currentRoom.leave(playerId);
		this.sendMsgToOneClientById(player.getId(), leaveRoomMsg);
		if (currentRoom.isEmpty()) {
			//玩家离开后房间为空就删除房间
			this.roomList.splice(this.getRoomIndexById(currentRoom.getId()), 1);
			this.roomListRadio(); //通知全体在线玩家更新房间列表
		} else {
			this.roomRadio(roomId); //离开后通知房间内其他玩家更新信息
			this.roomMsgRaido(roomId, `${player.getName()} 离开了房间`, player.getId());
		}
	}

	handleStartGame(roomId: string) {
		const currentRoom = this.getRoomById(roomId);
		console.info("房间: ".gray, roomId.yellow, "开始游戏:".green);
		currentRoom.startGame();
	}

	// -----游戏进程中的监听-----
	handleRollDice(playId: string, msg: MsgInterface) {
		$evenListen.emit(`${playId}-rollDice`);
	}

	handleBuyRealEstate(playId: string, msg: MsgInterface) {
		const result:EventResultTypes = JSON.parse(msg.data);
		$evenListen.emit(`${playId}-arrivalEvent`, result);
	}

	handleUseChanceCard(playId: string, msg: MsgInterface) {}
	// -----游戏进程中的监听-----

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
		for (const key in this.socketClientList) {
			if (Object.prototype.hasOwnProperty.call(this.socketClientList, key)) {
				this.sendMsgToOneClientById(key, radioMsg);
			}
		}
	}

	//对房间里的全部玩家发通知(会显示在顶部信息提醒)
	roomMsgRaido(roomId: string, msg: string, exceptPlayerId?: string) {
		let currentRoom = this.getRoomById(roomId); //获取当前房间
		let playerList = currentRoom.getPlayerList(); //获取当前房间的玩家列表
		const roomMsg: CommInterface = {
			//填写广播的信息
			type: CommTypes.RoomMsgRadio,
			msg: {
				sourceId: roomId,
				targetId: "",
				data: "",
				extra: msg,
			},
		};
		playerList.forEach((player) => {
			if (!(exceptPlayerId && player.getId() === exceptPlayerId)) {
				this.sendMsgToOneClientById(player.getId(), roomMsg);
			}
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
			this.sendMsgToOneClientById(player.getId(), roomMsg);
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

	getSocketClientById(playId: string): WebSocket {
		return this.socketClientList[playId];
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

	public sendMsgToOneClientById(playId: string, msg: CommInterface) {
		this.getSocketClientById(playId).send(JSON.stringify(msg));
	}
}

export default GameSocketServer;
