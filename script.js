/*
WARNING
You probably shouldn't be here: this contains the source code for the game.
(not like i mind... for now)

The devlog is in the same directory, at dev.log
Proceed if you're one of my teachers, or someone who wants to look at my code. (yay)




































oh you ignored my warning. well, welcome.
this is my personal project for my IB thing ( i forgot the name )
since you're here, you (hopefully) know how js works,
and/or you're probably a teacher that is evaluating this.
so
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
vscode on top

The Enemies Think
TODO: think of a better name

the enemy thinks. 

see how long you can surive for.
if there are loads of enemies around u and ur taking dmg a lot, enemies will stop coming
and enemies will have a slight stat nerf

if there are no enemies on the screen, enemies WILL come to you with buffs
A LOAD OF BUFFS

you also have buffs, that are very op.
but you can have infinite.
like +10 atk, +30% fire rate, + 5 hp, + health regen every 4 secs
(enemies can stop hp regen)

they think after 2 mins

also all this is subject to change (duh)
this is a concept with potential
i hope
*/
const canvas = document.createElement('canvas');
canvas.parent = document.body;
const width = 1080;
const height = 720;
canvas.width = width;
canvas.height = height;
canvas.id = 'canvas';

const allControls = {

};

const mouse = {
    down: false,
    position: {
        x: 0,
        y: 0
    }
}

function loadImage(src = "") {
    let x = new Image();
    x.src = "assets/" + src;
    return x;
}
const images = {
    bg: loadImage("bg.png"),
    player:{
        idle:loadImage("player.png"),
    },
    enemy:{
        //change later
        basic:loadImage("enemy.png"),
    },
    projectile:{
        playerbullet:loadImage("playerbullet.png"),
    },
    collectible:{
        coin:loadImage("coin.png")
    },
}

function newWeapon(type_ = "", baseProjectile = {
    count: 1,
    spread: 0,
    damage: 10,
    range:50

}, baseStats = {
    fireRate: 12,
}, onAttack_ = undefined) {

    const Weapon = {
        type: type_,
        projectile: baseProjectile,
        stats: baseStats,
        positionProjectiles: function (player, count = this.projectile.count, spread = this.projectile.spread, damage = this.projectile.damage,range = this.projectile.range) {
            if (count == 1) {
                //hardcoded, as everything else seems to have issues
                return [new Projectile(player, player.x + player.width / 2, player.y + player.height / 2, type_, player.direction,damage,range)];
            }
            let res = [];
            let spreadPerBullet = spread / (count-1);
            let baseDirection = player.direction - spread/2
            for(let i = 0; i < count; i++) {
                res.push(new Projectile(player, player.x + player.width / 2, player.y + player.height / 2, type_, baseDirection + spreadPerBullet * i,damage,range));
            }
            return res;
        },
        onAttack: onAttack_ ?? function (player, level) {
            this.projectileList = this.positionProjectiles(player, this.projectile.count, this.projectile.spread)
            for(let pr = 0; pr < this.projectileList.length; pr++) {
                level.projectiles.push(this.projectileList[pr]);

            }
        },
    }

    return Weapon;
}

const WEAPONS = {
    //weapons

    OPTest: newWeapon("OPTest", baseProjectile = {
        count:100,
        spread: 1,
        damage: 100,
        range: 100
    },baseStats={
        fireRate: 5,
    }),

    //normal weapons
    Pistol: newWeapon("Pistol"),
    Shotgun: newWeapon("Shotgun", baseProjectile = {
        count: 4,
        spread: 0.4,
        damage: 7,
        range:20,
        speed:10
    },
    baseStats={
        fireRate: 18,
    }),
    

};

class Player {
    //this is a player. 
    constructor(x, y, width = 32, height = 32, color = "#FFFFFF", weapon = WEAPONS.Pistol, maxhealth = 100) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 10;
        this.weapon = weapon;
        this.maxhealth = maxhealth;

        this.attackCooldown = 0;
        this.direction = 0;
        this.health = this.maxhealth;

        this.active = true;
    }

    tick(level = lvl) {
        this.attackCooldown -= 1;
        this.x += (level.controls.right - level.controls.left) * this.speed;
        this.y += (level.controls.down - level.controls.up) * this.speed;
        //point towards cursor
        this.direction = Math.atan2(level.controls.mousePosition.x - (this.x + this.width / 2), -(level.controls.mousePosition.y - (this.y + this.height / 2)))
        if(level.controls.shoot && this.attackCooldown <= 0) {
            this.weapon.onAttack(this, level);
            this.attackCooldown = this.weapon.stats.fireRate;
        }
    }
    draw(level = lvl) {
        //draw player
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    takeDamage(damage) {
        //This function is called from the enemies (and enemy bullets), since I don't want another tick loop
        //Deducts HP and kills if hp <= 0
        this.health -= damage;
        if(this.health <= 0) {
            //get all declarations of this.active before drawing
            this.active = false;
            this.gameOver();
        }

    }

    gameOver(level = lvl) {
        //placeholder function
    }
}

class Enemy {
    constructor(x, y, width = 32, height = 32, direction = 0, maxhealth = 40, color = "#FF7777") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.direction = direction
        this.color = color;
        this.maxhealth = maxhealth;
        this.speed = 5;
        this.health = this.maxhealth;

        this.active = true;
    }

    tick(level = lvl) {
        var playersSorted = level.players.concat() // makes a new array. but HOW
        playersSorted.sort(function (a, b) {
            // dist between 2 points
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2)
        });

        this.direction = Math.atan2(playersSorted[0].x - (this.x), -(playersSorted[0].y - (this.y)))

        this.x += Math.sin(this.direction) * 3;
        this.y -= Math.cos(this.direction) * 3;

        //take damage

    }

    draw(level = lvl) {
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    takeDamage(damage,level = lvl) {
        //This function is called from the projectiles, since I don't want another tick loop
        //Deducts HP and kills if hp <= 0
        this.health -= damage;
        if(this.health <= 0) {
            //get all declarations of this.active before drawing
            this.onDeath(level)
        }

    }

    onDeath(level=lvl){
        this.active = false;
        level.collectibles.push(new Collectible(this.x,this.y,16,16,"00FFFF"))
    }
}

class Projectile {
    constructor(owner, x, y, type, direction, damage = 10, range=50, width = 8, height = 8, speed = 10, color = "#7777FF", ) {
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
        this.color = color;

        this.active = true;
    }

    tick(level = lvl) {
        this.frame += 1;
        this.x += Math.sin(this.direction) * 20;
        this.y -= Math.cos(this.direction) * 20;

        for(let e = 0; e < level.enemies.length; e++) {
            const enemy = level.enemies[e];

            if(this.x > enemy.x && this.x < enemy.x + enemy.width && this.y > enemy.y && this.y < enemy.y + enemy.height) {
                //deletes both sprites
                enemy.takeDamage(this.damage);
                this.active = false;
            }

        }

        if(this.frame > this.range) {
            this.active = false;
        }
    }

    draw(level = lvl) {
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Collectible {
    constructor(x, y, width = 16, height = 16, color = "#ABCDEF") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 5;

        this.active = true;
    }
    
    tick(){

    }

    draw(level = lvl) {
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Level {
    constructor(name = "Untitled", canvas_ = canvas) {
        this.name = name; //idk what to do with this
        this.canvas = canvas_;
        this.ctx = canvas.getContext('2d');

        this.players = [];

        this.players.push(new Player(500, 500, 32, 32));

        this.enemies = [];

        //test
        this.enemies.push(new Enemy(0, 0, 32, 32));

        this.enemyspawntimer = 0;

        this.projectiles = [];

        this.collectibles = [];

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

        this.controls.mousePosition = mouse.position;
    }
    
    spawnEnemy() {
        let dist = (width>height?width:height)/2;
        console.log(dist);
        //generate random angle
        let deg = Math.random()*Math.PI*2
        //use math: x = r × cos( θ ) y = r × sin( θ )
        //focus on P1 for now, although in future might use the middle of screen
        let basePos = {x:this.players[0].x,y:this.players[0].y};
        this.enemies.push(new Enemy(basePos.x + dist*Math.cos(deg),basePos.y + dist*Math.sin(deg),32,32))

    }

    tick() {
        this.getControls()

        // level tick:
        // enemy spawning
        this.enemyspawntimer -= 1
        if (this.enemyspawntimer <= 0) {
            this.enemyspawntimer = 100
            this.spawnEnemy()
        }


        // tick players
        this.players = this.players.filter(player => player.active);
        for(let player = 0; player < this.players.length; player++) {
            this.players[player].tick(this);
        }
        // tick enemies
        this.enemies = this.enemies.filter(enemy => enemy.active);
        for(let enemy = 0; enemy < this.enemies.length; enemy++) {
            this.enemies[enemy].tick(this);
        }

        // tick projectiles
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
        for(let projectiles = 0; projectiles < this.projectiles.length; projectiles++) {
            this.projectiles[projectiles].tick(this)
        }

        // tick collectibles
        this.collectibles = this.collectibles.filter(collectible => collectible.active);
        for(let collectibles = 0; collectibles < this.collectibles.length; collectibles++) {
            this.collectibles[collectibles].tick(this)
        }
        
    }
    draw() {
        //draw bg
        this.ctx.drawImage(images.bg, 0, 0)

        for(let enemy = 0; enemy < this.enemies.length; enemy++) {
            this.enemies[enemy].draw()
        }
        for(let player = 0; player < this.players.length; player++) {
            this.players[player].draw()
        }
        
        for(let projectile = 0; projectile < this.projectiles.length; projectile++) {
            this.projectiles[projectile].draw()
        }
        for(let collectible = 0; collectible < this.collectibles.length; collectible++) {
            this.collectibles[collectible].draw()
        }
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

window.onload = () => {
    addEventListeners()
    document.body.appendChild(canvas);
    setInterval(loop, 30);

}