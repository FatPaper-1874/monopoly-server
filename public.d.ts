import EventEmitter from "events";
import GameSocketServer from "./src/class/GameSocketServer";

declare global {
	var $socketServer: GameSocketServer;
	var $evenListen: EventEmitter
}

export {};