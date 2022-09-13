import { ChanceCardTypes } from "../enums/ChanceCardTypes";
import Player from "./Player";
import RealEstate from "./RealEstate";

class ChanceCard {
	private name: string;  //机会卡名称
  private describe: string; //机会卡描述信息
	private type: ChanceCardTypes = ChanceCardTypes.ToOnePlayer;  //机会卡对象类型
  private effectFunction: Function; //机会卡触发函数

  constructor(name: string, describe: string, type: ChanceCardTypes, effectFunction: Function){
    this.name = name;
    this.describe = describe;
    this.type = type;
    this.effectFunction = effectFunction;
  }

	effect(...args: [effectObjectSource: Player | RealEstate, effectObjectTarget: Player | RealEstate]) {
    if(args.length > 1){
      this.effectFunction(args[0], args[1]);
    } else {
      this.effectFunction(args[0]);
    }
  }
}

export default ChanceCard;