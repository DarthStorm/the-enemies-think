/*
WARNING
only continue if you know what you are doing
or not
i really dont care
just make backups

here be dragons.

----------------------------------          -------------------------------------
|         Make a backup          |          | I already made a backup, continue |
----------------------------------          -------------------------------------

*/
const canvas = document.createElement('canvas');
canvas.parent = document.body;
const width = 1080;
const height = 720;
canvas.width = width;
canvas.height = height;
canvas.id = 'canvas';

//deltatime
//16-17 at 60fps
let lastUpdate = Date.now();
let now = 0;
let deltaTime = 0;

// font stuff
const PixelOperator = new FontFace('PixelOperator', 'url(assets/fonts/PixelOperator/PixelOperator.woff)');
document.fonts.add(PixelOperator)
PixelOperator.load()

document.fonts.ready.then((font) => {
    console.log('Fonts loaded');
});

const allControls = {

};

const mouse = {
    down: false, // gonna be deprecated in a bit
    position: {
        x: 0,
        y: 0
    },
    tracker: { // for ui buttons
        // DONT PUT ANY UI ELEMENTS AT (0,0)
        // IT MOST LIKELY WILL MESS IT UP
        // or not
        downPos: {
            x: 0,
            y: 0,
        },
        clickPos: {
            x: 0,
            y: 0,
        },
        click: false
    }
}

function loadTexture(src = "") {
    let x = new Image();
    x.src = "assets/textures/" + src;
    return x;
}

function loadSound(url = "") {
    let x = new Audio("assets/sounds/" + url);
    return {
        Audio: x,
        play: function () {
            let y = x.cloneNode();
            y.play();
        }
    };
}

const TEXTURES = {
    empty: loadTexture('empty.png'),
    bg: loadTexture("bg.png"),
    player: {
        idle: loadTexture("player.png"),
    },
    enemy: {
        //change later
        basic: loadTexture("enemy.png"),
    },
    projectile: {
        playerbullet: loadTexture("playerbullet.png"),
    },
    collectible: {
        coin: loadTexture("coin.png"),
    },
    ui: {
        coin: loadTexture("ui/coin.png"),
        health: loadTexture("ui/health.png"),
        upgradeButton: loadTexture("ui/upgradebutton.png"),
        upgradeShop: loadTexture("ui/upgradeShop.png"),
    },
    debug: {
        debug1: loadTexture("debug1.png"),
        debug2: loadTexture("debug2.png"),
    }
};

const SOUNDS = {
    weapon: {
        shoot: loadSound("shoot.mp3"),
    },
    collectible: {
        coin: loadSound("coin.mp3"),
    },
    bgm: {
        normal_1: loadSound("bgm1.mp3"),
    }
}

function newWeapon(type_ = "", baseProjectile = {
    count: 1,
    spread: 0,
    damage: 20,
    damage: 20,
    range: 2000,
    speed: 0.7,
    size: 8,

}, baseStats = {
    fireRate: 700,
}, onAttack_ = undefined) {

    const Weapon = {
        type: type_,
        projectile: baseProjectile,
        stats: baseStats,
        positionProjectiles: function (player, count = this.projectile.count, spread = this.projectile.spread, damage = this.projectile.damage, range = this.projectile.range, speed = this.projectile.speed, size = this.projectile.size) {
            if (count == 1) {
                //hardcoded, as everything else seems to have issues
                return [new Projectile(player, player.x + player.width / 2, player.y + player.height / 2, type_, player.direction, damage, range, speed, size, size)];
            }
            let res = [];
            let spreadPerBullet = spread / (count - 1);
            let baseDirection = player.direction - spread / 2;
            for (let i = 0; i < count; i++) {
                res.push(new Projectile(player, player.x + player.width / 2, player.y + player.height / 2, type_, baseDirection + spreadPerBullet * i, damage, range, speed, size, size));
            }
            return res;
        },
        onAttack: onAttack_ ?? function (player, level) {
            this.projectileList = this.positionProjectiles(player, this.projectile.count, this.projectile.spread);
            for (let pr = 0; pr < this.projectileList.length; pr++) {
                level.projectiles.push(this.projectileList[pr]);

            }
        },
    }

    return Weapon;
}

function updateWeaponStats(base=WEAPONS.Pistol,stats=new Player().upgradeStats) {
    base.projectile.count += stats.projectile.count;
    base.projectile.damage += stats.projectile.damage;
    base.projectile.range += stats.projectile.range;
    base.projectile.size += stats.projectile.size;
    base.projectile.speed += stats.projectile.speed;
    base.projectile.spread += stats.projectile.spread;
    base.stats.fireRate += stats.fireRate;
}

const WEAPONS = {
    //weapons
    // ridiculously op:
    op: {
        SonicBoom: newWeapon("SonicBoom", baseProjectile = {
            count: 100,
            spread: 1,
            damage: 100,
            range: 1200,
            speed: 1,
            size: 30,
        }, baseStats = {
            fireRate: 50,
        }),
        SingleShot: newWeapon("SingleShot", baseProjectile = {
            count: 100,
            spread: 0,
            damage: 1000,
            range: 2400,
            speed: 1,
            size: 30,
        }, baseStats = {
            fireRate: 500,
        }),
    },

    //normal weapons
    Pistol: newWeapon("Pistol"),
    Shotgun: newWeapon("Shotgun", baseProjectile = {
            count: 4,
            spread: 0.6,
            damage: 9,
            range: 400,
            speed: 1,
            size: 16,
        },
        baseStats = {
            fireRate: 800,
        }),
    SMG: newWeapon("SMG", baseProjectile = {
            count: 1,
            spread: 0,
            damage: 8,
            range: 1000,
            speed: 0.7,
            size: 8,
        },
        baseStats = {
            fireRate: 300,
        }),


};

class Player {
    //this is a player. 
    constructor(x, y, width = 64, height = 64, texture = TEXTURES.player.idle, weapon = WEAPONS.Pistol, maxhealth = 100) {
        this.x = x;
        this.y = y;
        this.xv = 0;
        this.yv = 0;
        this.width = width;
        this.height = height;
        this.texture = texture;
        this.speed = 0.3;
        this.weapon = weapon;
        this.maxhealth = maxhealth;

        this.attackCooldown = 0;
        this.direction = 0;
        this.health = this.maxhealth;
        this.invul = 0;
        this.stunned = 0;

        this.upgradeStats = {
            projectile:{
                count: 0,
                spread: 0,
                damage: 0,
                range: 0,
                speed: 0,
                size: 0,
            },
            fireRate: 0,
        }

        this.money = 0;

        this.active = true;
    }

    // for player we use a very special tick method, that, now that i think of it, was very unnecessary
    // but im still doing it regardless not falling into technical debt
    tick(level = lvl) {}

    // movement to set cam x&y first
    move(level = lvl) {
        if (this.invul > 0) {
            this.invul -= deltaTime;
        }
        this.attackCooldown -= deltaTime;
        if (this.stunned > 0) {
            this.stunned -= deltaTime;
            this.xv *= deltaTime / (deltaTime + 10);
            this.yv *= deltaTime / (deltaTime + 10);
            if (this.xv < 1 && this.yv < 1) {
                this.stunned = 0;
            }
        } else {
            this.xv = (level.controls.right - level.controls.left) * this.speed * deltaTime;
            this.yv = (level.controls.down - level.controls.up) * this.speed * deltaTime;
        }
        this.x += this.xv;
        this.y += this.yv;

        
    }

    //after we get cam x and y
    aftertick(level = lvl) {
        //point towards cursor
        this.direction = Math.atan2((level.controls.mousePosition.x - level.CAMX) - (this.x + this.width / 2), -((level.controls.mousePosition.y - level.CAMY) - (this.y + this.height / 2)))
        if (level.controls.shoot && this.attackCooldown <= 0) {
            this.weapon.onAttack(this, level);
            this.attackCooldown = this.weapon.stats.fireRate;
            SOUNDS.weapon.shoot.play();
        }
        if (level.controls.pistol) {
        }
    }

    draw(level = lvl) {
        //draw player
        if (this.invul > 0 && Math.round(this.invul / 10) % 2 == 0) {
            let prevAlpha = level.ctx.globalAlpha;
            level.ctx.drawImage(this.texture, this.x + level.CAMX, this.y + level.CAMY, this.width, this.height);
        }
        level.ctx.drawImage(this.texture, this.x + level.CAMX, this.y + level.CAMY, this.width, this.height);
        // //DEBUG
        // level.ctx.fillText(`x:${this.x}, y:${this.y}`, this.x + level.CAMX, this.y + level.CAMY);
        // level.ctx.fillText(`${level.controls.mousePosition.x-level.CAMX},${level.controls.mousePosition.y-level.CAMY}`, level.controls.mousePosition.x, level.controls.mousePosition.y);
    }
    takeDamage(damage, knockback = {
        direction: 0,
        strength: 0
    }, ignoreInvulnerability = false) {
        //This function is called from the enemies (and enemy bullets), since I don't want another tick loop
        //Deducts HP and kills if hp <= 0
        //ignoreInvulnerability just forcefully deals damage
        if (this.invul > 0 && !ignoreInvulnerability) {
            // don't do anything when player is invincible
            return;
        }
        //player got hit oh no
        this.health -= damage;
        //deal kb dmg

        //DEBUG

        // this.xv = Math.sin(knockback.direction) * knockback.strength * deltaTime;
        // this.yv = -(Math.cos(knockback.direction) * knockback.strength * deltaTime);
        // this.stunned = 1000;

        if (this.health <= 0) {
            //get all declarations of this.active before drawing
            this.active = false;
            this.gameOver();
        }
        this.invul = 1200;

    }

    gameOver(level = lvl) {
        //placeholder function
    }
}

class Enemy {
    constructor(x, y, width = 32, height = 32, direction = 0, maxhealth = 40, texture = TEXTURES.enemy.basic) {
        this.x = x;
        this.y = y;
        this.xv = 0;
        this.yv = 0;
        this.width = width * maxhealth / 40;
        this.height = height * maxhealth / 40;
        this.direction = direction
        this.texture = texture;
        this.maxhealth = maxhealth;
        this.speed = 0.1;
        this.health = this.maxhealth;
        this.damage = 5
        this.worth = 1;

        this.stunned = 0;
        this.active = true;
        this.mergeTimer = 0;
    }

    tick(level = lvl) {
        
        var playersSorted = level.players.concat() // makes a new array. but HOW
        playersSorted.sort(function (a, b) {
            // dist between 2 points
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2)
        });

        this.direction = Math.atan2(playersSorted[0].x - (this.x), -(playersSorted[0].y - (this.y)))
        if (this.stunned > 0) {
            this.stunned -= deltaTime;
            this.xv *= deltaTime / (deltaTime + 10);
            this.yv *= deltaTime / (deltaTime + 10);
            if (this.xv < 1 && this.yv < 1 && this.stunned > 11) {
                this.stunned = 10;
            }
        } else {
            this.xv = Math.sin(this.direction) * this.speed * deltaTime;
            this.yv = -(Math.cos(this.direction) * this.speed * deltaTime);
        }

        this.x += this.xv;
        this.y += this.yv;
        // enemy-to-enemy collisions
        for (let i = 0; i < level.enemies.length; i++) {
            const otherEnemy = level.enemies[i];
            if (this.x > otherEnemy.x && this.x < otherEnemy.x + otherEnemy.width && this.y > otherEnemy.y && this.y < otherEnemy.y + otherEnemy.height) {
                // start merge timer
                // dont question it
                this.mergeTimer += deltaTime / 2;
                otherEnemy.mergeTimer += deltaTime / 2;
                // when they stuck for too long they merge (1 sec?)
                if (this.mergeTimer > 1000 && otherEnemy.mergeTimer > 1000) {
                    // hardcode width & height to 32, make size dependent on max health more
                    let merged = new Enemy((this.x + otherEnemy.x) / 2, (this.y + otherEnemy.y) / 2, 32, 32, (this.direction + otherEnemy.direction) / 2, this.maxhealth + otherEnemy.maxhealth);
                    merged.speed = (this.speed + otherEnemy.speed) / 1.5;
                    merged.health = this.health + otherEnemy.health;
                    merged.damage = this.damage + otherEnemy.damage;
                    merged.worth = this.worth + otherEnemy.worth;
                    level.enemies.push(merged);
                    console.log(merged);

                    this.active = false;
                    otherEnemy.active = false;
                }
            }
        }

        for (var i = 0; i < playersSorted.length; i++) {
            const player = playersSorted[i];
            if (this.x > player.x && this.x < player.x + player.width && this.y > player.y && this.y < player.y + player.height) {
                player.takeDamage(this.damage, {
                    direction: this.direction,
                    strength: 5
                });
            }
        }

    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x + level.CAMX, this.y + level.CAMY, this.width, this.height);
    }

    takeDamage(damage, level = level, knockback = {
        direction: 0,
        strength: 0
    }, ignoreInvulnerability = false) {
        //This function is called from the projectiles, since I don't want another tick loop
        //Deducts HP and kills if hp <= 0

        //for some reason, the enemy dies multiple times in a single tick
        //thank goodness I had the most op weapon ever, otherwise I wouldn't have found this
        if (!this.active) {
            return;
        }
        this.health -= damage;
        //deal kb dmg

        this.xv = Math.sin(knockback.direction) * knockback.strength * deltaTime;
        this.yv = -(Math.cos(knockback.direction) * knockback.strength * deltaTime);
        this.stunned = 1000;

        if (this.health <= 0) {
            //get all changes of this.active before drawing
            this.onDeath(level)
        }

    }

    onDeath(level = lvl) {
        this.active = false;
        level.collectibles.push(new Collectible(this.x, this.y, 16, 16, 1, TEXTURES.collectible.coin))
    }
}

class Projectile {
    constructor(owner, x, y, type, direction, damage = 10, range = 300, speed = 0.7, width = 8, height = 8, texture = TEXTURES.projectile.playerbullet, ) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.type = type;
        this.direction = direction
        this.frame = 0;

        this.damage = damage;
        this.range = range;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.texture = texture;

        this.active = true;
    }

    tick(level = lvl) {
        this.frame += deltaTime;
        this.x += Math.sin(this.direction) * this.speed * deltaTime;
        this.y -= Math.cos(this.direction) * this.speed * deltaTime;

        for (let e = 0; e < level.enemies.length; e++) {
            const enemy = level.enemies[e];

            if (this.x > enemy.x && this.x < enemy.x + enemy.width && this.y > enemy.y && this.y < enemy.y + enemy.height) {
                //deletes both sprites
                enemy.takeDamage(this.damage, level, {
                    direction: this.direction,
                    strength: (this.damage) / (enemy.maxhealth) * 5
                });
                this.active = false;
            }

        }

        if (this.frame > this.range) {
            this.active = false;
        }
    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x + level.CAMX, this.y + level.CAMY, this.width, this.height);
        if (this.type == "DebugMarker") {
            level.ctx.font = "13px PixelOperator"
            level.ctx.fillText(`${this.x},${this.y}`, this.x + level.CAMX, this.y + level.CAMY)
        }
    }
}

class Collectible {
    constructor(x, y, width = 16, height = 16, value = 1, texture = TEXTURES.collectible.coin) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.texture = texture;
        this.speed = 5;
        this.value = value,
            this.direction = 0;

        this.active = true;
    }

    tick(level = lvl) {
        //when colliding with a player, give them money
        var playersSorted = level.players.concat()
        playersSorted.sort(function (a, b) {
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2)
        });

        if (this.active) {
            let target = playersSorted[0];
            let dist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2)
            if (dist < target.width) {
                target.money += this.value;
                SOUNDS.collectible.coin.play()
                this.active = false;
            } else if (dist < 300) {
                this.direction = Math.atan2(target.x - (this.x), -(target.y - (this.y)))
                this.x += Math.sin(this.direction) * ((299 - dist) / 200 + 0.1) * deltaTime;
                this.y -= Math.cos(this.direction) * ((299 - dist) / 200 + 0.1) * deltaTime;
            }
        }

    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x + level.CAMX, this.y + level.CAMY, this.width, this.height);
    }
}

class UIElement {
    constructor(name, value, texture, x, y, visible) {
        this.name = name;
        this.value = value;
        this.texture = texture
        this.x = x;
        this.y = y;
        this.visible = visible;
    }

    tick(level = lvl) {}
    draw(level = lvl) {}
}

class Label extends UIElement {
    constructor(name, value, texture = TEXTURES.empty, x, y, color = "#FFFFFF", font = "10px PixelOperator,monospace,sans-serif", visible = true) {
        super(name, value, texture, x, y, visible)
        this.color = color;
        this.font = font;

    }
    tick(level = lvl, value = null) {
        this.value = value ?? this.value;
    }
    draw(level = lvl) {
        if (!this.visible) {
            return;
        }
        level.ctx.drawImage(this.texture, this.x, this.y)
        if (this.value != "") {
            // this.value == "" = no text needed
            level.ctx.font = this.font;
            level.ctx.fillStyle = this.color;
            let metrics = level.ctx.measureText(this.value)
            let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            level.ctx.fillText(this.value, this.x + this.texture.width, this.y + actualHeight / 2 + this.texture.width / 2)
        }

    }
}

class Button extends UIElement {
    constructor(name, value, texture = TEXTURES.empty, x, y, width, height, _onclick = function (level) {}) {
        super(name, value, texture, x, y);
        this.width = width;
        this.height = height;
        this.onclick = _onclick;
        this.hovered = false;
        this.clicked = false;
    }

    tick(level = lvl) {
        if (level.controls.mousePosition.x > this.x && level.controls.mousePosition.x < this.x + this.width && level.controls.mousePosition.y > this.y && level.controls.mousePosition.y < this.y + this.height) {
            this.hovered = true;
        } else {
            this.hovered = false;
        }

        // capture clicks
        if (level.controls.mouseTracker.downPos.x > this.x && level.controls.mouseTracker.downPos.x < this.x + this.width && level.controls.mouseTracker.downPos.y > this.y && level.controls.mouseTracker.downPos.y < this.y + this.height) {
            if (level.controls.mouseTracker.clickPos.x > this.x && level.controls.mouseTracker.clickPos.x < this.x + this.width && level.controls.mouseTracker.clickPos.y > this.y && level.controls.mouseTracker.clickPos.y < this.y + this.height) {
                if (level.controls.mouseTracker.click) {
                    //personally i like if loops like this
                    level.controls.mouseTracker.click = false;
                    this.onclick();
                }
            }
        }
    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x, this.y)
    }
}

class UIContainer {
    constructor(uiElements = {},visible = true) {
        this.uiElements = uiElements;
        this.visible = visible;
    }

    tick(level = lvl) {
        if (!this.visible) {
            return
        }
        for (let uiElement in this.uiElements) {
            this.uiElements[uiElement].tick(level);
        }
    }
    
    draw(level = lvl) {
        if (!this.visible) {
            return
        }
        for (let uiElement in this.uiElements) {
            this.uiElements[uiElement].draw(level);
        }
    }
}

class Level {
    constructor(name = "Untitled", canvas_ = canvas) {
        this.name = name; //idk what to do with this
        this.canvas = canvas_;
        this.ctx = canvas.getContext('2d');
        //fix this only if needed
        this.ctx.contextSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;

        this.CAMX = width / 2;
        this.CAMY = height / 2;

        this.players = [];
        this.players.push(new Player(0, 0, 32, 32));

        this.enemies = [];
        this.enemyspawntimer = 0;
        this.maxEnemies = 100;

        this.projectiles = [];

        this.collectibles = [];

        this.paused = false;

        // this all could be displayed with html and css, but i'm not THAT good
        // might change after release
        this.uiContainer = new UIContainer({
            coinCounter: new Label("coinCounter", 0, TEXTURES.ui.coin, 50, 50, "#FFFFFF", "20px PixelOperator,sans-serif"),
            healthBar: new Label("healthBar", 0, TEXTURES.ui.health, 50, 100, "#FFDDDD", "20px PixelOperator,sans-serif"),

            generalDisplay: new Label("generalDisplay", 0, TEXTURES.empty, 50, 700, "#CCCCFF", "40px PixelOperator,sans-serif"),

            upgradeContainer: new UIContainer({
                upgradeShop: new Label("upgradeShop", "", TEXTURES.ui.upgradeShop, 272, 180, "#FFFFFF", "20px PixelOperator,sans-serif", false),
                upgradeButton: new Button("upgradeButton", 0, TEXTURES.ui.upgradeButton, 64, 200, 32, 32, function (level = lvl) {
                    // onclick
                    level.paused = !level.paused;

                    //its js what can go wrong...
                    level.uiContainer.uiElements.upgradeContainer.uiElements.upgradeShop.visible = !level.uiContainer.uiElements.upgradeContainer.uiElements.upgradeShop.visible;
                }),
            }),

        })

        // temp for now, probably will become THE solution

        this.uiContainer.uiElements.coinCounter.tick = function (level, value) {
            this.value = "MONEY: " + level.players[0].money;
        }
        this.uiContainer.uiElements.healthBar.tick = function (level, value) {
            this.value = "HP: " + level.players[0].health;
        }
        this.uiContainer.uiElements.generalDisplay.tick = function (level, value) {
            this.value = "FPS: " + String(Math.round(1000 / deltaTime)).padStart(3, '0') + ", DT: " + deltaTime;
        }

        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,
            pistol: false,
            shotgun: false,
            smg: false,
            mousePosition: {
                x: 0,
                y: 0,
            },

            mouseTracker: { // for ui buttons
                // DONT PUT ANY UI ELEMENTS AT (0,0)
                // IT MOST LIKELY WILL MESS IT UP
                // or not
                downPos: {
                    x: 0,
                    y: 0,
                },
                clickPos: {
                    x: 0,
                    y: 0,
                },
                click: false
            }

        }
    }
    getControls() {
        this.controls.up = (allControls["w"] || allControls["W"] || allControls["ArrowUp"]) ?? false;
        this.controls.down = (allControls["s"] || allControls["S"] || allControls["ArrowDown"]) ?? false;
        this.controls.left = (allControls["a"] || allControls["A"] || allControls["ArrowLeft"]) ?? false;
        this.controls.right = (allControls["d"] || allControls["D"] || allControls["ArrowRight"]) ?? false;
        this.controls.shoot = (allControls[" "] || mouse.down) ?? false;
        
        this.controls.pistol = (allControls["1"]) ?? false;
        this.controls.shotgun = (allControls["2"]) ?? false;
        this.controls.smg = (allControls["3"]) ?? false;

        //DEBUG ONLY
        this.controls.debug = (allControls["f"] || allControls["F"]) ?? false;

        this.controls.mousePosition = mouse.position;
        this.controls.mouseTracker = mouse.tracker;
    }

    spawnEnemy() {
        let dist = Math.sqrt(width**2+height**2)/2;
        //generate random angle
        let deg = Math.random() * Math.PI * 2
        //use math: x = r × cos( θ ) y = r × sin( θ )
        //focus on P1 for now, although in future might use the middle of screen
        let basePos = {
            x: this.players[0].x,
            y: this.players[0].y
        };

        this.enemies.push(new Enemy(basePos.x + dist * Math.cos(deg), basePos.y + dist * Math.sin(deg), 32, 32))
    }

    tick() {
        if (this.paused) {
            this.uiContainer.tick(this);
            return;
        }
        this.getControls()
        this.uiContainer.tick(this);

        // level tick:
        // enemy spawning
        this.enemyspawntimer -= deltaTime
        if (this.enemyspawntimer <= 0) {
            this.enemyspawntimer = 2000;
            if (this.enemies.length < this.maxEnemies) {
                this.spawnEnemy()
            }
        }

        // tick players
        this.CAMX = width / 2;
        this.CAMY = height / 2;
        this.players = this.players.filter(player => player.active);
        for (let player = 0; player < this.players.length; player++) {
            this.players[player].move(this);
            this.CAMX += -this.players[player].x + this.players[player].width / 2;
            this.CAMY += -this.players[player].y + this.players[player].height / 2;
        }
        for (let player = 0; player < this.players.length; player++) {
            this.players[player].aftertick(this);
        }
        // tick enemies
        this.enemies = this.enemies.filter(enemy => enemy.active);
        for (let enemy = 0; enemy < this.enemies.length; enemy++) {
            this.enemies[enemy].tick(this);
        }

        // tick projectiles
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
        for (let projectiles = 0; projectiles < this.projectiles.length; projectiles++) {
            this.projectiles[projectiles].tick(this)
        }

        // tick collectibles
        this.collectibles = this.collectibles.filter(collectible => collectible.active);
        for (let collectibles = 0; collectibles < this.collectibles.length; collectibles++) {
            this.collectibles[collectibles].tick(this)
        }

    }
    draw() {
        // draw bg - 9 times for scrollings
        // probably could optimize it better
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX % width, 0 + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX % width, 0 + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX % width, 0 + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX % width, width + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX % width, width + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX % width, width + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX % width, -width + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX % width, -width + this.CAMY % height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX % width, -width + this.CAMY % height)

        for (let enemy = 0; enemy < this.enemies.length; enemy++) {
            this.enemies[enemy].draw()
        }
        for (let player = 0; player < this.players.length; player++) {
            this.players[player].draw()
        }

        for (let projectile = 0; projectile < this.projectiles.length; projectile++) {
            this.projectiles[projectile].draw()
        }
        for (let collectible = 0; collectible < this.collectibles.length; collectible++) {
            this.collectibles[collectible].draw()
        }

        this.uiContainer.draw(this);
    }
}

const lvl = new Level("Level 1", canvas);

function tick() {
    lvl.tick();
}

function draw() {
    lvl.draw()
}

function loop() {
    //get deltatime
    now = Date.now();
    deltaTime = now - lastUpdate;
    lastUpdate = now;
    // console.log(1000/deltaTime)
    tick();
    draw();
}

function addEventListeners() {
    document.addEventListener("keydown", function (e) {
        allControls[e.key] = true;
    })
    document.addEventListener("keyup", function (e) {
        allControls[e.key] = false;
    })
    document.addEventListener("mousedown", function (e) {
        mouse.down = true;
        mouse.tracker.downPos = {
            x: e.offsetX,
            y: e.offsetY
        }
    });
    document.addEventListener("mouseup", function (e) {
        mouse.down = false;
    });
    document.addEventListener("click", function (e) {
        // mouse.down is false, as up comes right before click
        mouse.tracker.clickPos = {
            x: e.offsetX,
            y: e.offsetY
        }
        mouse.tracker.click = true;
    });

    document.addEventListener("mousemove", function (e) {
        mouse.position.x = e.offsetX;
        mouse.position.y = e.offsetY;

    });

}
let loopnumber = 0;
window.onload = () => {
    addEventListeners();
    document.body.appendChild(canvas);
    loopnumber = setInterval(loop, 1);

}