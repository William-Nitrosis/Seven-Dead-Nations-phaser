var game = new Phaser.Game(1920, 1080, Phaser.AUTO, '', { preload: preload, create: create, update: update });

// global variables
var keyLeft;


function preload() {
	game.load.image('player', 'assets/player.png');
	game.load.image('background', 'assets/background.jpg');
	game.load.image('gun', 'assets/gun.png');
	game.load.image('bullet', 'assets/bullet.png');
	game.load.image('enemy', 'assets/enemy.png');
	game.load.image('testWall', 'assets/testWall.png');
	game.load.image('grenade', 'assets/grenade.png');
	
	// levels and tiles
	game.load.tilemap('map', 'level1/level1.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.image('tiles', 'level1/WallTileSet.png');
}

var map;
var layer;

function create() {
	// Window scaling
	this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	this.game.scale.setShowAll();
	window.addEventListener('resize', function () {
		this.game.scale.refresh();
	} );
	this.game.scale.refresh();
	
	// enable physics
	game.physics.startSystem(Phaser.Physics.ARCADE);
	
	// background
	game.add.tileSprite(0, 0, 3840, 2140, 'background');
	
	
	map = game.add.tilemap('map');
  map.addTilesetImage('WallTileSet', 'tiles');
	walls = map.createLayer('walls');
	map.setCollisionBetween(1, 100000, true, 'walls');
	walls.resizeWorld();
	
	// player
	player = game.add.sprite(game.world.width / 4, game.world.height / 4, 'player');
	// enable player physics
	game.physics.arcade.enable(player);
	// player bounce value for physics
	player.body.bounce.y = 0.2;
	// collide with screen edges
	game.world.setBounds(0, 0, 3840, 2140);
	player.body.collideWorldBounds = true;
	// set centre to centre
	player.anchor.setTo(0.5, 0.5);
	// Camera follow player
	game.camera.follow(player);
	// player vars
	playerHealth = 10;
	player.health = playerHealth;
	// player health bar
	player.healthBar = new HealthBar(this.game, {x: 200, y: 100, width: 320, height: 50, animationDuration: 50});
	
	// Gunstuff
	gun = player.addChild(game.add.sprite(0, 16, 'gun'));
	// set centre of gun
	gun.anchor.setTo(0, 0.5);
	// gun fire rate cooldown
	cooldown = 10;
	// create bullet group
	bullets = game.add.group();
	bullets.enableBody = true;
	
	// grenade
	
	
	// enable keyboard inputs
	keyboard = game.input.keyboard.createCursorKeys();
	keyLeft = game.input.keyboard.addKey(Phaser.Keyboard.A);
	keyRight = game.input.keyboard.addKey(Phaser.Keyboard.D);
	keyDown = game.input.keyboard.addKey(Phaser.Keyboard.S);
	keyUp = game.input.keyboard.addKey(Phaser.Keyboard.W);
	keyG = game.input.keyboard.addKey(Phaser.Keyboard.G);
	
	// create enemy group
	enemies = game.add.group();
	enemies.enableBody = true;
	enemies.physicsBodyType = Phaser.Physics.ARCADE;
	enemyHealth = 5;
	

	rnd = new Phaser.RandomDataGenerator();
	
	for (i = 0; i <= 30; i++) { spawnEnemy(); }
	
}

function update() {
	
	// reset players physics movement variable
	player.body.velocity.x = 0;
	player.body.velocity.y = 0;
	
	// check for inputss
	if (keyLeft.isDown) 	{ player.body.velocity.x = -150; }	// move left
	if (keyRight.isDown) 	{ player.body.velocity.x = 150; }		// move right
	if (keyUp.isDown) 		{ player.body.velocity.y = -150; }	// move up
	if (keyDown.isDown) 	{ player.body.velocity.y = 150; }		// move down
	if (keyG.isDown) 	{ throwGrenade(); }		// move down
	
	// rotate the player sprite towards the mouse
	player.rotation = game.physics.arcade.angleToPointer(player);
	// update healthbar position
	player.healthBar.setPosition(game.camera.x + 200, game.camera.y + 100);
	
	// check if left button is down
	if (game.input.activePointer.leftButton.isDown && cooldown < 0) {
		// get mouse x and y
		mouseX = game.input.mousePointer.x;
		mouseY = game.input.mousePointer.y;
		
		// make bullet and shoot it
		activeBullet = game.add.sprite(player.x, player.y, 'bullet');
		activeBullet.rotation = game.physics.arcade.angleToPointer(player);
		game.physics.arcade.enable(activeBullet);
		game.physics.arcade.moveToPointer(activeBullet, 600);
		bullets.add(activeBullet);
		cooldown = 10;
		
		} else {
			cooldown -= 1;
		}
	
	// collisions
	this.game.physics.arcade.collide(player, enemies, hitPlayer, null, this);
	this.game.physics.arcade.collide(enemies, enemies);
	this.game.physics.arcade.collide(enemies, walls);
	this.game.physics.arcade.collide(player, walls);
	this.game.physics.arcade.collide(bullets, walls, bulletKill, null, this);
  this.game.physics.arcade.overlap(bullets, enemies, hitEnemy, null, this);
	
	// enemy follow player
	enemies.forEach(game.physics.arcade.moveToXY, this, true, player.x, player.y, 100);
	enemies.forEach(updateHealthBarPos, this, true, this);
	
	
}

function updateHealthBarPos(obj) {
	obj.healthBar.setPosition(obj.x, obj.y -32);
	obj.hitCooldown -= 1;
}


function hitEnemy(bullet, enemy) {
	bullet.kill();
	enemy.health -=1;
	enemy.healthBar.setPercent(enemy.health * (100 / enemyHealth));
	
	if (enemy.health <= 0) {
		enemy.healthBar.kill();
		enemy.kill();
	}
}

function bulletKill(bullet, wall) {  
	bullet.kill();
}

function hitPlayer(player, enemy) {
	if (enemy.hitCooldown <= 0) {
		player.health -= 1;
		player.healthBar.setPercent(player.health * (100 / playerHealth));
		enemy.hitCooldown = 10;
	}
	
}

function spawnEnemy() {
	side = rnd.between(1,4);
	
	switch (rnd.between(1,4)) {
		case 1:
			enemy = game.add.sprite(rnd.between(0, game.world.width), -50, 'enemy');
			break;
		case 2:
			enemy = game.add.sprite(rnd.between(0, game.world.width), game.world.height + 50, 'enemy');
			break;
		case 3:
			enemy = game.add.sprite(-50, rnd.between(0, game.world.height), 'enemy');
			break;
		case 4:
			enemy = game.add.sprite(game.world.width + 50, rnd.between(0, game.world.height), 'enemy');
			break;
	}
	
	// enable enemy physics
	game.physics.arcade.enable(enemy);
	// enemy bounce value for physics
	enemy.body.bounce.y = 0.2;
	// set centre to centre
	enemy.anchor.setTo(0.5, 0.5);
	enemy.health = enemyHealth;
	// health bar
	enemy.healthBar = new HealthBar(this.game, {x: enemy.x, y: enemy.y - 32, width: 32, height: 5, animationDuration: 50});
	// hit cooldown
	enemy.hitCooldown = 10;

	// add enemy to group
	enemies.add(enemy);
}

function throwGrenade() {
	 grenade = game.add.sprite(player.x, player.y, 'grenade');
}


















