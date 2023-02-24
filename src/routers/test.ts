import { Router } from "express";

const routerTest = Router();

routerTest.post("/", (req, res, next) => {
	res.json({ test: "test" });
});

export default routerTest;
