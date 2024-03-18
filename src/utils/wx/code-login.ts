import { decryptSignatureFromUuid, encryptSignatureToUuid } from ".";
import { randomString } from "..";

const SignaturePool: Map<string, string | undefined> = new Map();
const SignatureExpiresTimePool: Map<string, number> = new Map();

const EXPIRESTIME = 180000; //三分钟过期
// const EXPIRESTIME = 300000000; //三分钟过期
const CLEANTIMER = 1000; //一秒清理一次

export function createNewSignature() {
	let newSignature = randomString(16);
	while (SignaturePool.has(newSignature)) {
		newSignature = randomString(16);
	}
	const uuid = encryptSignatureToUuid(newSignature);
	SignaturePool.set(newSignature, undefined);

	SignatureExpiresTimePool.set(newSignature, EXPIRESTIME + Date.now());
	return { newSignature, uuid };
}

export function deleteSignatureByUuid(uuid: string) {
	SignaturePool.delete(decryptSignatureFromUuid(uuid));
}

export function hasSigature(s: string) {
	return SignaturePool.has(s);
}

export function setSigatureToken(s: string, token: string) {
	SignaturePool.set(s, token);
}

export function isUuidExpires(uuid: string) {
	return !hasSigature(decryptSignatureFromUuid(uuid));
}

export function getTokenByUuid(uuid: string) {
	return SignaturePool.get(decryptSignatureFromUuid(uuid));
}

function cleanOutdatedSignature() {
	Array.from(SignatureExpiresTimePool.keys()).forEach((k) => {
		const expiresTime = SignatureExpiresTimePool.get(k);
		if (expiresTime && expiresTime < Date.now()) {
			SignaturePool.delete(k);
			SignatureExpiresTimePool.delete(k);
		}
	});
}

setInterval(cleanOutdatedSignature, CLEANTIMER);
