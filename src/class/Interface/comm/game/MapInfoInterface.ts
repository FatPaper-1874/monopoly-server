import RealEstateInfoInterface from "./RealEstateInfoInterface";
import SpecialMapItemInfoInterface from "./SpecialMapItemInfoInterface";

interface MapInfoInterface {
	mapItemList: Array<RealEstateInfoInterface | SpecialMapItemInfoInterface>;
}

export default MapInfoInterface;
