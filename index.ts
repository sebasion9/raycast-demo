const WIN_HEIGHT = window.innerHeight;
const WIN_WIDTH = window.innerWidth;

// virt map to "physical" map factor
const MAP_FACTOR = 1000;
const VIRT_MAP_LEN = 7;

const BLACK = "rgb(0, 0, 0)";
const WHITE = "rgb(255, 255, 255)";
const CYAN = "rgb(0, 120, 120)";
const GRAYISH = "rgb(140, 140, 140)";
const REDISH = "rgb(140, 0, 0)";


type Context = CanvasRenderingContext2D;
type Line = {
    x : number,
    dist : number
};

const canvas : HTMLCanvasElement = document.getElementById("canv") as HTMLCanvasElement;
canvas.width = WIN_WIDTH;
canvas.height = WIN_HEIGHT;

let ctx : Context = canvas.getContext("2d") as Context;


// fps stuff
var frame_count = 0;
var seconds_passed = 0;
var old_ts = 0;
var ts;
var fps;


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

class Render {
    private ctx : Context;
    private mini : Minimap;
    constructor(ctx : Context, mini : Minimap) {
        this.ctx = ctx;
        this.mini = mini;
        this.ctx.font = "24px monospace";
        this.reset();
    }
    reset() : void {
        this.ctx.fillStyle = BLACK;
        this.ctx.fillRect(0,0,WIN_WIDTH, WIN_HEIGHT);
    }
    draw_map(lines : Line[]) {
        // this is first draw method called, so only reset here
        this.reset();

        for(let i = 0; i < lines.length; i++) {
            // if anyhow there is no line, skip
            if(!lines[i]) {
                continue;
            }
            // adjust brightness of line and draw
            let x = lines[i].x;
            let r = 80 * 1/(lines[i].dist);
            let g = 80 * 1/(lines[i].dist);
            let b = 80 * 1/(lines[i].dist);
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            this.ctx.fillRect(x, 0, 5, WIN_HEIGHT);
        }
        this.draw_mini();
    }
    draw_mini() {
        this.mini.draw(this.ctx);
    }
    draw_text(text : string) : void {
        let x = this.mini.draw_pos.x;
        // put the text under the minimap + font height
        let y = this.mini.draw_pos.y + this.mini.size + 15 + 24;
        this.ctx.fillStyle = CYAN;
        this.ctx.fillText(text, x,y);
    }
}

class Game {
    private virtual_map : number[][];
    private physical_map : number[][];
    private lines : Line[];
    private render : Render;
    private player : Player;

    constructor(ctx : Context) {
        // put player at middle
        this.player = new Player(pt(3 * MAP_FACTOR + MAP_FACTOR/2,3 * MAP_FACTOR + MAP_FACTOR/2));
        // for demo purposes, the map is square now and static
        this.virtual_map = [
            [1,1,1,1,1,1,1],
            [1,0,1,0,0,0,1],
            [1,0,1,0,0,1,1],
            [1,0,0,0,0,1,1],
            [1,0,0,0,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1],
        ];


        this.physical_map = this.virt_to_phys_map();
        // init lines[] with empty arr
        this.lines = [...Array(WIN_WIDTH)];

        let mini = new Minimap(this.player.pos, this.virtual_map);

        this.render = new Render(ctx, mini);

        // user input listener
        document.addEventListener("keydown", (e) => this.input(e));

    };
    ray() : void {
        let angle = this.player.camera_angle;
        let fov = this.player.fov;

        // static values for now
        let r = 0.01;
        let max_dist = VIRT_MAP_LEN * MAP_FACTOR;

        // if angle is negative, adjust it to positive
        if(angle - (fov/2) < 0) {
            angle += 360;
        }

        // iter over fov
        for(let i = angle - (fov/2), idx = 0; i < angle + (fov/2); i += 0.01, idx += 0.01) {
            let rad = i * Math.PI/180;


            let rayX = this.player.pos.x;
            let rayY = this.player.pos.y;
            let ray_stepX = Math.cos(rad);
            let ray_stepY = Math.sin(rad);

            r = 0.002;
            while(r < max_dist) {
                // increment ray
                rayX += r * ray_stepX;
                rayY += r * ray_stepY;


                let gridX = Math.floor(rayX);
                let gridY = Math.floor(rayY);
                // if somehow grid pos is negative
                if (gridX < 0 || gridY < 0 || gridX >= this.physical_map[0].length || gridY >= this.physical_map.length) {
                    break;
                }
                // if ray hit wall
                if(this.physical_map[gridY][gridX] === 1) {
                    this.fov_lines_to_phys_map({x:idx, dist :r});
                    break;
                }
                r += 0.002
            }


        }

    };
    // maps every 1 of virtual map to a MAP_FACTOR x MAP_FACTOR of 1's
    virt_to_phys_map() : number[][] {
        let phys_map : number[][] = [...Array(VIRT_MAP_LEN * MAP_FACTOR)].map(_ => Array(VIRT_MAP_LEN * MAP_FACTOR).fill(0));
        for(let i = 0; i < VIRT_MAP_LEN; i++) {
            for(let j = 0; j < VIRT_MAP_LEN; j++) {
                if(this.virtual_map[i][j] === 1) {
                    for(let p = 0; p < MAP_FACTOR; p++) {
                        for(let k = 0; k < MAP_FACTOR; k++) {
                            phys_map[i*MAP_FACTOR + p][j*MAP_FACTOR + k] = 1;
                        }
                    }
                }

            }
        }
        return phys_map;
    }
    fov_lines_to_phys_map(line : Line) {
        let fov = this.player.fov;
        let dist = line.dist;
        let idx = line.x;
        let factor = WIN_WIDTH/fov;
        let mapped_idx = idx * factor;

        for(let i = mapped_idx; i < factor + mapped_idx; i++) {
            this.lines[Math.floor(i)] = {x : i, dist : dist};
        }
    }

    loop() : void {
        // fps stuff
        let now = performance.now();
        seconds_passed = (now - old_ts) / 1000;
        old_ts = now;
        fps = Math.round(1/seconds_passed);

        frame_count++;
        if(frame_count >= 4) {
            frame_count = 0;
            // cast ray, then draw lines
            this.ray();
            this.render.draw_map(this.lines);
            this.render.draw_text(fps+"");
        }

        // next frame
        window.requestAnimationFrame(() => this.loop());
    }
    // simple walking/turning player interface
    input(e : KeyboardEvent) : void {
        let angle = this.player.get_angle();
        switch(e.key) {
            case "q":
                this.player.camera_angle -= 5;
                break;
            case "e":
                this.player.camera_angle += 5;
                break;
            case "w":
                if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
                    this.player.pos.x += MAP_FACTOR/4;
                }
                if(angle <= 225 && angle >= 135) {
                    this.player.pos.x -= MAP_FACTOR/4;
                }
                if(angle > 45 && angle < 135) {
                    this.player.pos.y += MAP_FACTOR/4
                }
                if(angle > 225 && angle < 315) {
                    this.player.pos.y -= MAP_FACTOR/4;
                }
                break;
            case "s":
                if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
                    this.player.pos.x -= MAP_FACTOR/4;
                }
                if(angle <= 225 && angle >= 135) {
                    this.player.pos.x += MAP_FACTOR/4;
                }
                if(angle > 45 && angle < 135) {
                    this.player.pos.y -= MAP_FACTOR/4
                }
                if(angle > 225 && angle < 315) {
                    this.player.pos.y += MAP_FACTOR/4;
                }
                break;
            case "a":
                if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
                    this.player.pos.y -= MAP_FACTOR/4;
                }
                if(angle <= 225 && angle >= 135) {
                    this.player.pos.y += MAP_FACTOR/4;
                }
                if(angle > 45 && angle < 135) {
                    this.player.pos.x -= MAP_FACTOR/4
                }
                if(angle > 225 && angle < 315) {
                    this.player.pos.x += MAP_FACTOR/4;
                }
                break;
            case "d":
                if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
                    this.player.pos.y += MAP_FACTOR/4;
                }
                if(angle <= 225 && angle >= 135) {
                    this.player.pos.y -= MAP_FACTOR/4;
                }
                if(angle > 45 && angle < 135) {
                    this.player.pos.x += MAP_FACTOR/4
                }
                if(angle > 225 && angle < 315) {
                    this.player.pos.x -= MAP_FACTOR/4;
                }
                break;
        }

    }

};
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



function main() {
    let game = new Game(ctx);
    game.loop();
};

main();

