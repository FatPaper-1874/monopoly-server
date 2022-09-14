import Player from "../base/Player";
import RealEstateInfoInterface from "./comm/game/RealEstateInfoInterface";
import SpecialMapItemInfoInterface from "./comm/game/SpecialMapItemInfoInterface";

interface MapItemInterface {
	arrivalEvent: (player: Player) => void;
	getMapItemInfo: () => RealEstateInfoInterface | SpecialMapItemInfoInterface;
}

export default MapItemInterface;
