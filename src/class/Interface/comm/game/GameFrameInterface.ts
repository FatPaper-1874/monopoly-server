import PlayerInfoInterface from './PlayerInfoInterface';
import MapInfoInterface from './MapInfoInterface';
import GameInfoInterface from './GameInfoInterface';

interface GameFrameInterface{
  gameInfo: GameInfoInterface;
  playerInfoList: PlayerInfoInterface[];
  mapInfo: MapInfoInterface;
}

export default GameFrameInterface;