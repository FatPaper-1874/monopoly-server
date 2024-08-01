import {Role, SocketMessage, User, UserInRoom} from "../interfaces/bace";
import {PlayerInfo, PlayerInterface, UserInfoClient} from "../interfaces/game";
import {ChanceCard} from "./ChanceCard";
import {Property} from "./Property";
import {SocketMsgType} from "../enums/bace";
import {PlayerEvents} from "../enums/game";

export class Player implements PlayerInterface {
    private user: UserInRoom;
    private money: number;
    private properties: Property[];
    private chanceCards: ChanceCard[];
    private positionIndex: number; //所在棋盘格子的下标
    private isStop: number; //是否停止回合
    private isBankrupted: boolean; //是否破产
    private isOffline: boolean; //是否断线

    private callBackMap: Map<PlayerEvents, { fn: Function; isOnce: boolean }[]> = new Map();

    constructor(user: UserInRoom, initMoney: number, initPositionIndex: number) {
        this.user = user;
        this.money = initMoney;
        this.properties = [];
        this.chanceCards = [];
        this.positionIndex = initPositionIndex;
        this.isStop = 0;
        this.isOffline = false;
    }

    //玩家信息相关
    public getUser = () => this.user;

    public getId = () => this.user.userId;

    public getName = () => this.user.username;

    public getIsOffline = () => this.isOffline;

    public setIsOffline = (isOffline: boolean) => (this.isOffline = isOffline);

    //地产相关
    public getPropertiesList = () => {
        this.emit(PlayerEvents.GetPropertiesList);
        return this.properties
    };
    public setPropertiesList = (newPropertiesList: Property[]) => {
        this.emit(PlayerEvents.SetPropertiesList, newPropertiesList);
        this.properties = newPropertiesList;
    };

    public gainProperty = (property: Property) => {
        this.emit(PlayerEvents.GainProperty, property);
        property.setOwner(this);
        this.properties.push(property);
    };

    public loseProperty = (propertyId: string) => {
        this.emit(PlayerEvents.LoseProperty, propertyId);
        const index = this.properties.findIndex((property) => property.getId() === propertyId);
        if (index != -1) {
            this.properties.splice(index, 1);
        }
    };

    //机会卡相关
    public getCardsList = () => {
        this.emit(PlayerEvents.GetCardsList);
        return this.chanceCards
    };

    public setCardsList = (newChanceCardList: ChanceCard[]) => {
        this.emit(PlayerEvents.SetCardsList, newChanceCardList);
        this.chanceCards = newChanceCardList;
    };

    public getCardById = (id: string) => {
        const index = this.chanceCards.findIndex((card) => card.getId() === id);
        return this.chanceCards[index] || undefined;
    }

    public gainCard = (card: ChanceCard) => {
        this.emit(PlayerEvents.GainCard, card);
        if (this.chanceCards.length < 4) {
            this.chanceCards.push(card);
        } else {
            const msg: SocketMessage = {
                type: SocketMsgType.MsgNotify,
                data: "",
                source: "server",
                msg: {type: "warning", content: "你的机会卡已满，新获得的机会卡将销毁"}
            }
            this.send(msg)
        }
    };

    public loseCard = (cardId: string) => {
        this.emit(PlayerEvents.LoseCard, cardId);
        const index = this.chanceCards.findIndex((card) => card.getId() === cardId);
        console.log(`${this.getName()}---${cardId}---${index}`)
        if (index != -1) {
            this.chanceCards.splice(index, 1);
        }
    };

    //钱相关
    public getMoney = () => {
        this.emit(PlayerEvents.GetMoney);
        return this.money
    };

    public setMoney = (money: number) => {
        this.emit(PlayerEvents.SetMoney, money);
        this.money = money;
    };

    public cost(money: number) {
        this.emit(PlayerEvents.Cost, money);
        this.money -= money;
        return this.money > 0;
    }

    public gain(money: number) {
        this.emit(PlayerEvents.Gain, money);
        this.money += money;
        return this.money;
    }

    //游戏相关
    public setStop = (stop: number) => {
        this.emit(PlayerEvents.SetStop, stop);
        this.isStop = stop;
    };

    public getStop = () => {
        this.emit(PlayerEvents.GetStop);
        return this.isStop;
    };

    public setPositionIndex = (newPositionIndex: number) => {
        this.positionIndex = newPositionIndex;
    }

    public getPositionIndex = () => {
        return this.positionIndex;
    };

    public walk = (step: number) => {
        this.emit(PlayerEvents.Walk, step);
    }

    public tp = (positionIndex: number) => {
        this.emit(PlayerEvents.Tp, positionIndex);
    }

    public setBankrupted = (isBankrupted: boolean) => {
        this.emit(PlayerEvents.SetBankrupted, isBankrupted);
        this.isBankrupted = isBankrupted;
    };

    public getIsBankrupted = () => {
        this.emit(PlayerEvents.GetIsBankrupted);
        return this.isBankrupted
    };

    public getPlayerInfo(): PlayerInfo {
        const {socketClient, ...userInfo} = this.user;
        const playerInfo: PlayerInfo = {
            id: this.user.userId,
            user: userInfo,
            money: this.money,
            properties: this.properties.map((property) => property.getPropertyInfo()),
            chanceCards: this.chanceCards.map((card) => card.getChanceCardInfo()),
            positionIndex: this.positionIndex,
            stop: this.isStop,
            isBankrupted: this.isBankrupted,
            isOffline: this.isOffline,
        };
        return playerInfo;
    }

    public addEventListener(eventName: PlayerEvents, fn: Function, once: boolean = false) {
        if (!this.callBackMap.has(eventName)) {
            this.callBackMap.set(eventName, []);
        }
        const fnArr = this.callBackMap.get(eventName);
        fnArr && fnArr.push({fn, isOnce: once});
    }

    private emit(eventName: PlayerEvents, ...args: any[]) {
        const fnArr = this.callBackMap.get(eventName);
        if (fnArr) {
            for (let index = 0; index < fnArr.length; index++) {
                const fobj = fnArr[index];
                fobj.fn.apply(this, args);
                if (fobj.isOnce) {
                    fnArr.splice(index, 1);
                    index--;
                }
            }
        }
    }

    public remove(eventName: PlayerEvents, fn: Function) {
        const fnArr = this.callBackMap.get(eventName);
        if (fnArr) {
            const removeIndex = fnArr.findIndex((fobj) => fobj.fn === fn);
            fnArr.splice(removeIndex, 1);
        }
    }

    public removeAll(eventName: PlayerEvents) {
        if (this.callBackMap.has(eventName)) this.callBackMap.delete(eventName);
    }

    /**
     * 向指定客户端发送信息
     * @param msgToSend
     */
    public send(msgToSend: SocketMessage) {
        this.user.socketClient.send(JSON.stringify(msgToSend));
    }
}
