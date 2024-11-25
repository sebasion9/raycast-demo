import { Player } from "./player.js";
import { MAP_FACTOR } from "./config.js";

export const input = (e : KeyboardEvent, player : Player) => {
    let angle = player.get_angle();
    switch(e.key) {
        case "q":
            player.camera_angle -= 5;
        break;
        case "e":
            player.camera_angle += 5;
        break;
        case "w":
            if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
            player.pos.x += MAP_FACTOR/4;
        }
        if(angle <= 225 && angle >= 135) {
            player.pos.x -= MAP_FACTOR/4;
        }
        if(angle > 45 && angle < 135) {
            player.pos.y += MAP_FACTOR/4
        }
        if(angle > 225 && angle < 315) {
            player.pos.y -= MAP_FACTOR/4;
        }
        break;
        case "s":
            if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
            player.pos.x -= MAP_FACTOR/4;
        }
        if(angle <= 225 && angle >= 135) {
            player.pos.x += MAP_FACTOR/4;
        }
        if(angle > 45 && angle < 135) {
            player.pos.y -= MAP_FACTOR/4
        }
        if(angle > 225 && angle < 315) {
            player.pos.y += MAP_FACTOR/4;
        }
        break;
        case "a":
            if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
            player.pos.y -= MAP_FACTOR/4;
        }
        if(angle <= 225 && angle >= 135) {
            player.pos.y += MAP_FACTOR/4;
        }
        if(angle > 45 && angle < 135) {
            player.pos.x += MAP_FACTOR/4
        }
        if(angle > 225 && angle < 315) {
            player.pos.x -= MAP_FACTOR/4;
        }
        break;
        case "d":
            if(angle <= 45 && angle >= 0 || angle >= 315 && angle <= 360) {
            player.pos.y += MAP_FACTOR/4;
        }
        if(angle <= 225 && angle >= 135) {
            player.pos.y -= MAP_FACTOR/4;
        }
        if(angle > 45 && angle < 135) {
            player.pos.x -= MAP_FACTOR/4
        }
        if(angle > 225 && angle < 315) {
            player.pos.x += MAP_FACTOR/4;
        }
        break;
    }

}
