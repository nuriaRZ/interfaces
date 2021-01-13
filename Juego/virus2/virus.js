// nos marca los pulsos del juego
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame        ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function ( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
arrayRemove = function (array, from) {
    var rest = array.slice((from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
};

var game = (function() {
    //variables del juego
    var canvas,
    ctx,
    scoreCanvas,
    scoreCTX,
    player,
    virus,
    playerShot,
    bgMain, 
    totalVirus = 7,   
    virusSpeed = 1,
    playerLife = 3,
    shotSpeed = 5,
    playerSpeed = 5,
    virusCounter = 0,
    lost = false,
    win = false,
    minHorizontalOffset = 100, //min y max desplazamiento horizontal
    maxHorixontalOffset = 400,
    virusShots = 5, // cantidad de disparos del virus al principio
    virusLife = 3, //cantidad de disparos que necesita el virus para morir al principio
    finalVirusShots = 10, //cantidad de disparos del virus en la fase final
    finalVirusLife = 5, //cantidad de disparos que necesitará el virus para morir en la fase final
    playerShotsArray = [] , //array para almacenar cantidad de disparos del jugador
    virusShotsArray = [], //array para almacenar cantidad de disparos del virus
    virusShotImage = new Image(),
    playerShotImage = new Image(),
    playerKilledImage = new Image (),
    playerImage = new Image(),
    virusImage = new Image(),
    keyMap = {
        left: 37,
        right: 39,
        shoot: 32 
    },
    nextPlayerShot = 0,
    playerShotDelay = 250,
    now = 0;

    function loop(){
        uptade();
        draw();
    }

    function preloadImages(){
        virusImage.src = 'images/virusImg.png';
        virusShotImage.src = 'images/virusShot.png';
        virusShotImage.height=100;
        virusShotImage.width=100;
        playerImage.src = 'images/playerImg.png';
        playerShotImage.src = 'images/playerShot';
        playerShotImage.height=100;
        playerShotImage.width=100;
        bgMain = new Image();
        bgMain.src = 'images/fondo.jpg';

    }

    function init(){
        preloadImages();
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext("2d");
        scoreCanvas = document.createElement('canvas');
        scoreCanvas.width = canvas.width;
        scoreCanvas.height = canvas.height;
        scoreCTX = scoreCanvas.getContext('2d');

        player = new Player(playerLife, 0);
        virusCounter = 1;
        createNewVirus();
        showLifeAndScore();

        addListener(document, 'keydown', keyDown);
        addListener(document, 'keyup', keyUp);

        function gameLoop(){
            update();
            draw();
            requestAnimFrame(gameLoop);
        }
        gameLoop();
    }

    function showLifeAndScore (){
        scoreCTX.fillStyle="rgb(59,59,59)";
        scoreCTX.font="bold 16px Arial";
        scoreCTX.fillText("Puntos: "+player.score, canvas.width - 100, 20);
        scoreCTX.fillText("Vidas: "+player.life, canvas.width - 100, 40);
    }

    function getRandomNumber(max){
        return Math.floor(Math.random() * max);
    }

    function Player(life, score){
        var settings = {
            marginBottom: 10,
            defaultHeight: 66,
        };
        player = new Image();
        player.src = 'images/playerImg.png';
        player.posX = (canvas.width /2) - (player.width/2);
        player.posY = canvas.height - (player.height == 0 ? settings.defaultHeight:player.height)-settings.marginBottom;
        player.life = life;
        player.score;
        player.dead = false;
        player.speed = playerSpeed;

        var shoot = function (){
            if(nextPlayerShot < now || now == 0){
                playerShot = new playerShot(player.posX + (player.width/2) - 5, player.posY);
                playerShot.add();
                now += playerShotDelay;
                nextPlayerShot = now + playerShotDelay;
            }else {
                now = new Date().getTime();
            }
        };

        player.doAnything = function(){
            if(player.dead) return;

            if(keyPressed.left && player.posX > 5)
                player.posX -= player.speed;
            if(keyPressed.right && player.posX < (canvas.width - player.width-5))
            player.posX += player.speed;
            if(keyPressed.shoot)
            shoot();
            

        };

        player.killPlayer = function(){
            if(this.life > 0){
                this.dead = true;
                virusShots.splice(0, virusShotsArray.length);
                playerShots.splice(0, playerShotsArray.length);
                this.src = playerKilledImage.src;
                createNewVirus();
                setTimeout(function (){
                    player = new Player(player.life-1, player.score);
                }, 500);
            }else {
                lost = true;
            }
        };
        return player;
    }

    //DISPAROS

    function Shot(x, y, array, img){
        this.posX = x;
        this. posY = y;
        this.image = img;
        this.speed = shotSpeed;
        this.identifier = 0;
        this.add = function(){
            array.push(this);

        };
        this.deleteShot = function (id){
            arrayRemove(array, id);
        };
    }

    function PlayerShot(x, y){
        Object.getPrototypeOf(PlayerShot.prototype).contructor.call(this, x, y, playerShotsArray, playerShotImage);
        this.isHittingVirus = function(){
            return (!virus.dead && this.posX >= virus.posX && this.posX <= (virus.posX + virus.image.width) && 
            this.posY >= virus.posY && this.posY <= (virus.posY + virus.image.height));
        };
    }
    
    PlayerShot.prototype = Object.create(Shot.prototype);
    PlayerShot.prototype.constructor = PlayerShot;

    function VirusShot (x,y){
        Object.getPrototypeOf(VirusShot.prototype).contructor.call(this, x, y, virusShotsArray, virusShotImage);
        this.isHittingPlayer = function(){
            return (this.posX >= player.posX && this.posX <= (player.posX + player.width)
                && this.posY >= player.posY && this.posY <= (player.posY + player.height));
        };
    }
    VirusShot.prototype = Object.create(Shot.prototype);
    VirusShot.prototype.constructor = VirusShot;

    //ENEMIGOS

    function Virus(life, shots){
        virus = new Image();
        virus.src = 'images/virusImg.png';
        this.posX = getRandomNumber(canvas.width - this.virus.width);
        this.posY = -50;
        this.life = life ? life : virusLife;
        this.speed = virusSpeed;
        this.shots = shots ? shots : virusShots;
        this.dead = false;

        var horizontalMove = minHorizontalOffset + getRandomNumber(maxHorixontalOffset-minHorizontalOffset);
        this.minX = getRandomNumber(canvas.width-horizontalMove);
        this.maxX = this.minX + horizontalMove - 40;
        this.direction = 'D';


        this.kill = function(){
            this.dead = true;
            //muerto
        };

        this.update = function(){
            this.posY += this.goDownSpeed;
            if (this.direction === 'D') {
                if (this.posX <= this.maxX) {
                    this.posX += this.speed;
                } else {
                    this.direction = 'I';
                    this.posX -= this.speed;
                }
            } else {
                if (this.posX >= this.minX) {
                    this.posX -= this.speed;
                } else {
                    this.direction = 'D';
                    this.posX += this.speed;
                }
            }
        };

        this.isOutOfScreen = function(){
            return this.posY > (canvas.height + 15);
        };

        function shoot(){
            if(virus.shots > 0 && !virus.dead){
                var disparo = new VirusShot(virus.posX + (virus.image.width / 2) - 5, virus.posY + virus.image.height);
                disparo.add();
                virus.shots--;
                setTimeout(function(){
                    shoot();
                }, getRandomNumber(3000)); 
            }
        }
        setTimeout(function(){
            shoot();
        }, 1000+getRandomNumber(2500));
    
        this.toString = function(){
            return 'Enemigo con vidas:'+ this.life+ 'shots: '+ this.shots+' puntos por matar: '+this.pointsToKill;
        }
    }

    function Virus (vidas, disparos) {
        Object.getPrototypeOf(Virus.prototype).constructor.call(this, vidas, disparos, virusImage);
        this.goDownSpeed = virusSpeed;
        this.pointsToKill = 5 + virusCounter;
    }


    function createNewVirus() {
        if (totalVirus != 1) {
            virus = new Virus(virusLife + virusCounter - 1, virusShots + virusCounter - 1);
        } else {
           // virus = new FinalBoss();
        }
    }

    function isVirusHittingPlayer() {
        return ( ( (virus.posY + virus.image.height) > player.posY && (player.posY + player.height) >= virus.posY ) &&
            ((player.posX >= virus.posX && player.posX <= (virus.posX + virus.image.width)) ||
                (player.posX + player.width >= virus.posX && (player.posX + player.width) <= (virus.posX + virus.image.width))));
    }

    function checkCollisions(shot) {
        if (shot.isHittingVirus()) {  
            if (virus.life > 1) {
                virus.life--;
            } else {
                virus.kill();
                player.score += virus.pointsToKill;
            }
            shot.deleteShot(parseInt(shot.id));
            return false;
        }
        return true;
    }

    function playerAction() {
        player.doAnything();
    }

    function addListener(element, type, expression, bubbling) {
        bubbling = bubbling || false;

        if (window.addEventListener) { // Standard
            element.addEventListener(type, expression, bubbling);
        } else if (window.attachEvent) { // IE
            element.attachEvent('on' + type, expression);
        }
    }

    function keyDown(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = true;
            }
        }
    }

    function keyUp(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = false;
            }
        }
    }

    function draw() {
        ctx.drawImage(score, 0, 0);
    }

    function showGameOver() {
        scoreCTX.fillStyle="rgb(255,0,0)";
        scoreCTX.font="bold 35px Arial";
        scoreCTX.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    }

    function getTotalScore() {
        return player.score + player.life * 5;
    }

    function update() {

        drawBackground();

        if (lost) {
            showGameOver();
            return;
        }

        scoreCTX.drawImage(player, player.posX, player.posY);
       // scoreCTX.drawImage(virus, virus.posX, virus.posY);

       

        for (var j = 0; j < playerShotsArray.length; j++) {
            var disparoPlayer = playerShotsArray[j];
            updatePlayerShot(disparoPlayer, j);
        }

        if (isVirusHittingPlayer()) {
            player.killPlayer();
        } else {
            for (var i = 0; i < virusShotsArray.length; i++) {
                var virusShot = virusShotsArray[i];
                updateVirusShot(virusShot, i);
            }
        }

        showLifeAndScore();

        playerAction();
    }

    function updatePlayerShot(playerShot, id) {
        if (playerShot) {
            playerShot.id = id;
            if (checkCollisions(playerShot)) {
                if (playerShot.posY > 0) {
                    playerShot.posY -= playerShot.speed;
                   scoreCTX.drawImage(playerShot.image, playerShot.posX, playerShot.posY);
                } else {
                    playerShot.deleteShot(parseInt(playerShot.id));
                }
            }
        }
    }

    function updateVirusShot(virusShot, id) {
        if (virusShot) {
            virusShot.id = id;
            if (!virusShot.isHittingPlayer()) {
                if (virusShot.posY <= canvas.height) {
                    virusShot.posY += virushot.speed;
                    scoreCTX.drawImage(virusShot.image, virusShot.posX, virusShot.posY);
                } else {
                    virusShot.deleteShot(parseInt(virusShot.id));
                }
            } else {
                player.killPlayer();
            }
        }
    }

    function drawBackground() {
        var background;
        background = bgMain;
     /*   if (virus instanceof FinalBoss) {
            background = bgBoss;
        } else {
            background = bgMain;
        }*/
        ctx.drawImage(background, 0, 0);
    }

    

    


    return {
        init: init
    }
    
})();