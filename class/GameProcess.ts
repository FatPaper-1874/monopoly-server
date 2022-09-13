import Dice from "./base/Dice";
import Player from "./base/Player";
import RealEstate from "./base/RealEstate";
import { GameOverRule } from "./enums/GameRules";

export default class GameProcess {
	private currentRound: number = 0; //当前回合
	private currentPlayerIndex: number = 0;	//当前玩家回合
	private initEveryPlayerMoney: number = 0;  //玩家初始金钱
  private gameOverRule: number = GameOverRule.OnePlayerGoBroke; //游戏结束条件(默认一位玩家破产)
	private dice: Dice;

	private playerList: Array<Player> = [];
	private realEstateList: Array<RealEstate> = [];


	constructor(playerList: Array<Player>, initEveryPlayerMoney: number, gameOverRule: GameOverRule, diceNum: number) {
		this.playerList = playerList;
		this.initEveryPlayerMoney = initEveryPlayerMoney;
		this.gameOverRule = gameOverRule;

		this.dice = new Dice(diceNum);	//实例化骰子

		this.giveEveryPlayerMoney(initEveryPlayerMoney);	//初始化金钱
	}

	//给所有玩家pang钱
	giveEveryPlayerMoney(money: number){
		this.playerList.forEach(item => {
			item.gainMoney(money);
		})
	}

  startGame() {
    while(1){

		}
  };
}
