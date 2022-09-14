import MapItemInterface from "./MapItemInterface";
import MapInfoInterface from "./comm/game/MapInfoInterface";

interface MapInterface {
	mapItemList: MapItemInterface[];

	getMapInfo: () => MapInfoInterface;
}

export default MapInterface;
