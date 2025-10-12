const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_RIGHT = 39;
const KEY_LEFT = 37;
const KEY_SPACE = 32;

const BASE_GAME_WIDTH = 800;
const BASE_GAME_HEIGHT = 600;

// logical game dimensions (base)
const GAME_WIDTH = BASE_GAME_WIDTH;
const GAME_HEIGHT = BASE_GAME_HEIGHT;

const STATE = {
    x_pos: 0,
    y_pos: 0,
    move_right: false,
    move_left: false,
    shoot: false,
    lasers: [],
    enemyLasers: [],
    enemies: [],
    spaceship_width: 50, // logical units (will be scaled for display)
    enemy_width: 50,
    cooldown: 0,
    number_of_enemies: 18,
    enemy_cooldown: 0,
    gameOver: false,
    scoreSaved: false, // ensure score saved only once
    scale: 1, // computed based on available space
    allowEnemyFire: false // will be enabled after 1000ms
}

// General purpose functions (size/position will consider STATE.scale)
function setPosition($element, x, y) {
    const sx = x * STATE.scale;
    const sy = y * STATE.scale;
    $element.style.transform = `translate(${sx}px, ${sy}px)`;
}

function setSize($element, width) {
    const w = Math.max(1, width * STATE.scale);
    $element.style.width = `${w}px`;
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
    // if game ended -> do not update enemy positions or cooldowns or fire
    if (STATE.gameOver) return;

    // smooth group motion using time
    const dx = Math.sin(Date.now() / 1000) * 40;
    const dy = Math.cos(Date.now() / 1000) * 30;
    const enemies = STATE.enemies;
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        const a = enemy.x + dx;
        const b = enemy.y + dy;
        setPosition(enemy.$enemy, a, b);

        // enemy firing logic (only if allowed after initial delay)
        enemy.enemy_cooldown -= 0.5;
        if (STATE.allowEnemyFire && enemy.enemy_cooldown <= 0) {
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
    // freeze movement/shooting when game over
    if (STATE.gameOver) return;

    // movement (logical units)
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
        setSize($player, STATE.spaceship_width);
    }
    if (STATE.cooldown > 0) {
        STATE.cooldown -= 0.5;
        if (STATE.cooldown < 0) STATE.cooldown = 0;
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
    setSize($laser, 6);
}

function updateLaser($container) {
    // freeze lasers in place when game over
    if (STATE.gameOver) return;

    const lasers = STATE.lasers;
    for (let i = lasers.length - 1; i >= 0; i--) {
        const laser = lasers[i];
        laser.y -= 6; // logical speed
        if (laser.y < 0) {
            deleteLaser(lasers, laser, laser.$laser);
            continue;
        }
        setPosition(laser.$laser, laser.x, laser.y);

        const laser_rectangle = laser.$laser.getBoundingClientRect();
        const enemies = STATE.enemies;
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
                break; // laser destroyed
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
    setPosition($enemyLaser, x + STATE.enemy_width / 2, y + 15);
    setSize($enemyLaser, 6);
}

function updateEnemyLaser($container) {
    // freeze enemy lasers when game over
    if (STATE.gameOver) return;

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
    if (STATE.gameOver) return; // ignore inputs after game end
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
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    leaderboard.push({ name, score: scoreToSave });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

// Responsive scaling: compute STATE.scale and update sizes of existing elements
function computeScale() {
    const header = document.querySelector('.game-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const availableWidth = Math.min(window.innerWidth, document.documentElement.clientWidth) - 40; // some padding
    const availableHeight = window.innerHeight - headerHeight - 40;

    const scaleW = Math.max(0.35, Math.min(1, availableWidth / BASE_GAME_WIDTH)); // limit scale range
    const scaleH = Math.max(0.35, Math.min(1, availableHeight / BASE_GAME_HEIGHT));
    STATE.scale = Math.min(scaleW, scaleH);

    // Resize the actual container so background and bottom alignment match
    if ($container) {
        const newW = Math.round(BASE_GAME_WIDTH * STATE.scale);
        const newH = Math.round(BASE_GAME_HEIGHT * STATE.scale);
        $container.style.width = newW + 'px';
        $container.style.height = newH + 'px';
        // ensure background image fills container
        $container.style.backgroundSize = '100% 100%';
    }

    // After scale changed, make sure all elements are sized/positioned using setSize/setPosition
    const playerEl = document.querySelector('.player');
    if (playerEl) {
        setSize(playerEl, STATE.spaceship_width);
        setPosition(playerEl, STATE.x_pos, STATE.y_pos - 10);
    }
    STATE.enemies.forEach(enemy => {
        setSize(enemy.$enemy, STATE.enemy_width);
        setPosition(enemy.$enemy, enemy.x, enemy.y);
    });
    STATE.lasers.forEach(l => {
        setSize(l.$laser, 6);
        setPosition(l.$laser, l.x, l.y);
    });
    STATE.enemyLasers.forEach(el => {
        setSize(el.$enemyLaser, 6);
        setPosition(el.$enemyLaser, el.x, el.y);
    });
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
        // show lose overlay
        const loseEl = document.querySelector(".lose");
        if (loseEl) loseEl.style.display = "block";

        // remove input listeners as extra guard
        window.removeEventListener("keydown", KeyPress);
        window.removeEventListener("keyup", KeyRelease);
    }

    if (STATE.enemies.length == 0 && !STATE.scoreSaved) {
        saveScore(playerName, score);
        STATE.scoreSaved = true;
        const winEl = document.querySelector(".win");
        if (winEl) winEl.style.display = "block";

        window.removeEventListener("keydown", KeyPress);
        window.removeEventListener("keyup", KeyRelease);
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

// compute scale once and on resize
computeScale();
window.addEventListener('resize', computeScale);

// Delay enemy firing by 1 second from game start
setTimeout(() => {
    STATE.allowEnemyFire = true;
}, 1000);

update();
