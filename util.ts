import {Context, GRAYISH, BLACK, MAP_FACTOR, REDISH, WHITE} from "./config.js";
// wrapper for cleaner point constructor
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
// is always square
class Minimap {
    draw_pos : Point;
    private ppos : Point;
    private vmap : number[][];
    // size in px
    size : number;
    // some static position and size
    constructor(ppos : Point, vmap : number[][]) {
        this.draw_pos = pt(25, 25);
        this.size = 150;
        this.ppos= ppos;
        this.vmap = vmap;
    }

    draw(ctx : Context) : void {
        // draw backgroud of map with border
        let x = this.draw_pos.x;
        let y = this.draw_pos.y;
        // border
        ctx.fillStyle = GRAYISH;
        ctx.fillRect(x-5,y-5, this.size+10,this.size+10);
        // bg
        ctx.fillStyle = BLACK;
        ctx.fillRect(x,y,this.size,this.size);

        // only support square maps for now
        let height = this.size / this.vmap.length;
        let width = this.size / this.vmap[0].length;
        // map player back to virt map
        let px = Math.round((this.ppos.x - MAP_FACTOR/2) / MAP_FACTOR);
        let py = Math.round((this.ppos.y - MAP_FACTOR/2) / MAP_FACTOR);

        for(let i = 0; i < this.vmap.length; i++) {
            for(let j = 0; j < this.vmap[0].length; j++) {
                // draw player "dot"
                if(i === py && j == px) {
                    ctx.fillStyle = REDISH;
                    ctx.fillRect(x+j*width, y+i*height, width, height);
                    continue;
                }

                // draw wall
                if(this.vmap[i][j] === 1) {
                    ctx.fillStyle = WHITE;
                    ctx.fillRect(x+j*width, y+i*height, width, height);
                }
            }
        }

    }
}

export {
    Minimap,
    Point,
    pt
}
