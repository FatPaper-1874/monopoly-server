import EventEmitter from "events";
import GameSocketServer from "./src/class/GameSocketServer";

const evenListen = new EventEmitter();
evenListen.setMaxListeners(24);
global.$evenListen = evenListen;
global.$socketServer  = new GameSocketServer();