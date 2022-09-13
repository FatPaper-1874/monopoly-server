class Icon {
  private static iconList = ["bomb", "poo", "ghost", "fish", "bug", "rocket", "dragon", "user-graduate", "toilet", "user-secret"];

  public static getRandomIcon(){
    return this.iconList[parseInt((Math.random() * this.iconList.length + ''), 10)]
  }
}

export default Icon