function newRoomId() {
	return "room-xxxx-9xxx".replace(/[x]/g,  (c) => {
		const r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

export {
  newRoomId,
}