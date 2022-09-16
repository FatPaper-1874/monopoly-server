import Player from "../base/Player";
import MapItemTypes from '../enums/MapItemTypes';
import RealEstateInfoInterface from "./comm/game/RealEstateInfoInterface";
import SpecialMapItemInfoInterface from "./comm/game/SpecialMapItemInfoInterface";

interface MapItemInterface {
	type: MapItemTypes,
	arrivalEvent: (player: Player) => void;
	getMapItemInfo: () => RealEstateInfoInterface | SpecialMapItemInfoInterface;
}

export default MapItemInterface;
