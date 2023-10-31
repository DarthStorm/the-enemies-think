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
    bg: loadImage("bg.png")
}


function newWeapon(type_ = "", onAttack_ = (player,level,direction) => {
    if(typeof level == Level) {
        level.projectiles.push(new Projectile(player,player.x+player.width/2,player.y+player.height/2,type_,direction));
    }}) {

    const Weapon = {
        type: type_,
        onAttack: onAttack_
    }

    return Weapon;
}

const WEAPONS = {
    //weapons
    Pistol: newWeapon("Pistol", function(player,level) {
        //tmp
        level.projectiles.push(new Projectile(player,player.x+player.width/2,player.y+player.height/2,"test",player.direction,));
    }),


};


class Player {
    //this is a player. 
    constructor(x, y, width = 32, height = 32, color = "#FFFFFF", weapon = WEAPONS.Pistol) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 10;
        this.weapon = weapon;

        this.attackCooldown = 0;
        this.direction = 0;
    }

    tick(level = lvl) {
        this.attackCooldown -= 1
        this.x += (level.controls.right - level.controls.left) * this.speed;
        this.y += (level.controls.down - level.controls.up) * this.speed;
        console.log(level.controls.mousePosition);
        //point towards cursor
        this.direction = Math.atan2(level.controls.mousePosition.x - (this.x + this.width/2), - (level.controls.mousePosition.y - (this.y + this.height/2)) )
        if (level.controls.shoot && this.attackCooldown <= 0) {
            this.weapon.onAttack(this,level);
            this.attackCooldown = 1;
        }
    }
    draw(level = lvl) {
        //draw player
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}


class Enemy {
    constructor(x, y, width = 32, height = 32, direction = 0, color = "#FF7777") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.direction = direction
        this.color = color;
        this.speed = 5;
    }

    tick(level = lvl) {
        var playersSorted = level.players.concat() // makes a new array. but HOW
        playersSorted.sort(function(a, b) {
            // when the math isnt mathing, question these long lines of math
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2)
        });

        this.direction = Math.atan2(playersSorted[0].x - (this.x), - (playersSorted[0].y - (this.y)) )
        
        this.x += Math.sin(this.direction) * 3;
        this.y -= Math.cos(this.direction) * 3;

    }

    draw(level = lvl) {
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Projectile {
    constructor(owner,x, y, type, direction, width=8, height=8, speed=10, color="#7777FF") {
        //in future add a object ot keep track of ALL these features to better spawn bullets
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.type = type;
        this.direction = direction

        this.width = width;
        this.height = height;
        this.speed = speed;
        this.color = color;
    }

    tick(level = lvl) {
        this.x += Math.sin(this.direction) * 20;
        this.y -= Math.cos(this.direction) * 20;
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

        this.players.push(new Player(0, 0, 32, 32));

        this.enemies = [];

        //test
        this.enemies.push(new Enemy(100, 100, 32, 32));

        this.projectiles = []

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
        this.controls.up = (allControls["w"] || allControls["W"] ||allControls["ArrowUp"]) ?? false;
        this.controls.down = (allControls["s"] || allControls["S"] ||allControls["ArrowDown"]) ?? false;
        this.controls.left = (allControls["a"] || allControls["A"] ||allControls["ArrowLeft"]) ?? false;
        this.controls.right = (allControls["d"] || allControls["D"] ||allControls["ArrowRight"]) ?? false;
        this.controls.shoot = (allControls[" "] || mouse.down) ?? false;

        this.controls.mousePosition = mouse.position;
    }
    tick() {
        this.getControls()
        //tick players
        for(let p = 0; p < this.players.length; p++) {
            this.players[p].tick();
        }
        //tick enemies
        for(let e = 0; e < this.enemies.length; e++) {
            this.enemies[e].tick();
        }

        for(let pr = 0; pr < this.projectiles.length; pr++) {
            this.projectiles[pr].tick()
        }
    }
    draw() {
        //draw bg
        this.ctx.drawImage(images.bg, 0, 0)
        //draw players
        for(let e = 0; e < this.enemies.length; e++) {
            this.enemies[e].draw()
        }
        //draw enemies
        for(let p = 0; p < this.players.length; p++) {
            this.players[p].draw()
        }

        for(let pr = 0; pr < this.projectiles.length; pr++) {
            this.projectiles[pr].draw()
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
    document.addEventListener("keydown", function(e) {
        allControls[e.key] = true;
    })
    document.addEventListener("keyup", function(e) {
        allControls[e.key] = false;
    })
    document.addEventListener("mousedown", function(e) {
        mouse.down = true;
    });
    document.addEventListener("mouseup", function(e) {
        mouse.down = false;
    });
    document.addEventListener("mousemove", function(e) {
        mouse.position.x = e.offsetX;
        mouse.position.y = e.offsetY;
        
    });


}

window.onload = () => {
    addEventListeners()
    document.body.appendChild(canvas);
    setInterval(loop, 30);

}