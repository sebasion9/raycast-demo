const WIN_HEIGHT = window.innerHeight;
const WIN_WIDTH = window.innerWidth;

// virt map to "physical" map factor
const MAP_FACTOR = 1000;
const VIRT_MAP_LEN = 7;



type Context = CanvasRenderingContext2D;
type Line = {
    x : number,
    dist : number
};

const BLACK = "rgb(0, 0, 0)";
const WHITE = "rgb(255, 255, 255)";
const CYAN = "rgb(0, 120, 120)";
const GRAYISH = "rgb(140, 140, 140)";
const REDISH = "rgb(140, 0, 0)";

export {
    WHITE,
    BLACK,
    CYAN,
    GRAYISH,
    REDISH,
}

export {
    WIN_HEIGHT,
    WIN_WIDTH,
    MAP_FACTOR,
    VIRT_MAP_LEN,
    Context,
    Line,
}
