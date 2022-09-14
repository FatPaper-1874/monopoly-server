import PlayerInfoInterface from './PlayerInfoInterface';
import MapInfoInterface from './MapInfoInterface';

interface GameFrameInterface{
  playerInfoList: PlayerInfoInterface[];
  mapInfo: MapInfoInterface;
}

export default GameFrameInterface;