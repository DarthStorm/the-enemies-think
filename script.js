const canvas = document.createElement('canvas');
canvas.parent = document.body;
const width = 1080;
const height = 720;
canvas.width = width;
canvas.height = height;
canvas.id = 'canvas';

/*
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


class Player{
    //this is a player. 
    constructor(x,y,width=32,height=32,color = "#FF7777"){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }
    tick(level=lvl){
        console.log("playertick");//i WILL use tick, trust
    }
    draw(level=lvl){
        //draw player
        level.ctx.fillStyle = this.color;
        level.ctx.fillRect(this.x,this.y,this.width,this.height);
    }
}

class Level{
    constructor(name = "Untitled",canvas_ = canvas){
        this.name = name;//idk what to do with this
        this.canvas = canvas_;
        this.ctx = canvas.getContext('2d');
        
        this.players = []
        
        this.players.push(new Player(0,0,32,32))
    }

    tick(){
        //tick players
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].tick()
        }
    }
    draw(){
        //draw bg
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        //draw players
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].tick()   
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

window.onload = () => {
    document.body.appendChild(canvas);
    setInterval(loop(),30);
    console.log(canvas);
}