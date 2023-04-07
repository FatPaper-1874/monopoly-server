import jwt from "jsonwebtoken";
const TOKENKEY = "Fat_PaperLoveMinecraft";

export const setToken = (username: string, userId: string) => {
	return new Promise((resolve, reject) => {
		const token = jwt.sign(
			{
				username,
				userId,
			},
			TOKENKEY,
			{ expiresIn: "1 day" }
		);
		resolve(token);
	});
};

export const verToken = (token: string) => {
	try {
		const info = jwt.verify(token.split(" ")[1], TOKENKEY);
		return info;
	} catch (err: any) {
		if (err) {
			if (err.name === "TokenExpiredError") {
				throw Error("token过期");
			} else if (err.name === "UnauthorizedError") {
				throw Error("token无效");
			}
		}
	}
};
