import axios from "axios";
import { __USERSERVERHOST__ } from "../../../global.config";

let publicKey = "";

export async function getPublicKey() {
	const maxRetry = 10;
	const timeout = 5000;

	let _retryNum = 0;
	while (!publicKey && _retryNum < maxRetry) {
		try {
			console.log("请求")
			publicKey = (await axios.get(`${__USERSERVERHOST__}/user/public-key`)).data.data;
		} catch (e: any) {
			console.log("retry")
			await new Promise((resolve, reject)=>{setTimeout(resolve,timeout)});
			_retryNum++;
		}
	}
	if(_retryNum >= maxRetry) throw new Error("获取user服务器公钥失败");
	return publicKey;
}
