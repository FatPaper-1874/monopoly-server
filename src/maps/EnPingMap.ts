import MapInterface from "../class/Interface/MapInterface";
import MapItemInterface from "../class/Interface/MapItemInterface";
import RealEstateInterface from "../class/Interface/RealEstateInterface";
import RealEstate from "../class/base/RealEstate";
import MapInfoInterface from "../class/Interface/comm/game/MapInfoInterface";
import SpecialMapItem from "../class/base/SpecialMapItem";
import ChanceCard from '../class/base/ChanceCard';

const mapInfo = [
	{ name: "金泉酒店", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "湿地公园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "中山公园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "冯如广场", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "昌大昌", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "金沙", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "御景湾", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "御锦珑湾", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "锦绣家园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "金汇豪庭", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "德昌豪苑", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "绿岛华庭", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "中澳豪庭", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "金湖城花园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "君汇上城", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "锦绣香江", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "国际新城", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "一小长提", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "乔峰派出所", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "人民医院", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "五邑中医院", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "神话俱乐部", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "锦江市场", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "东安市场", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "河南市场", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "鳌峰山", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "恩平图书馆", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "百兽园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "二运车站", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "汽车总站", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "奶茶先生", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "恩平一中", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "碧桂园", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "仙龙肠粉", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "华润万家", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "好万家", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "鸿富超市", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
	{ name: "金蝴蝶", buy: 10, build: 10, pass: 10, oneHouse: 10, towHouse: 10, villa: 10, color: "#66ccff" },
];

function getMapItemListFromJson(): RealEstateInterface[] {
	return mapInfo.map((item) => {
		const m: RealEstateInterface = {
			name: item.name,
			costList: {
				buy: item.buy,
				build: item.build,
				pass: item.pass,
				oneHouse: item.oneHouse,
				towHouse: item.towHouse,
				villa: item.villa,
			},
			color: item.color,
		};
		return m;
	});
}

class EnPingMap implements MapInterface {
	mapItemList: MapItemInterface[];

	constructor() {
		this.mapItemList = getMapItemListFromJson().map((item) => {
			return new RealEstate(item);
		});
		this.addMapItem(
			0,
			new SpecialMapItem("起点", (player) => {
				player.gainMoney(1000);
			})
		);
		this.addMapItem(
			13,
			new SpecialMapItem("监仓", (player) => {
				player.setStop(true);
			})
		);
		this.addMapItem(
			21,
			new SpecialMapItem("福利彩票", (player) => {
				// player.gainChanceCard()
			})
		);
		this.addMapItem(
			34,
			new SpecialMapItem("浪波湾", (player) => {
				// player.gainChanceCard()
			})
		);
	}

	public getMapInfo(): MapInfoInterface {
		return {
			mapItemList: this.mapItemList.map((item) => {
				return item.getMapItemInfo();
			}),
		};
	}

	private addMapItem(index: number, mapItem: MapItemInterface) {
		this.mapItemList.splice(index, 0, mapItem);
	}
}

export default EnPingMap;
