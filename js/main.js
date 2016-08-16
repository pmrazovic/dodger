const ROCKET_SIZE = 15;
const POWER = 0.03;
const PARTICLE_DECAY = 0.1;
const PARTICLE_SIZE = 8;

window.onload = function () {
	// Set the name of the hidden property and the change event for visibility
	var hidden, visibilityChange; 
	if (typeof document.hidden !== "undefined") {
	  hidden = "hidden";
	  visibilityChange = "visibilitychange";
	} else if (typeof document.mozHidden !== "undefined") {
	  hidden = "mozHidden";
	  visibilityChange = "mozvisibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
	  hidden = "msHidden";
	  visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
	  hidden = "webkitHidden";
	  visibilityChange = "webkitvisibilitychange";
	}

	// Back key event listener
	document.addEventListener('tizenhwkey', function(e) {
	  if (e.keyName === "back") {
	      try {
	          tizen.application.getCurrentApplication().exit();
	      } catch (ignore) {}
	  }
	});

	// Visibility change event listener
	document.addEventListener(visibilityChange, function () {
	  if (document[hidden]){
	  	pause = true;
	    document.removeEventListener('click', action);
	    document.removeEventListener('rotarydetent', move);
	  } else {
	    pause = false;
	    countP = 0;
	    if (starting || gameOver) {
	    	document.addEventListener('click', action);
	    } else if (playing) {
	    	document.addEventListener('rotarydetent', move);
	    }
	  }
	}, false);
	// tap event
	document.addEventListener('click', action);
    
    // Setting up the canvas
    var canvas = document.getElementById('canvas'),
        ctx    = canvas.getContext('2d'),
        cH     = ctx.canvas.height = 360,
        cW     = ctx.canvas.width  = 360;

    //General sprite load
    var imgRocket = new Image();
    imgRocket.src = 'images/rocket.png';
    var imgRocketIcon = new Image();
    imgRocketIcon.src = 'images/rocket_icon.png';
    var imgHeart = new Image();
    imgHeart.src = 'images/heart.png';
    var imgRefresh = new Image();
    imgRefresh.src = 'images/refresh.png';
    var spriteExplosion = new Image();
    spriteExplosion.src = 'images/explosion.png';

    //Game
    var points     = 0, 
        speed = 1,
        lives      = 4,
        count      = 0,
        pause      = false,
        countP     = 0,
        playing    = false,
        gameOver   = false,
    	starting = true,
        frame = 0;

    var record = localStorage.getItem("record");
    record = record === null ? 0 : record;
    
    //Player
    var player = new _player();
    //Barriers
    var barriers = [];
    var newBarrier = new _barrier();
    barriers.push(newBarrier);
    
    function move(e) {
        if (e.type == 'rotarydetent') {
        	if (e.detail.direction === "CW") { 
               player.x += 12;
            } else {
                player.x -= 12;
            }
        }

    }
 
    function action(e) {
        e.preventDefault();
        if(gameOver) {
            if(e.type === 'click') {
                gameOver   = false;
                player = new _player();   
                speed = 1;          
                starting = true;
                playing = false;
                count      = 0;
                points     = 0;
                lives = 4;
                document.removeEventListener('rotarydetent', move);
            } 
        } else if (starting) {
        	if(e.type === 'click') {
        		starting = false;
                playing = true;
                document.removeEventListener('click', move);
                document.addEventListener('rotarydetent', move);
        	}
        } else if (playing) {
            if(e.type === 'click') {
                playing = true;
                document.addEventListener('rotarydetent', move);
            }
        }
        
    }

    function _player() {
        this.x = cW/2;
        this.y = 280;
        this.dead = false;
        this.state = 0;
        this.stateX = 0;

        this.draw = function() {
           ctx.drawImage(
            imgRocket,
            this.x - 9,
            this.y - 19 );
        }
        
    }

    function _barrier() {
        this.holeStart = random(30,cH-50,10);
        this.holeSize = random(60,100);
        this.holeEnd = this.holeStart+this.holeSize;
        this.y = -10;
        this.old = false;

        this.draw = function() {
            if (this.old) {
                ctx.globalAlpha = 0.2;
            }
            ctx.strokeStyle = "#f37a21";
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(0,this.y);
            ctx.lineTo(this.holeStart,this.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.holeEnd,this.y);
            ctx.lineTo(cW,this.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    function explosion() {
        ctx.save();

        var spriteY,
            spriteX = 256;
        if(player.state === 0) {
            spriteY = 0;
            spriteX = 0;
        } else if (player.state < 8) {
            spriteY = 0;
        } else if(player.state < 16) {
            spriteY = 256;
        } else if(player.state < 24) {
            spriteY = 512;
        } else {
            spriteY = 768;
        }

        if(player.state === 8 || player.state === 16 || player.state === 24) {
            player.stateX = 0;
        }

        ctx.drawImage(
            spriteExplosion,
            player.stateX += spriteX,
            spriteY,
            256,
            256,
            player.x-60,
            player.y-60,
            120,
            120
        );
        player.state += 1;

        ctx.restore();
    }

    function update() {
    	frame += 1;
    	frame %= 100;

        if (pause) {
            return;
        }

        if (playing) {
            speed = 1 + Math.floor(points/10) * 0.5;
            if (speed > 3) {
                speed = 3;
            }


            // Player circular
            if (player.x > 324) {
                player.x = 36;
            } else if (player.x < 36) {
                player.x = 324;
            }

            // Move barriers
            for (var i = 0; i < barriers.length; i++) {
                barriers[i].y += speed;
            }

            // Remove invisible barriers
            if (barriers[0].y > cH + 2) {
                barriers.splice(0,1);
            }

            // Create new barrier
            if (barriers[barriers.length-1].y > 120) {
                var barrier = new _barrier();
                barriers.push(barrier);
            }

            // Collision detection
            for (var i = 0; i < barriers.length; i++) {
                if (barriers[i].y > 255 && (player.x - 9 <= barriers[i].holeStart || player.x + 9 >= barriers[i].holeEnd) && !player.dead && !barriers[i].old) {
                    player.dead = true;
                } else if (barriers[i].y > 265 && !barriers[i].old && !player.dead) {
                    barriers[i].old = true;
                    points += 1;
                }
            }

            if (player.dead) {
                if (player.state === 31) {
                    lives -= 1;
                    barriers = [];
                    player = new _player();
                    var newBarrier = new _barrier();
                    barriers.push(newBarrier);
                    if (lives === -1) {
                        gameOver = true;
                        playing  = false;
                        document.addEventListener('click',action);
                        document.removeEventListener('rotarydetent',move);
                    }                 
                }
            }

        }
    }
    
    function draw() {
        if (pause) {
            if (countP < 1) {
                countP = 1;
            }
        } else if (playing) {
        	//Clear
            ctx.clearRect(0, 0, cW, cH);

            if (player.dead) {
                explosion();
            } else {
                player.draw();
            }
            

            for (var i = 0; i < barriers.length; i++) {
                barriers[i].draw();
            }
            
            // Drawing HUD ----------------
            // Draw lives
            var startX = 130;
            for (var k = 0; k < lives; k++) {
                ctx.drawImage(
                    imgHeart,
                    startX,
                    35,
                    20,
                    20
                );
                startX += 25;
            }

            // Points
            ctx.font = "14px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.fillText(TIZEN_L10N["score"] + ": " + points, cW/2,330); 

            ctx.font = "14px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.fillText(TIZEN_L10N["record"] + ": " + record, cW/2,25);    
            
        } else if(starting) {
            //Clear
            ctx.clearRect(0, 0, cW, cH);
            ctx.beginPath();

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["title"], cW/2,cH/2 - 120);

            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["tap_to_play"], cW/2,cH/2 - 90);

            ctx.drawImage(
                imgRocketIcon,
                cW/2 - 30,
                cH/2 - 64 );     
              
            ctx.font = "bold 18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["instructions"], cW/2,cH/2 + 90);
              
            ctx.font = "13px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            wrapText(TIZEN_L10N["collect"], cW/2,cH/2 + 115, 220, 14);
            
        } else if(count < 1) {
            count = 1;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.rect(0,0, cW,cH);
            ctx.fill();

            ctx.font = "bold 25px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("Game over",cW/2,cH/2 - 100);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["score"] + ": "+ points, cW/2,cH/2 + 100);

            record = points > record ? points : record;
            localStorage.setItem("record", record);

            ctx.font = "18px Helvetica";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText(TIZEN_L10N["record"] + ": "+ record, cW/2,cH/2 + 125);

            ctx.drawImage(imgRefresh, cW/2 - 23, cH/2 - 23);        	
        }
    }
    
    function init() {
    	update();
        ctx.save();
        draw();
        ctx.restore();
        window.requestAnimationFrame(init);
    }

    init();

    //Utils ---------------------
    function random(from, to) {
        return Math.floor(Math.random() * (to - from + 1)) + from;
    }

    function random(min, max, interval) {
        if(interval === undefined) {
          interval = 1;
        }
        return Math.round((Math.floor(Math.random() * (max - min + 1)) + min) / interval) *interval;
    }

    function euclidianDistance(x1,y1,x2,y2) {
        return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
    }
    
    function wrapText(text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
          var testLine = line + words[n] + ' ';
          var metrics = ctx.measureText(testLine);
          var testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
          }
          else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, y);
      }

};