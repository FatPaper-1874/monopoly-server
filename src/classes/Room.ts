import {WebSocket} from "ws";
import {ChangeRoleOperate, ChatMessageType, SocketMsgType} from "../enums/bace";
import {User, SocketMessage, RoomInfo, UserInRoom, ChatMessage, ChatUserInfo} from "../interfaces/bace";
import fs from "fs";
import path from "path";
import {Role} from "../interfaces/bace";
import {GameProcess} from "./GameProcess";
import {GameOverRule} from "../enums/game";
import {GameSetting} from "../interfaces/game";
import {randomString} from "../utils";

export class Room {
    private roomId: string;
    private userList: Map<string, UserInRoom>;
    private ownerId: string;
    // private mapId: string;
    private gameSetting: GameSetting;
    private roleList: Role[];
    private gameProcess: GameProcess | undefined;
    public isStarted: boolean;

    constructor(owner: User, roleList: Role[]) {
        this.roomId = this.newRoomId();
        this.ownerId = owner.userId;
        this.roleList = roleList;
        this.isStarted = false;
        this.userList = new Map();
        this.gameSetting = {
            gameOverRule: GameOverRule.Earn100000,
            initMoney: 20000,
            multiplier: 1,
            multiplierIncreaseRounds: 2,
            mapId: "",
            roundTime: 20,
            diceNum: 2,
        };
        this.join(owner);
    }

    public getRoomId() {
        return this.roomId;
    }

    public getOwner() {
        return {
            userId: this.ownerId,
            username: this.userList.get(this.ownerId)?.username || "",
        };
    }

    public getUserList(): UserInRoom[] {
        return Array.from(this.userList.values());
    }

    public isUserOffLine(userId: string): boolean {
        let res = false;
        //没有这个用户以及游戏尚未开启均判断为不是断线 无需重连
        if (this.hasUser(userId) && this.gameProcess && this.gameProcess.getPlayerIsOffline(userId)) {
            res = true;
        }
        return res;
    }

    public chatBroadcast(content: string, userId: string) {
        if (!content) return;
        const user = this.userList.get(userId);
        if (!user) return;
        const userInfo: ChatUserInfo = {
            userId: user.userId,
            username: user.username,
            avatar: user.avatar,
            color: user.color,
            role: user.role,
            isReady: user.isReady,
        };
        const message: ChatMessage = {
            id: randomString(16),
            type: ChatMessageType.Text,
            content,
            user: userInfo,
            time: Date.now(),
        };
        this.roomBroadcast({
            type: SocketMsgType.RoomChat,
            data: message,
            source: "room",
        });
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
            userList: Array.from(this.userList.values()).map((user) => ({
                userId: user.userId,
                username: user.username,
                isReady: user.isReady,
                color: user.color,
                avatar: user.avatar,
                role: user.role,
            })),
            isStarted: this.isStarted,
            ownerId: this.getOwner().userId,
            ownerName: this.getOwner().username,
            roleList: this.roleList,
            gameSetting: this.gameSetting,
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
        if (this.userList.has(user.userId)) {
            //用户已在房间内
            return false;
        } else {
            const userInRoom: UserInRoom = {
                ...user,
                role: this.roleList[Math.floor(Math.random() * this.roleList.length)],
                isReady: false,
            };
            this.userList.set(user.userId, userInRoom);
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
        //房间中还有更多玩家的情况
        if (this.isStarted) {
            //游戏已经开始，处理断线
            this.handleUserOffline(userId);
            if (this.gameProcess && this.gameProcess.getIsAllPlayerOffline()) {
                //如果所有人都断线了, 解散房间
                this.gameProcess.destroy();
                return true;
            } else {
                return false;
            }
        } else {
            //游戏没有开始，仍在房间页面
            if (this.userList.size === 1) {
                //房间最后一个人退出, 退出后解散房间
                this.userList.delete(userId);
                if (this.gameProcess) this.gameProcess.destroy();
                return true;
            } else {
                if (this.ownerId === userId) {
                    //如果是房主离开, 转移房主
                    this.ownerId = Array.from(this.userList.keys())[0];
                    const owner = this.userList.get(this.ownerId);
                    if (owner) owner.isReady = false;
                }
                this.userList.delete(userId);
                this.roomInfoBroadcast();
                return false;
            }
        }
    }

    public changeRole(_userId: string, operate: ChangeRoleOperate): void {
        const user = this.userList.get(_userId);
        if (user) {
            const roleIndex = this.roleList.findIndex((role) => role.id === user.role.id);
            const newIndex =
                operate === ChangeRoleOperate.Next
                    ? roleIndex + 1 >= this.roleList.length
                        ? 0
                        : roleIndex + 1
                    : roleIndex - 1 < 0
                        ? this.roleList.length - 1
                        : roleIndex - 1;
            user.role = this.roleList[newIndex];

            this.roomInfoBroadcast();
        } else {
            return;
        }
    }

    public changeGameSetting(gameSetting: GameSetting): void {
        this.gameSetting = gameSetting;
        this.roomBroadcast({
            type: SocketMsgType.MsgNotify,
            source: "server",
            data: "error",
            msg: {type: "info", content: "地图设置有变更"},
        });
        this.roomInfoBroadcast();
    }

    public async startGame() {
        if (!Array.from(this.userList).every((item) => item[1].userId == this.ownerId || item[1].isReady)) {
            this.roomBroadcast({
                type: SocketMsgType.GameStart,
                source: "server",
                data: "error",
                msg: {type: "warning", content: "有玩家未准备"},
            });
            return;
        }
        this.gameProcess = new GameProcess(this.gameSetting, this);
        this.isStarted = true;
        await this.gameProcess.start();
        this.isStarted = false;
    }

    /**
     * 获取房间内用户数量
     * @return  用户数量
     */
    public getUserNum() {
        return this.userList.size;
    }

    /**
     * 处理user在游戏时断线
     * @param userId 要查找的用户的id或实例
     */
    private handleUserOffline(userId: string) {
        const user = this.userList.get(userId);
        if (!user) return;
        if (this.gameProcess) {
            this.gameProcess.handlePlayerDisconnect(userId);
        }
        this.roomInfoBroadcast();
    }

    public handleUserReconnect(user: User) {
        const oldUser = this.userList.get(user.userId);
        if (oldUser) {
            oldUser.socketClient = user.socketClient;
            this.roomInfoBroadcast();
            this.gameProcess && this.gameProcess.handlePlayerReconnect(user);
        } else {
            console.log("奇怪的玩家 in room");
        }
    }

    /**
     * 房间中是否存在该用户
     * @param _user 要查找的用户的id或实例
     */
    public hasUser(_user: User | undefined): boolean;
    public hasUser(_user: string): boolean;
    public hasUser(_user: User | undefined | string): boolean {
        if (!_user) return false;
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
}
