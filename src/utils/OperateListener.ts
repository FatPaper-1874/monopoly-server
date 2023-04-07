import EventEmitter from "events";
import { OperateType } from "../enums/game";

export class OperateListener {
	private static instance: OperateListener;
	private eventEmitter: EventEmitter;

	private constructor() {
		this.eventEmitter = new EventEmitter();
	}

	static getInstance() {
		if (!this.instance) {
			this.instance = new OperateListener();
		}
		return this.instance;
	}

	public onAsync(playerId: string, eventType: OperateType, listener: (args: any[]) => void) {
		this.eventEmitter.on(`${playerId}-${eventType}`, listener);
	}

	public on(playerId: string, eventType: OperateType, listener: (args: any[]) => void): Promise<any[]> {
		return new Promise((resolve, reject) => {
			console.log(`新增监听器-${playerId}-${eventType}`);
			this.eventEmitter.once(`${playerId}-${eventType}`, (args: any[]) => {
				listener(args);
				resolve(args);
			});
		});
	}

	public remove(playerId: string, eventType: OperateType, callback: (...args: any[]) => void) {
		this.eventEmitter.removeListener(`${playerId}-${eventType}`, callback);
	}

	public removeAll(playerId: string, eventType: OperateType) {
		this.eventEmitter.removeAllListeners(`${playerId}-${eventType}`);
	}

	public emit(playerId: string, eventType: OperateType, ...args: any[]): boolean {
		console.log(`监听器触发-${playerId}-${eventType}`);
		return this.eventEmitter.emit(`${playerId}-${eventType}`, args);
	}

	public showListeners(playerId: string, eventType: OperateType) {
		console.log(this.eventEmitter.listeners(`${playerId}-${eventType}`));
	}
}
