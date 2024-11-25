function pt(x:number, y:number) : Point {
    return new Point(x,y);
};

class Point {
    x : number;
    y : number;
    constructor(x : number, y : number) {
        this.x = x;
        this.y = y;
    }
};
