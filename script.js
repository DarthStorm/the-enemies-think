canvas =  HTMLCanvasElement();
canvas.parent = document.body;
width = 1080;
height = 720;
canvas.width = width;
canvas.height = height;
canvas.id = 'canvas';


ctx = canvas.getContext('2d');

/*
The Enemies Think

TODO: think of a better name

the enemy thinks. see how long you can surive for.
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

function tick() {
    
}

function draw(){

}

function loop(){
    tick();
    draw();
}

window.onload = () => {
    canvas = document.getElementById("canvas");
    setInterval(loop(),30);
    console.log(canvas);
}