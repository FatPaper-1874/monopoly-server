import {WebSocket, WebSocketServer} from "ws";
import {Room} from "../../classes/Room";
import {SocketMsgType} from "../../enums/bace";
import {SocketMessage, User} from "../../interfaces/bace";
import {getRoleList} from "../../db/api/role";
import {OperateType} from "../../enums/game";
import {OperateListener} from "../../classes/OperateListener";
import chalk from "chalk";
import {serverLog} from "../logger/index";
import {getUserByToken} from "../fetch/user";

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
    private heartCheckInIntervalId: any;

    // private roomList: Map

    public serverStatus: ServerStatus;

    constructor(port: number = 3001) {
        try {
            this.socketServer = new WebSocketServer({port});
            serverLog(`${chalk.bold.bgGreen(" Socket服务开启成功 ")}`);
            this.serverStatus = ServerStatus.ONLINE;

            this.startHeartCheck();

            //设置用户列表变动触发的函数
            this.userList = new FPMap({
                setFunction: (key: string, value: User) => {
                    serverLog(
                        `${chalk.bold.bgCyan(" 用户: ")} ${chalk.bold.cyanBright(value.username)} ${chalk.bold.bgGreen(" 连接成功 ")}`
                    );
                    this.serverBroadcast(SocketMsgType.UserList, this.getUserList()); //广播用户列表
                    // this.logUserList();
                },
                deleteFunction: (key: string) => {
                    const user = this.userList.get(key);
                    serverLog(
                        `${chalk.bold.bgCyan(" 用户: ")} ${chalk.bold.cyanBright(user?.username || key)} ${chalk.bold.bgRed(
                            " 断开连接 "
                        )}`
                    );
                    this.serverBroadcast(SocketMsgType.UserList, this.getUserList()); //广播用户列表
                    // this.logUserList();
                },
            });

            this.roomList = new FPMap({
                setFunction: (key: string, value: Room) => {
                    serverLog(
                        `${chalk.bold.bgYellow(" 房间: ")} ${chalk.bold.yellowBright(key)} ${chalk.bold.bgGreen(
                            " 创建了 "
                        )} ${chalk.bold.bgCyan(" 房主是: ")} ${chalk.bold.cyanBright(value.getOwner().username)}`
                    );
                    this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
                    // this.logRoomList();
                },
                deleteFunction: (key: string) => {
                    serverLog(`${chalk.bold.bgYellow(" 房间: ")} ${chalk.bold.yellowBright(key)} ${chalk.bold.bgRed(" 解散了 ")}`);
                    this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
                    // this.logRoomList();
                },
            });

            this.socketServer.on("connection", (socketClient: WebSocket) => {
                let clientUserId = "";
                socketClient.once("message", async (data: Buffer) => {
                    const resData = JSON.parse(JSON.parse(data.toString()).data);
                    //接收客户端返回的账号信息
                    const token = resData.token || "";
                    try {
                        const user = await getUserByToken(token);
                        if (user) {
                            clientUserId = user.id;
                            const _user = {
                                userId: user.id,
                                username: user.username,
                                socketClient,
                                avatar: user.avatar,
                                color: user.color,
                            };
                            const userToClient = {
                                userId: user.id,
                                useraccount: user.useraccount,
                                username: user.username,
                                avatar: user.avatar,
                                color: user.color,
                            };
                            this.userList.set(user.id, _user);
                            this.sendToClient(socketClient, SocketMsgType.ConfirmIdentity, userToClient, {
                                type: "success",
                                content: "Socket服务器连接成功 !",
                            }); //向客户端返回获得账号信息成功
                            this.sendToClient(socketClient, SocketMsgType.RoomList, this.getRoomList()); //向客户端发送房间信息
                            //初次连接处理重连
                            if (this.isUserNeedToReconnect(_user)) {
                                this.handleUserReconnect(_user);
                            }
                        } else {
                            this.sendToClient(socketClient, SocketMsgType.ConfirmIdentity, false, {
                                type: "error",
                                content: "Token过期, Socket连接失败",
                            });
                            socketClient.close();
                        }
                    } catch (e: any) {
                        this.sendToClient(socketClient, SocketMsgType.ConfirmIdentity, "", {
                            type: "error",
                            content: e.message,
                        });
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
                        case SocketMsgType.RoomChat:
                            this.handleRoomChat(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.ReadyToggle:
                            this.handleReadyToggle(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.ChangeRole:
                            this.handleChangeRole(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.ChangeGameSetting:
                            this.handleChangeGameSetting(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.GameStart:
                            this.handleGameStart(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.GameInitFinished:
                            this.handleGameInitFinished(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.RollDiceResult:
                            this.handleRollDiceResult(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.UseChanceCard:
                            this.handleUseChanceCard(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.Animation:
                            this.handleAnimationComplete(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.BuyProperty:
                            this.handleBuyProperty(socketClient, socketMessage, clientUserId);
                            break;
                        case SocketMsgType.BuildHouse:
                            this.handleBuildHouse(socketClient, socketMessage, clientUserId);
                            break;
                    }
                });

                socketClient.on("close", () => {
                    this.handleUserDisconnect(clientUserId);
                });

                socketClient.on("error", () => {
                    this.handleUserDisconnect(clientUserId);
                });
            });
        } catch (e: any) {
            throw new Error(e);
        }
    }

    /**
     * 服务器广播(所有客户端都可以收到)
     * @param type 发送的信息类型
     * @param data 发送的信息本体
     * @param msg 可以使客户端触发message组件的信息
     */
    public serverBroadcast(
        type: SocketMsgType,
        data: any,
        msg?: { type: "success" | "warning" | "error" | "info" | ""; content: string }
    ) {
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
    public sendToClient(
        socketClient: WebSocket,
        type: SocketMsgType,
        data: any,
        msg?: { type: "success" | "warning" | "error" | "info"; content: string },
        roomId?: string
    ) {
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
    // private logUserList() {
    // 	const userIdArr = Array.from(this.userList.values());
    // 	const userListStr = userIdArr
    // 		.map((item) => `${color("yellow", item.username)}: ${color("magenta", item.userId)}`)
    // 		.join("\n");
    // 	console.log(`---------当前用户(${this.userList.size}) ---------\n${userListStr}\n------------------------------\n`);
    // }

    // private logRoomList() {
    // 	const roomList = this.getRoomList();
    // 	const roomListStr = roomList
    // 		.map((item) => `${color("yellow", item.ownerName)}: ${color("magenta", item.roomId)}`)
    // 		.join("\n");
    // 	console.log(`---------当前房间(${this.roomList.size}) ---------\n${roomListStr}\n------------------------------\n`);
    // }

    /**
     * 获取当前已连接的用户的名字和id
     * @returns 当前已连接的用户的名字和id
     */
    private getUserList() {
        return Array.from(this.userList.values()).map((user) => ({
            userId: user.userId,
            username: user.username,
            avatar: user.avatar,
            color: user.color,
        }));
    }

    /**
     * 获取当前所有房间的id, 房主的id 和 用户名
     * @returns 当前所有房间的id, 房主的id 和 用户名
     */
    private getRoomList() {
        return Array.from(this.roomList.values()).map((room) => {
            const user = room.getOwner();
            return {
                roomId: room.getRoomId(),
                ownerId: user.userId,
                ownerName: user.username,
                userNum: room.getUserNum()
            };
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

    private startHeartCheck() {
        this.heartCheckInIntervalId = setInterval(() => {
            this.serverBroadcast(SocketMsgType.Heart, Date.now());
        }, 1000);
    }

    private handleUserDisconnect(clientUserId: string) {
        if (this.userList.has(clientUserId)) {
            const roomIdUserIn = this.userInWhichRoom(clientUserId);
            if (roomIdUserIn) {
                const roomUserIn = this.roomList.get(roomIdUserIn) as Room;
                if (roomUserIn.leave(clientUserId)) {
                    //如果用户离开后房间为空
                    this.roomList.delete(roomIdUserIn); //解散房间
                }
                this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
            }
            this.userList.delete(clientUserId);
        }
    }

    private handleUserReconnect(user: User) {
        const roomIdUserIn = this.userInWhichRoom(user.userId); //用户现在在的房间Id
        const roomUserIn = this.roomList.get(roomIdUserIn); //用户在的房间
        roomUserIn && roomUserIn.handleUserReconnect(user);
    }

    private isUserNeedToReconnect(user: User): boolean {
        const roomIdUserIn = this.userInWhichRoom(user.userId); //用户现在在的房间Id
        const roomUserIn = this.roomList.get(roomIdUserIn); //用户现在在的房间
        if (!roomUserIn) return false;
        return roomUserIn.isUserOffLine(user.userId);
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
        if (user) {
            const roomIdToJoin = data.roomId; //用户要加入的房间Id
            //判断请求是否带roomId, 有则处理加入, 无则处理创建;
            if (roomIdToJoin) {
                //	有roomId要加入房间
                const roomIdUserIn = this.userInWhichRoom(user.userId); //用户现在在的房间Id
                const roomToJoin = this.roomList.get(roomIdToJoin); //用户要加入的房间
                if (roomToJoin) {
                    //用户要加入的房间存在
                    if (roomIdUserIn) {
                        this.sendToClient(
                            user.socketClient,
                            SocketMsgType.JoinRoom,
                            "error",
                            {type: "error", content: `你已经在房间内`},
                            roomIdToJoin
                        );
                    } else {
                        //不在某个房间中就走正常加入房间流程
                        if (roomToJoin.join(user)) {
                            this.sendToClient(
                                user.socketClient,
                                SocketMsgType.JoinRoom,
                                "success",
                                {type: "success", content: `成功加入了${roomToJoin.getOwner().username}的房间`},
                                roomIdToJoin
                            );
                            this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); // 有人加入房间后广播房间列表
                        } else {
                            this.sendToClient(
                                user.socketClient,
                                SocketMsgType.JoinRoom,
                                "fail",
                                {type: "warning", content: "你已经在房间内"},
                                roomIdToJoin
                            );
                        }
                    }
                } else {
                    this.sendToClient(socketClient, SocketMsgType.JoinRoom, "fail", {
                        type: "error",
                        content: "房间不存在"
                    });
                }
            } else {
                //	没有roomId就表示要创建房间
                getRoleList(1, 10000).then((res) => {
                    const {roleList} = res;
                    const newRoom = new Room(user, roleList);
                    this.roomList.set(newRoom.getRoomId(), newRoom);
                    this.sendToClient(
                        socketClient,
                        SocketMsgType.JoinRoom,
                        "success",
                        {type: "success", content: "创建房间成功"},
                        newRoom.getRoomId()
                    );
                });
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
                const roomToLeave = this.roomList.get(roomId);
                if (roomToLeave && roomToLeave.leave(clientUserId)) {
                    //如果用户离开后房间为空
                    this.roomList.delete(roomId); //解散房间
                }
                this.sendToClient(socketClient, SocketMsgType.LeaveRoom, "success", {
                    type: "success",
                    content: "你离开了房间",
                });
                this.serverBroadcast(SocketMsgType.RoomList, this.getRoomList()); //广播房间列表
            } else {
                this.sendToClient(socketClient, SocketMsgType.LeaveRoom, "error", {
                    type: "error",
                    content: "非法的房间号"
                });
            }
        }
    }

    private handleRoomChat(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const roomId = data.roomId;
        if (!roomId) return;
        const message = data.data as string;
        const room = this.roomList.get(roomId);
        if (!room) return;
        room.chatBroadcast(message, clientUserId);
    }

    private handleReadyToggle(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        if (this.userList.has(clientUserId)) {
            const roomId = this.userInWhichRoom(clientUserId);
            if (roomId && data.roomId === roomId) {
                const room = this.roomList.get(roomId);
                if (room) {
                    room.readyToggle(clientUserId);
                } else {
                    this.sendToClient(socketClient, SocketMsgType.ReadyToggle, "error", {
                        type: "error",
                        content: "非法的房间号",
                    });
                }
            } else {
                this.sendToClient(socketClient, SocketMsgType.ReadyToggle, "error", {
                    type: "error",
                    content: "不在房间内"
                });
            }
        }
    }

    private handleChangeRole(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        if (this.userList.has(clientUserId)) {
            const roomId = this.userInWhichRoom(clientUserId);
            const room = this.roomList.get(roomId);
            if (room) {
                room.changeRole(clientUserId, data.data);
            }
        }
    }

    private handleChangeGameSetting(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        if (this.userList.has(clientUserId)) {
            const roomId = this.userInWhichRoom(clientUserId);
            const room = this.roomList.get(roomId);
            if (room) {
                room.changeGameSetting(data.data);
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

    private handleGameInitFinished(socketClient: WebSocket, data: SocketMessage, clientUserId: string){
        console.log(`${clientUserId} 加载完成`)
        OperateListener.getInstance().emit(clientUserId, OperateType.GameInitFinished);
    }

    private handleRollDiceResult(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const operateType: OperateType = data.data;
        OperateListener.getInstance().emit(clientUserId, operateType);
    }

    private handleUseChanceCard(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const chanceCardId: string = data.data;
        const targetId: string | string[] = data.extra;
        if (targetId) {
            if (typeof targetId === "string") {
                OperateListener.getInstance().emit(clientUserId, OperateType.UseChanceCard, chanceCardId, [targetId]);
            } else {
                OperateListener.getInstance().emit(clientUserId, OperateType.UseChanceCard, chanceCardId, targetId);
            }
        } else {
            OperateListener.getInstance().emit(clientUserId, OperateType.UseChanceCard, chanceCardId);
        }
    }

    private handleAnimationComplete(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const operateType: OperateType = data.data;
        OperateListener.getInstance().emit(clientUserId, operateType);
    }

    private handleBuyProperty(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const operateType: OperateType = data.data;

        OperateListener.getInstance().emit(clientUserId, operateType, data.extra);
    }

    private handleBuildHouse(socketClient: WebSocket, data: SocketMessage, clientUserId: string) {
        const operateType: OperateType = data.data;
        OperateListener.getInstance().emit(clientUserId, operateType, data.extra);
    }
}

export function createSocketServer() {
}
