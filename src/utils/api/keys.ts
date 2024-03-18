import axios from "axios";
import { __USERSERVERHOST__ } from "../../../global.config";

let publicKey = "";

export async function getPublicKey() {
	if (!publicKey) publicKey = (await axios.get(`${__USERSERVERHOST__}/user/public-key`)).data.data;
	return publicKey;
}
