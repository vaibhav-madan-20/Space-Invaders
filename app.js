const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const STATE = {
    x_pos: 0,
    y_pos: 0,
    move_right: false,
    move_left: false,
    shoot: false,
    lasers: [],
    enemies: [],
    spaceship_width: 50,
    enemy_width: 50,
    cooldown: 0,
    number_of_enemies: 16
}

// General purpose functions
function setPosition($element, x, y) {
    $element.style.transform = `translate(${x}px, ${y}px)`;
}

function setSize($element, width) {
    $element.style.width = `${width}px`;
    $element.style.height = "auto";
}

function bound(x) {
    if (x >= GAME_WIDTH - STATE.spaceship_width) {
        STATE.x_pos = GAME_WIDTH - STATE.spaceship_width;
        return GAME_WIDTH - STATE.spaceship_width
    }
    else if (x <= 0) {
        STATE.x_pos = 0;
        return 0
    }
    else {
        return x;
    }
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
    if (STATE.move_right) {
        STATE.x_pos += 3;
    }
    if (STATE.shoot && STATE.cooldown === 0) {
        createLaser($container, STATE.x_pos - STATE.spaceship_width / 2, STATE.y_pos);
        STATE.cooldown = 30;
    }
    const $player = document.querySelector(".player");
    setPosition($player, bound(STATE.x_pos), STATE.y_pos);

    if (STATE.cooldown > 0) {
        STATE.cooldown -= 0.5;
    }
}


// Player Laser
function createLaser($container, x, y) {
    const $laser = document.createElement("img");
    $laser.src = "img/laser.png";
    $laser.className = "laser";
    $container.appendChild($laser);
    const laser = { x, y, $laser };
    STATE.lasers.push(laser);
    setPosition($laser, x, y);
}

function updateLaser($container) {
    const lasers = STATE.lasers;
    for (let i = 0; i < lasers.length; i++) {
        const laser = lasers[i];
        laser.y -= 2;
        if (laser.y < 0) {
            deleteLaser(lasers, laser, laser.$laser);
        }
        setPosition(laser.$laser, laser.x, laser.y);
    }
}


// Delete Laser
function deleteLaser(lasers, laser, $laser) {
    const index = lasers.indexOf(laser);
    lasers.splice(index, 1);
    $container.removeChild($laser);
}


// Enemy 
function createEnemy($container, x, y) {
    const $enemy = document.createElement("img");
    $enemy.src = "img/ufo.png";
    $enemy.className = "enemy";
    $container.appendChild($enemy);
    const enemy_cooldown = Math.floor(Math.random() * 100);
    const enemy = { x, y, $enemy, enemy_cooldown }
    STATE.enemies.push(enemy);
    setSize($enemy, STATE.enemy_width);
    setPosition($enemy, x, y)
}

function updateEnemies($container) {
    const dx = Math.sin(Date.now() / 1000) * 40;
    const dy = Math.cos(Date.now() / 1000) * 30;
    const enemies = STATE.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        var a = enemy.x + dx;
        var b = enemy.y + dy;
        setPosition(enemy.$enemy, a, b);
    }
}

function createEnemies($container) {
    for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
        createEnemy($container, i * 80, 100);
    } for (var i = 0; i <= STATE.number_of_enemies / 2; i++) {
        createEnemy($container, i * 80, 180);
    }
}

// Key Presses
function KeyPress(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = true;
        console.log("Right key is pressed");
    }
    else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = true;
        console.log("Left key is pressed");
    }
    else if (event.keyCode === KEY_SPACE) {
        STATE.shoot = true;
        console.log("Spacebar is pressed");
    }
}

function KeyRelease(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = false;
    } 
    else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = false;
    }
    else if (event.keyCode == KEY_SPACE) {
        STATE.shoot = false;
    }
}

// Main Update Function
function update() {
    updatePlayer();
    updateLaser();
    updateEnemies();

    window.requestAnimationFrame(update);
}


// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
update();