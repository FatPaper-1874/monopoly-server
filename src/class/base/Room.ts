import { GameOverRule } from "../enums/GameRules";
import GameProcess from "../GameProcess";
import RoomInfoInterface from "../Interface/comm/room/RoomInfoInterface";
import Player from "./Player";

class Room {
	private id: string;
	private owner: Player;
	private playerList: Array<Player>;
	private gameProcess!: GameProcess;

	constructor(id: string, owner: Player) {
		this.id = id;
		this.owner = owner;
		this.playerList = [];
	}

	public getId() {
		return this.id;
	}

	public getPlayerList() {
		return this.playerList;
	}

	public getOwner() {
		return this.owner;
	}

	public getInfo(): RoomInfoInterface {
		return { roomId: this.getId(), owner: this.getOwner().getName(), ownerId: this.getOwner().getId(), playerList: this.getPlayerList().map((player) => player.getInfo()) };
	}

	public join(player: Player) {
		if (this.playerList.findIndex((item) => item.getId() === player.getId()) == -1) {
			this.playerList.push(player); //防止同一个玩家再次加入
		}
	}

	public leave(playerId: string) {
		const leavePlayerIndex = this.playerList.findIndex((itme) => itme.getId() === playerId);
		if (leavePlayerIndex === -1) return;
		this.playerList.splice(leavePlayerIndex, 1);

		if (!this.hasOwner() && this.playerList.length > 0) {
			this.owner = this.playerList[0];
			if (this.gameProcess) this.gameProcess.gameFrameRadio();
		}
	}

	private hasOwner() {
		return this.hasPlayerById(this.owner.getId());
	}

	public hasPlayerById(playerId: string) {
		const leavePlayerIndex = this.playerList.findIndex((itme) => itme.getId() === playerId);
		if (leavePlayerIndex === -1) return false;
		return true;
	}

	public isEmpty() {
		return this.playerList.length == 0;
	}

	public startGame() {
		this.gameProcess = new GameProcess(this.id, this.playerList, 1000, GameOverRule.OnePlayerGoBroke, 2);
	}
}

export default Room;
