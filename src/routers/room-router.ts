import { Router } from "express";
import { ResInterface } from "src/interfaces/res";

export const roomRouter = Router();
const heartContinuationTimeMs = 60000; //1分钟的持续时间, 如果一分钟内没有发送心跳, 删除房间;
const roomMap = new Map<string, { hostPeerId: string | null; deleteTime: number }>();

//删除房间定时器
setInterval(() => {
	Array.from(roomMap.entries()).forEach((room) => {
		if (room[1].deleteTime < Date.now()) {
			roomMap.delete(room[0]);
		}
	});
}, heartContinuationTimeMs * 2); //仁慈的, 取消房间时间计时器翻倍

// 定时输出 Map 的内容
setInterval(() => {
	console.clear();
	console.log("Current Time:");
	console.log(Date.now());
	console.log("Current Map Content:");
	for (const r of roomMap) {
		console.dir(r);
	}
}, 1000);

roomRouter.get("/join", async (req, res, next) => {
	const { roomId } = req.query as { roomId: string };
	if (roomId && roomId.length < 13) {
		if (roomMap.has(roomId)) {
			//有roomId的话
			const room = roomMap.get(roomId);
			if (room && room.hostPeerId !== null) {
				const resMsg: ResInterface = {
					status: 200,
					data: { hostPeerId: room.hostPeerId, needCreate: false },
				};
				res.status(resMsg.status).json(resMsg);
			} else {
				const resMsg: ResInterface = {
					status: 202,
					msg: "服务器正在与房主建立联系, 请稍后重试...",
				};
				res.status(resMsg.status).json(resMsg);
			}
		} else {
			//创建房间
			roomMap.set(roomId, { hostPeerId: null, deleteTime: Date.now() + heartContinuationTimeMs });
			const resMsg: ResInterface = {
				status: 200,
				data: { hostPeerId: "", needCreate: true, deleteIntervalMs: heartContinuationTimeMs },
			};
			res.status(resMsg.status).json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 400,
			msg: "RoomId不符合标准",
		};
		res.status(resMsg.status).json(resMsg);
	}
});

roomRouter.post("/emit-host", async (req, res, next) => {
	const { roomId, hostPeerId } = req.body as { roomId: string; hostPeerId: string };
	if (roomId && hostPeerId) {
		if (roomMap.has(roomId)) {
			roomMap.set(roomId, { hostPeerId, deleteTime: Date.now() + heartContinuationTimeMs });
			const resMsg: ResInterface = {
				status: 200,
			};
			res.status(resMsg.status).json(resMsg);
		} else {
			const resMsg: ResInterface = {
				status: 400,
				msg: "RoomId不存在",
			};
			res.status(resMsg.status).json(resMsg);
		}
	} else {
		const resMsg: ResInterface = {
			status: 400,
			msg: "RoomId不符合标准",
		};
		res.status(resMsg.status).json(resMsg);
	}
});

roomRouter.get("/heart", async (req, res, next) => {
	const { roomId } = req.query as { roomId: string };
	const room = roomMap.get(roomId);
	if (room) {
		room.deleteTime += heartContinuationTimeMs;
	}
	res.status(200).end();
});
