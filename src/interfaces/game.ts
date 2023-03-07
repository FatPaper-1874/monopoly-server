import { Player } from "../classes/Play";
import { Property } from "../classes/Property";
import { GameOverRule } from "../enums/game";
import { MapItem, Role, User } from "./bace";

export interface GameProcessSetting {
	gameOverRule: GameOverRule; //游戏结束的判定规则
	initMoney: number; //初始金钱
	multiplier: number; //倍率涨幅
	multiplierIncreaseRounds: number; //上涨的回合数(隔x个回合上涨一次倍率)
	roundTime: number;
	mapName: string;
	diceNum: number;
}

export interface PropertyInterface {
	getId: () => string;
	getName: () => string;
	getBuildingLevel: () => number;
	getSellCost: () => number;
	getCost_lv0: () => number;
	getCost_lv1: () => number;
	getCost_lv2: () => number;
	getOwner: () => {
		id: string;
		name: string;
	};
}

export interface PlayerInterface {
	getUser: () => User;
	getMoney: () => number;
	getProperties: () => PropertyInterface[];
	getCards: () => ChanceCardInterface[];
	getPositionIndex: () => number;
	setStop: (stop: boolean) => void;
	getIsStop: () => boolean;
}

export interface ChanceCardInterface {
	getId: () => string;
	getName: () => string;
	getDescribe: () => string;
	getIcon: () => string;
	use: (sourcePlayer: Player, target: Player | Property | Player[] | Property[]) => void;
}

export interface UserInfoClient {
	userId: string;
	username: string;
	isReady: boolean;
	avatar: string;
	color: string;
	role: Role;
}

export interface PropertyInfo {
	id: string;
	name: string;
	buildingLevel: number;
	sellCost: number;
	cost_lv0: number;
	cost_lv1: number;
	cost_lv2: number;
	owner: {
		id: string;
		name: string;
	};
}

export interface PlayerInfo {
	user: UserInfoClient;
	money: number;
	properties: PropertyInfo[];
	cards: ChanceCardInfo[];
	positionIndex: number;
	isStop: boolean;
}

export interface ChanceCardInfo {
	id: string;
	name: string;
	describe: string;
	icon: string;
}

export interface GameInitInfo {
	mapData: MapItem[];
	mapIndex: string[];
	playerList: PlayerInfo[];
	properties: PropertyInfo[];
	chanceCards: ChanceCardInfo[];
}

export interface GameInfo {
	playerList: PlayerInfo[];
	properties: PropertyInfo[];
}
