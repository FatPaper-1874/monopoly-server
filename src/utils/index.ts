export function randomColor() {
	const H = Math.random();
	const S = Math.random();
	const L = 0.5;
	let ret = [H, S, L];
	ret[1] = 0.7 + ret[1] * 0.2; // [0.7 - 0.9] 排除过灰颜色

	// 数据转化到小数点后两位
	ret = ret.map(function (item) {
		return parseFloat(item.toFixed(2));
	});

	let R, G, B;

	const hue2rgb = (p: any, q: any, t: any) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};

	let Q = L < 0.5 ? L * (1 + S) : L + S - L * S;
	let P = 2 * L - Q;
	R = hue2rgb(P, Q, H + 1 / 3) * 255;
	G = hue2rgb(P, Q, H) * 255;
	B = hue2rgb(P, Q, H - 1 / 3) * 255;

	return `rgb(${parseFloat(R.toFixed(2))}, ${parseFloat(G.toFixed(2))}, ${parseFloat(B.toFixed(2))})`;
}
