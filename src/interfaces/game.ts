import { Player } from "../classes/Player";
import { Property } from "../classes/Property";
import { GameOverRule } from "../enums/game";
import { ItemType, MapItem, Role, Street, User } from "./bace";
import { ChanceCard } from "../classes/ChanceCard";
import { ChanceCardType } from "@/enums/bace";

export interface GameSetting {
	gameOverRule: GameOverRule; //游戏结束的判定规则
	initMoney: number; //初始金钱
	multiplier: number; //倍率涨幅
	multiplierIncreaseRounds: number; //上涨的回合数(隔x个回合上涨一次倍率)
	roundTime: number;
	mapId: string;
	diceNum: number;
}

export interface PropertyInterface {
	//房产信息
	getId: () => string;
	getName: () => string;
	getBuildingLevel: () => number;
	getBuildCost: () => number;
	getSellCost: () => number;
	getCost_lv0: () => number;
	getCost_lv1: () => number;
	getCost_lv2: () => number;
	getOwner: () => { id: string; name: string; color: string; avatar: string } | undefined;
	getPassCost: () => number;

	//设置房产信息
	setOwner: (player: Player) => void;
	buildUp: () => void;
}

export interface PlayerInterface {
	//玩家信息
	getUser: () => User;
	getId: () => string;
	getName: () => string;

	//地产相关
	getPropertiesList: () => PropertyInterface[];
	setPropertiesList: (newPropertiesList: Property[]) => void;
	gainProperty: (property: Property) => void;
	loseProperty: (propertyId: string) => void;

	//机会卡相关
	getCardsList: () => ChanceCard[];
	setCardsList: (newChanceCardList: ChanceCard[]) => void;
	gainCard: (card: ChanceCard) => void;
	loseCard: (cardId: string) => void;

	//钱相关
	setMoney: (money: number) => void;
	getMoney: () => number;
	cost: (money: number) => boolean;
	gain: (money: number) => number;

	//游戏相关
	setStop: (stop: number) => void;
	getStop: () => number;
	setPositionIndex: (newIndex: number) => void;
	getPositionIndex: () => number;
}

export interface ChanceCardInterface {
	getId: () => string;
	getName: () => string;
	getDescribe: () => string;
	getIcon: () => string;
	getType: () => ChanceCardType;
	getColor: () => string;
	getEffectCode: () => string;
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
	buildCost: number;
	sellCost: number;
	cost_lv0: number;
	cost_lv1: number;
	cost_lv2: number;
	owner?: {
		id: string;
		name: string;
		color: string;
		avatar: string;
	};
}

export interface PlayerInfo {
	id: string;
	user: UserInfoClient;
	money: number;
	properties: PropertyInfo[];
	chanceCards: ChanceCardInfo[];
	positionIndex: number;
	isStop: number;
}

export interface ChanceCardInfo {
	id: string;
	name: string;
	describe: string;
	color: string;
	type: ChanceCardType;
	icon: string;
}

export interface GameInitInfo {
	mapId: string;
	mapName: string;
	mapItemsList: MapItem[];
	mapIndexList: string[];
	itemTypesList: ItemType[];
	playerList: PlayerInfo[];
	properties: PropertyInfo[];
	chanceCards: ChanceCardInfo[];
	streetsList: Street[];
	currentPlayerInRound: string;
	currentRound: number;
	currentMultiplier: number;
}

export interface GameInfo {
	currentPlayerInRound: string;
	currentRound: number;
	currentMultiplier: number;
	playerList: PlayerInfo[];
	properties: PropertyInfo[];
}
