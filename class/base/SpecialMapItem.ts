import SpecialMapItemInfoInterface from '../Interface/comm/game/SpecialMapItemInfoInterface';
import MapItemInterface from '../Interface/MapItemInterface';
import { newSpecialMapItemId } from '../utils';
import Player from './Player';

class SpecialMapItem implements MapItemInterface{
  private id:string;
  private name:string
  public arrivalEvent: (player: Player) => void;

  constructor(name:string, $arrivalEvent: (player: Player) => void){
    this.id = newSpecialMapItemId();
    this.name = name;
    this.arrivalEvent = $arrivalEvent;
  }

  getMapItemInfo():SpecialMapItemInfoInterface{
    return{
      id: this.id,
      name: this.name,
      color: "#ffffff",
    }
  };
}

export default SpecialMapItem;