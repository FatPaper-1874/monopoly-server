class Dice {
	private diceNum = 2; //骰子个数(默认两个)
	private resultArray: Array<number> = [];

	constructor(diceNum: number) {
		this.diceNum = diceNum;
	}
  
	public getResultNumber() {
		let sum = 0;
		this.resultArray.map((item) => {
			sum += item;
		});
		return sum;
	}

	public getResultArray() {
		return this.resultArray;
	}

  public roll() {
		this.resultArray = [];
		for (let rollCount = 0; rollCount < this.diceNum; rollCount++) {
			this.resultArray.push(this.getRandomInteger(1, 6));
		}
	}

	private getRandomInteger(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
}

export default Dice;
