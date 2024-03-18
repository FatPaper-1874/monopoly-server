import axios from "axios";
import { WXAPPID, WXAPPSECRET } from "../../static";
import * as crypto from "crypto";

let wxAccessToken = "";
let expiresTime = 0;

const SecretKey = "Fat_PaperLoveMinecraft";
const KEY = crypto.scryptSync(SecretKey, "salt", 24);
const InitVector = Buffer.alloc(16, 0);

async function updateWxAccessToken() {
	const res = await axios.get(
		`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WXAPPID}&secret=${WXAPPSECRET}`
	);
	return res.data as { access_token: string; expires_in: number };
}

async function getWxAccessToken() {
	if (expiresTime < Date.now()) {
		const res = await updateWxAccessToken();
		expiresTime = Date.now() + res.expires_in;
		wxAccessToken = res.access_token;
	}
	return wxAccessToken;
}

type CodeQuery = {
	scene?: string; //最大32个可见字符，只支持数字，大小写英文以及部分特殊字符：!#$&'()*+,/:;=?@-._~，其它字符请自行编码为合法字符（因不支持%，中文无法使用 urlencode 处理，请使用其他编码方式）
	page?: string; //默认是主页，页面 page，例如 pages/index/index，根路径前不要填加 /，不能携带参数（参数请放在scene字段里），如果不填写这个字段，默认跳主页面。scancode_time为系统保留参数，不允许配置
	check_path?: boolean; //默认是true，检查page 是否存在，为 true 时 page 必须是已经发布的小程序存在的页面（否则报错）；为 false 时允许小程序未发布或者 page 不存在， 但page 有数量上限（60000个）请勿滥用。
	env_version?: string; //要打开的小程序版本。正式版为 "release"，体验版为 "trial"，开发版为 "develop"。默认是正式版。
	width?: number; //默认430，二维码的宽度，单位 px，最小 280px，最大 1280px
	auto_color?: boolean; //自动配置线条颜色，如果颜色依然是黑色，则说明不建议配置主色调，默认 false
	line_color?: object; //默认是{"r":0,"g":0,"b":0} 。auto_color 为 false 时生效，使用 rgb 设置颜色 例如 {"r":"xxx","g":"xxx","b":"xxx"} 十进制表示
	is_hyaline?: boolean; //默认是false，是否需要透明底色，为 true 时，生成透明底色的小程序
};

export async function getWxMiniprogramCode(query: CodeQuery): Promise<string> {
	const res = await axios({
		url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${await getWxAccessToken()}`,
		method: "POST",
		data: { ...query },
		responseType: "arraybuffer",
	});
	return res.data;
}

export async function getWxOpenId(code: string) {
	const res = await axios({
		url: `https://api.weixin.qq.com/sns/jscode2session?appid=${WXAPPID}&secret=${WXAPPSECRET}&js_code=${code}&grant_type=authorization_code`,
		method: "get",
	});

	return res.data.openid;
}

export function encryptSignatureToUuid(signature: string): string {
	const cipher = crypto.createCipheriv("aes-192-cbc", KEY, InitVector);
	let crypted = cipher.update(signature, "utf8", "hex");
	crypted += cipher.final("hex");
	return crypted;
}

export function decryptSignatureFromUuid(encryptedSignature: string): string {
	const decipher = crypto.createDecipheriv("aes-192-cbc", KEY, InitVector);
	let decrypted = decipher.update(encryptedSignature, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}
