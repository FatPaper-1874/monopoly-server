import CommTypes from '../enums/CommTypes';
import MapItemTypes from '../enums/MapItemTypes';
import CommInterface from '../Interface/comm/CommInterface';
import SpecialMapItemInfoInterface from '../Interface/comm/game/SpecialMapItemInfoInterface';
import MapItemInterface from '../Interface/MapItemInterface';
import { newSpecialMapItemId } from '../utils';
import Player from './Player';

class SpecialMapItem implements MapItemInterface{
  type: MapItemTypes = MapItemTypes.SpecialItem;
  private id:string;
  private name:string
  private ownArrivalEvent: (player:Player)=>void;

  constructor(name:string, $arrivalEvent: (player: Player) => void){
    this.id = newSpecialMapItemId();
    this.name = name;
    this.ownArrivalEvent = $arrivalEvent;
  }

  getMapItemInfo():SpecialMapItemInfoInterface{
    return{
      id: this.id,
      name: this.name,
      color: "#ffffff",
    }
  };
  
  public arrivalEvent(player: Player){
    const specialEventMsg: CommInterface = {
			//填写广播的信息
			type: CommTypes.SpecialEvent,
			msg: {
				sourceId: this.id,
				targetId: "",
				data: "warn",
				extra: "你到达了" + this.name,
			},
		};
    $socketServer.sendMsgToOneClientById(player.getId(), specialEventMsg);
    this.ownArrivalEvent(player);
  };
}

export default SpecialMapItem;