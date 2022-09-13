import Player from "./Player";
import RoomInfoInterface from '../Interface/RoomInfoInterface';

class Room {
	private id: string;
	private owner: Player;
	private playerList: Array<Player>;

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

	public getInfo():RoomInfoInterface{
		return { roomId: this.getId(), owner: this.getOwner().getName(), ownerId: this.getOwner().getId(), playerList: this.getPlayerList().map(player => player.getInfo()) };
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
		if (!this.hasOwner() && this.playerList.length > 0) this.owner = this.playerList[0];
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
}

export default Room;
