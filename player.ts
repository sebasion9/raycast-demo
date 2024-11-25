import { Point } from "./util.js";
class Player {
    pos : Point;
    camera_angle : number = 0;
    fov : number = 120;
    constructor(virtXY : Point) {
        this.pos = virtXY;
    };
    // returns positive angle
    get_angle() : number {
        let angle = this.camera_angle;
        while(angle < 0) {
            angle += 360;
        }
        while(angle > 360) {
            angle -= 360;
        }
        return angle;
    }
}

export { 
    Player
};
