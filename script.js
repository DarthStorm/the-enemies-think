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
    down: false,
    position: {
        x: 0,
        y: 0
    }
}

function loadTexture(src = "") {
    let x = new Image();
    x.src = "assets/" + src;
    return x;
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
        upgradeShop: loadTexture("ui/upgradeshop.png")
    },
    debug: {
        debug1: loadTexture("debug1.png"),
        debug2: loadTexture("debug2.png"),
    }
};

function newWeapon(type_ = "", baseProjectile = {
    count: 1,
    spread: 0,
    damage: 10,
    range: 2000,
    speed:0.7,
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

const WEAPONS = {
    //weapons
    // ridiculously op:
    op:{
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
            size:30,
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

};

class Player {
    //this is a player. 
    constructor(x, y, width = 64, height = 64, texture = TEXTURES.player.idle, weapon = WEAPONS.op.SonicBoom, maxhealth = 10000000) {
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

        this.money = 0;

        this.active = true;
    }

    // for player we use a very special tick method, that, now that i think of it, was very unnecessary
    // but im still doing it regardless not falling into technical debt
    tick(level = lvl) {
    }

    // movement to set cam x&y first
    move(level = lvl) {
        console.log(level.CAMX, level.CAMY)
        if (this.invul > 0) {
            this.invul -= deltaTime;
        }
        this.attackCooldown -= deltaTime;
        if (this.stunned > 0) {
            this.stunned -= deltaTime;
            this.xv *= deltaTime/(deltaTime+10);
            this.yv *= deltaTime/(deltaTime+10);
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
    aftertick(level = lvl){
        //point towards cursor
        this.direction = Math.atan2((level.controls.mousePosition.x - level.CAMX) - (this.x + this.width / 2), -((level.controls.mousePosition.y - level.CAMY) - (this.y + this.height / 2)))
        if (level.controls.shoot && this.attackCooldown <= 0) {
            this.weapon.onAttack(this, level);
            this.attackCooldown = this.weapon.stats.fireRate;
        }
    }

    draw(level = lvl) {
        //draw player
        if (this.invul > 0 && Math.round(this.invul/10) % 2 == 0) {
            let prevAlpha = level.ctx.globalAlpha;
            level.ctx.drawImage(this.texture, this.x+level.CAMX, this.y+level.CAMY, this.width, this.height);
        }
        level.ctx.drawImage(this.texture, this.x+level.CAMX, this.y+level.CAMY, this.width, this.height);
        //DEBUG
        level.ctx.fillText(`x:${this.x}, y:${this.y}`,this.x+level.CAMX, this.y+level.CAMY);
        level.ctx.fillText(`${level.controls.mousePosition.x-level.CAMX},${level.controls.mousePosition.y-level.CAMY}`,level.controls.mousePosition.x,level.controls.mousePosition.y);
    }
    takeDamage(damage,knockback = {direction:0,strength:0}, ignoreInvulnerability = false) {
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
        this.width = width;
        this.height = height;
        this.direction = direction
        this.texture = texture;
        this.maxhealth = maxhealth;
        this.speed = 0.1;
        this.health = this.maxhealth;
        this.damage = 5

        this.stunned = 0;
        this.active = true;
    }

    tick(level = lvl) {
        var playersSorted = level.players.concat() // makes a new array. but HOW
        playersSorted.sort(function (a, b) {
            // dist between 2 points
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2)
        });

        this.direction = Math.atan2(playersSorted[0].x - (this.x), -(playersSorted[0].y - (this.y)))
        this.xv = Math.sin(this.direction) * this.speed * deltaTime;
        this.yv = -(Math.cos(this.direction) * this.speed * deltaTime);
        this.x += this.xv;
        this.y += this.yv; 

        for (var i = 0; i < playersSorted.length; i++){
            const player = playersSorted[i];
            if (this.x > player.x && this.x < player.x + player.width && this.y > player.y && this.y < player.y + player.height) {
                player.takeDamage(this.damage,{direction:this.direction,strength:5});
            } 
        }

    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x+level.CAMX, this.y+level.CAMY, this.width, this.height);
    }

    takeDamage(damage,level=level,knockback = {direction:0,strength:0}, ignoreInvulnerability = false) {
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
        level.collectibles.push(new Collectible(this.x, this.y, 16, 16, 1,TEXTURES.collectible.coin))
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
                enemy.takeDamage(this.damage,level,{direction: this.direction,strength:(this.damage)/(enemy.maxhealth)});
                this.active = false;
            }

        }

        if (this.frame > this.range) {
            this.active = false;
        }
    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x+level.CAMX, this.y+level.CAMY, this.width, this.height);
        if (this.type == "DebugMarker") {
            level.ctx.font = "13px PixelOperator"
            level.ctx.fillText(`${this.x},${this.y}`,this.x+level.CAMX,this.y+level.CAMY)
        }
    }
}

class Collectible {
    constructor(x, y, width = 16, height = 16, value=1, texture = TEXTURES.collectible.coin) {
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

    tick(level=lvl) {
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
                this.active = false;
            } else if (dist < 300){
                this.direction = Math.atan2(target.x - (this.x), -(target.y - (this.y)))
                this.x += Math.sin(this.direction) * ((299-dist)/200 + 0.1) * deltaTime;
                this.y -= Math.cos(this.direction) * ((299-dist)/200 + 0.1) * deltaTime;
            }
        }
        
    }

    draw(level = lvl) {
        level.ctx.drawImage(this.texture, this.x+level.CAMX, this.y+level.CAMY, this.width, this.height);
    }
}

class UIElement {
    constructor(name,value,texture,x,y){
        this.name = name;
        this.value = value;
        this.texture = texture
        this.x = x;
        this.y = y;
    }

    tick(level=lvl){}
    draw(level=lvl){}
}

class Label extends UIElement {
    constructor(name,value,texture=TEXTURES.empty,x,y,color="#FFFFFF",font="10px PixelOperator,monospace,sans-serif"){
        super(name,value,texture,x,y)
        this.color = color;
        this.font = font;
        
   }
    tick(level=lvl,value=null){
        this.value = value??this.value;
    }
    draw(level=lvl){
        level.ctx.drawImage(this.texture,this.x,this.y)

        level.ctx.font = this.font;
        level.ctx.fillStyle = this.color;
        let metrics = level.ctx.measureText(this.value)
        let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        level.ctx.fillText(this.value,this.x + this.texture.width,this.y + actualHeight/2 + this.texture.width/2)

    }
}

class Button extends UIElement {
    constructor(name,value,texture=TEXTURES.empty,x,y,width,height,_onclick=function(level) {}){
        super(name,value,texture,x,y);
        this.width = width;
        this.height = height;
        this.onclick = _onclick;
        this.hovered = false;
        this.clicked = false;
    }

    tick(level=lvl){
        if (level.controls.mousePosition.x > this.x && level.controls.mousePosition.x < this.x + this.width && level.controls.mousePosition.y > this.y && level.controls.mousePosition.y < this.y + this.height) {
            this.hovered = true;    
        } else {
            this.hovered = false;
        }
    }

    draw(level=lvl){
        level.ctx.drawImage(this.texture,this.x,this.y)
   }
}

class UIContainer {
    constructor(uiElements = {}){
        this.uiElements = uiElements;
    }

    tick(level=lvl){
        for (let uiElement in this.uiElements) {
            this.uiElements[uiElement].tick(level);
        }
    }

    draw(level=lvl){
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

        this.CAMX = width/2;
        this.CAMY = height/2;

        this.players = [];

        this.players.push(new Player(0,0, 32, 32));

        this.enemies = [];

        //test
        this.enemies.push(new Enemy(0, 0, 32, 32));

        this.enemyspawntimer = 0;

        this.projectiles = [];

        this.collectibles = [];

        this.uiContainer = new UIContainer({
            coinCounter: new Label("coinCounter",0,TEXTURES.ui.coin,50,50,"#FFFFFF","20px PixelOperator,sans-serif"),
            healthBar: new Label("healthBar",0,TEXTURES.ui.health,50,100,"#FFDDDD","20px PixelOperator,sans-serif"),
            
            generalDisplay: new Label("generalDisplay",0,TEXTURES.empty,50,700,"#CCCCFF","40px PixelOperator,sans-serif"),

            upgradeShop: new Button("upgradeShop",0,TEXTURES.ui.upgradeShop,64,200,32,32),
        })

        // temp for now, probably will become THE solution

        this.uiContainer.uiElements.coinCounter.tick = function (level,value) {
            this.value = "MONEY: " + level.players[0].money;
        }
        this.uiContainer.uiElements.healthBar.tick = function (level,value) {
            this.value = "HP: " + level.players[0].health;
        }
        this.uiContainer.uiElements.generalDisplay.tick = function (level,value) {
            this.value = "FPS: " + String(Math.round(1000/deltaTime)).padStart(3, '0') + ", DT: " + deltaTime;
        }


        this.controls = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false,

            mousePosition: {
                x: 0,
                y: 0,
            },

        }
    }
    getControls() {
        this.controls.up = (allControls["w"] || allControls["W"] || allControls["ArrowUp"]) ?? false;
        this.controls.down = (allControls["s"] || allControls["S"] || allControls["ArrowDown"]) ?? false;
        this.controls.left = (allControls["a"] || allControls["A"] || allControls["ArrowLeft"]) ?? false;
        this.controls.right = (allControls["d"] || allControls["D"] || allControls["ArrowRight"]) ?? false;
        this.controls.shoot = (allControls[" "] || mouse.down) ?? false;

        //DEBUG ONLY
        this.controls.debug = (allControls["f"] || allControls["F"]) ?? false;

        this.controls.mousePosition = mouse.position;
    }

    spawnEnemy() {
        let dist = (width > height ? width : height) / 2;
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
        this.getControls()

        // level tick:
        // enemy spawning
        this.enemyspawntimer -= deltaTime
        if (this.enemyspawntimer <= 0) {
            this.enemyspawntimer = 2000
            this.spawnEnemy()
        }

        // tick players
        this.CAMX = width/2;
        this.CAMY = height/2;
        this.players = this.players.filter(player => player.active);
        for (let player = 0; player < this.players.length; player++) {
            this.players[player].move(this);
            this.CAMX += -this.players[player].x + this.players[player].width/2;
            this.CAMY += -this.players[player].y + this.players[player].height/2;
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

        this.uiContainer.tick(this);

    }
    draw() {
        //draw bg - 9 times for scrollings
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX%width, 0 + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX%width, 0 + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX%width, 0 + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX%width, width + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX%width, width + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX%width, width + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, 0 + this.CAMX%width, -width + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, width + this.CAMX%width, -width + this.CAMY%height)
        this.ctx.drawImage(TEXTURES.bg, -width + this.CAMX%width, -width + this.CAMY%height)



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
        this.ctx.fillStyle = "#ACACAC"
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
    });
    document.addEventListener("mouseup", function (e) {
        mouse.down = false;
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