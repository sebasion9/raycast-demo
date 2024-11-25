import {
    WIN_HEIGHT, WIN_WIDTH, MAP_FACTOR, VIRT_MAP_LEN,
    Context, Line,
    BLACK, CYAN,
} from "./config.js";

import { Minimap, pt } from "./util.js";
import { Player } from "./player.js";
import { input } from "./input.js";


// fps stuff, (i am enthusiast of anti-patterns)
var frame_count = 0;
var seconds_passed = 0;
var old_ts = 0;
var fps;


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
            let dist = lines[i].dist;
            let r = 200 * 1/(dist);
            let g = 200 * 1/(dist);
            let b = 200 * 1/(dist);
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
    private input_handler : (e : KeyboardEvent, player : Player) => void;

    constructor(ctx : Context) {
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
        // put player at middle
        this.player = new Player(pt(
            (Math.floor(VIRT_MAP_LEN - 1)/2) * MAP_FACTOR + MAP_FACTOR/2,
            (Math.floor(VIRT_MAP_LEN - 1)/2) * MAP_FACTOR + MAP_FACTOR/2)
        );

        this.physical_map = this.virt_to_phys_map();
        // init lines[] with empty arr
        this.lines = [...Array(WIN_WIDTH)];
        this.render = new Render(
            ctx, new Minimap(this.player.pos, this.virtual_map)
        );
        this.input_handler = input;

        // user input listener
        document.addEventListener("keydown", (e) => this.input_handler(e, this.player));

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
};

const init_canv = () => {
    let canvas : HTMLCanvasElement = document.getElementById("canv") as HTMLCanvasElement;
    canvas.width = WIN_WIDTH;
    canvas.height = WIN_HEIGHT;
    return canvas;
}

function main() {
    let canvas = init_canv();
    let ctx : Context = canvas.getContext("2d") as Context;
    let game = new Game(ctx);
    game.loop();
};

main();

