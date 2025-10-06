const KEY_RIGHT = 39;
const KEY_LEFT = 37;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const STATE = {
    x_pos: 0,
    y_pos: 0,
    move_right: false,
    move_left: false,
    spaceship_width: 50
}

// General purpose functions
function setPosition($element, x, y) {
    $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
    $element.style.width = `${width}px`;
    $element.style.height = "auto";
}

// Player
function createPlayer($container) {
    STATE.x_pos = GAME_WIDTH / 2;
    STATE.y_pos = GAME_HEIGHT - 50;
    const $player = document.createElement("img");
    $player.src = "img/spaceship.png";
    $player.className = "player";
    $container.appendChild($player);
    setPosition($player, STATE.x_pos, STATE.y_pos);
    setSize($player, STATE.spaceship_width);
}

function updatePlayer() {
    if (STATE.move_left) {
        STATE.x_pos -= 3;
    }
    else if (STATE.move_right) {
        STATE.x_pos += 3;
    }
    const $player = document.querySelector(".player");
    setPosition($player, STATE.x_pos, STATE.y_pos);
}

// Key Presses
function KeyPress(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = true;
        console.log("Right key is pressed");
    } else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = true;
        console.log("Left key is pressed");
    }
}

function KeyRelease(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = false;
    } else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = false;
    }
}

// Main Update Function
function update() {
    updatePlayer();
    window.requestAnimationFrame(update);
}


// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
update();