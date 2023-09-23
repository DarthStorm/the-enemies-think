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

function loadImage(src = "") {
    let x = new Image();
    x.src = "assets/" + src;
    return x;
}
const images = {
    bg:loadImage("bg.png")
}




class Player {
    //this is a player. 
    constructor(x,y,width=32,height=32,color = "#FFFFFF"){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 10;
    }

    tick(level=lvl){
        this.x += (level.controls.right - level.controls.left) * this.speed;
        this.y += (level.controls.down - level.controls.up) * this.speed;
    }
    draw(level=lvl){
        //draw player
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x,this.y,this.width,this.height);
    }
}

class Enemy {
    constructor(x,y,width=32,height=32,color = "#FF7777"){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 5;
    }

    tick(level=lvl){
        var playersSorted = level.players.concat() // maxes a new array. but HOW
        playersSorted.sort(function(a,b){
            return Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2) - Math.sqrt((a.x - this.x) ** 2 + (a.y - this.y) ** 2) 
        });
    }

    draw(level=lvl){
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x,this.y,this.width,this.height);
    }
}
class Level {
    constructor(name = "Untitled",canvas_ = canvas){
        this.name = name;//idk what to do with this
        this.canvas = canvas_;
        this.ctx = canvas.getContext('2d');
        
        this.players = [];
        
        this.players.push(new Player(0,0,32,32));

        this.enemies = [];

        //test
        this.enemies.push(new Enemy(100,100,32,32));

        this.controls = {
            up:false,
            down:false,
            left:false,
            right:false
        }
    }
    getControls(){
        this.controls.up = (allControls["w"] || allControls["ArrowUp"])??false;
        this.controls.down = (allControls["s"] || allControls["ArrowDown"])??false;
        this.controls.left = (allControls["a"] || allControls["ArrowLeft"])??false;
        this.controls.right = (allControls["d"] || allControls["ArrowRight"])??false;
    }
    tick(){
        this.getControls()
        //tick players
        for (let p = 0; p < this.players.length; p++) {
            this.players[p].tick();
        }
        //tick enemies
        for (let e = 0; e < this.enemies.length; e++) {
            this.enemies[e].tick();
        }
    }
    draw(){
        //draw bg
        this.ctx.drawImage(images.bg,0,0)
        //draw players
        for (let e = 0; e < this.enemies.length; e++) {
            this.enemies[e].draw()
        }
        //draw enemies
        for (let p = 0; p < this.players.length; p++) {
            this.players[p].draw()   
        }
    }
}


const lvl = new Level("Level 1", canvas);

function tick() {
    lvl.tick();
}

function draw(){
    lvl.draw()
}

function loop(){
    tick();
    draw();
}

function addEventListeners(){
    document.addEventListener("keydown", function(e){
        allControls[e.key] = true;
    })
    document.addEventListener("keyup", function(e){
        allControls[e.key] = false;
    })
}

window.onload = () => {
    addEventListeners()
    document.body.appendChild(canvas);
    setInterval(loop,30);
    console.log(canvas);
}