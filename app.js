const KEY_UP = 38;
const KEY_DOWN = 40;
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
    enemyLasers: [],
    enemies: [],
    spaceship_width: 50,
    enemy_width: 50,
    cooldown: 0,
    number_of_enemies: 16,
    enemy_cooldown: 0,
    gameOver: false,
    scoreSaved: false // <-- guard flag to ensure score is saved only once
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
        return GAME_WIDTH - STATE.spaceship_width;
    } if (x <= 0) {
        STATE.x_pos = 0;
        return 0;
    } else {
        return x;
    }
}

function collideRect(rect1, rect2) {
    return !(rect2.left > rect1.right ||
        rect2.right < rect1.left ||
        rect2.top > rect1.bottom ||
        rect2.bottom < rect1.top);
}

// Enemy 
function createEnemy($container, x, y) {
    const $enemy = document.createElement("img");
    $enemy.src = "img/ufo.png";
    $enemy.className = "enemy";
    $container.appendChild($enemy);
    const enemy_cooldown = Math.floor(Math.random() * 100);
    const enemy = { x, y, $enemy, enemy_cooldown };
    STATE.enemies.push(enemy);
    setSize($enemy, STATE.enemy_width);
    setPosition($enemy, x, y);
}

function updateEnemies($container) {
    const dx = Math.sin(Date.now() / 1000) * 40;
    const dy = Math.cos(Date.now() / 1000) * 30;
    const enemies = STATE.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const a = enemy.x + dx;
        const b = enemy.y + dy;
        setPosition(enemy.$enemy, a, b);

        // enemy firing logic (reduce cooldown; when <=0 fire and reset)
        enemy.enemy_cooldown -= 0.5;
        if (enemy.enemy_cooldown <= 0) {
            createEnemyLaser($container, a, b);
            enemy.enemy_cooldown = Math.floor(Math.random() * 80) + 60;
        }
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

    // show stored player name in header if available
    const pname = localStorage.getItem("playerName");
    const nameDisplay = document.getElementById("playerNameDisplay");
    if (nameDisplay) {
        nameDisplay.textContent = "Player: " + (pname || "Unknown");
    }
}

function updatePlayer() {
    if (STATE.move_left) {
        STATE.x_pos -= 3;
    }
    if (STATE.move_right) {
        STATE.x_pos += 3;
    }
    if (STATE.shoot && STATE.cooldown == 0) {
        createLaser($container, STATE.x_pos - STATE.spaceship_width / 2 + 10, STATE.y_pos);
        STATE.cooldown = 30;
    }
    const $player = document.querySelector(".player");
    if ($player) {
        setPosition($player, bound(STATE.x_pos), STATE.y_pos - 10);
    }
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
    // iterate backwards to safely remove while iterating
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.y -= 6; // faster laser
        if (laser.y < 0) {
            deleteLaser(lasers, laser, laser.$laser);
            continue;
        }
        setPosition(laser.$laser, laser.x, laser.y);

        const laser_rectangle = laser.$laser.getBoundingClientRect();
        const enemies = STATE.enemies;
        // iterate backwards through enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const enemy_rectangle = enemy.$enemy.getBoundingClientRect();
            if (collideRect(enemy_rectangle, laser_rectangle)) {
                // remove laser and enemy
                deleteLaser(lasers, laser, laser.$laser);
                enemies.splice(j, 1);
                if (enemy.$enemy && enemy.$enemy.parentNode === $container) {
                    $container.removeChild(enemy.$enemy);
                }
                // increase score and update HUD
                score += 10;
                updateScoreHUD(score);
                break; // laser destroyed, stop checking other enemies
            }
        }
    }
}

// Enemy Laser
function createEnemyLaser($container, x, y) {
    const $enemyLaser = document.createElement("img");
    $enemyLaser.src = "img/enemyLaser.png";
    $enemyLaser.className = "enemyLaser";
    $container.appendChild($enemyLaser);
    const enemyLaser = { x, y, $enemyLaser };
    STATE.enemyLasers.push(enemyLaser);
    setPosition($enemyLaser, x, y);
}

function updateEnemyLaser($container) {
    const enemyLasers = STATE.enemyLasers;
    for (let i = enemyLasers.length - 1; i >= 0; i--) {
        const enemyLaser = enemyLasers[i];
        enemyLaser.y += 3.5;
        if (enemyLaser.y > GAME_HEIGHT - 30) {
            deleteLaser(enemyLasers, enemyLaser, enemyLaser.$enemyLaser);
            continue;
        }
        const enemyLaser_rectangle = enemyLaser.$enemyLaser.getBoundingClientRect();
        const spaceshipEl = document.querySelector(".player");
        if (spaceshipEl) {
            const spaceship_rectangle = spaceshipEl.getBoundingClientRect();
            if (collideRect(spaceship_rectangle, enemyLaser_rectangle)) {
                STATE.gameOver = true;
            }
        }
        setPosition(enemyLaser.$enemyLaser, enemyLaser.x + STATE.enemy_width / 2, enemyLaser.y + 15);
    }
}

// Delete Laser
function deleteLaser(lasers, laser, $laser) {
    const index = lasers.indexOf(laser);
    if (index > -1) lasers.splice(index, 1);
    if ($laser && $laser.parentNode) {
        $laser.parentNode.removeChild($laser);
    }
}

// Key Presses
function KeyPress(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = true;
    } else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = true;
    } else if (event.keyCode === KEY_SPACE) {
        STATE.shoot = true;
    }
}

function KeyRelease(event) {
    if (event.keyCode === KEY_RIGHT) {
        STATE.move_right = false;
    } else if (event.keyCode === KEY_LEFT) {
        STATE.move_left = false;
    } else if (event.keyCode === KEY_SPACE) {
        STATE.shoot = false;
    }
}

// Score + leaderboard helpers
let score = 0; // track aliens killed
const playerName = localStorage.getItem("playerName") || "Unknown";

function updateScoreHUD(value) {
    const scoreEl = document.getElementById("scoreDisplay");
    if (scoreEl) scoreEl.textContent = "Score: " + value;
}

function saveScore(name, scoreToSave) {
    // push and keep top 10
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    leaderboard.push({ name, score: scoreToSave });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

// Main Update Function
function update() {
    updatePlayer();
    updateEnemies($container);
    updateLaser($container);
    updateEnemyLaser($container);

    // Only save once per game end (guard with STATE.scoreSaved)
    if (STATE.gameOver && !STATE.scoreSaved) {
        saveScore(playerName, score);
        STATE.scoreSaved = true;
        document.querySelector(".lose").style.display = "block";
    }

    if (STATE.enemies.length == 0 && !STATE.scoreSaved) {
        saveScore(playerName, score);
        STATE.scoreSaved = true;
        document.querySelector(".win").style.display = "block";
    }

    window.requestAnimationFrame(update);
}

// Create enemies in two rows
function createEnemies($container) {
    for (var i = 0; i < STATE.number_of_enemies / 2; i++) {
        createEnemy($container, i * 80, 100);
    }
    for (var i = 0; i < STATE.number_of_enemies / 2; i++) {
        createEnemy($container, i * 80, 180);
    }
}

// Initialize the Game
const $container = document.querySelector(".main");
createPlayer($container);
createEnemies($container);

// update initial HUD
updateScoreHUD(score);

// Key Press Event Listener
window.addEventListener("keydown", KeyPress);
window.addEventListener("keyup", KeyRelease);
update();
