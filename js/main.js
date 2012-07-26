//Put pieces in a grid when they land

var base = {
	'refresh_rate': 1000,
	'colors': {
		'red': 'rgb(200,0,0)',
		'blue': 'rgb(17, 100, 204)'
	},
	'square': 30, 
	'available_piece_types': {
		'long': [
			[
				[0, 0],
				[0, 1],
				[0, 2],
				[0, 3]
			],
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[3, 0]
			]
		],
		'j': [
			[
				[1, 0],
				[1, 1],
				[1, 2],
				[0, 2]
			],
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[2, 1]
			],
			[
				[0, 0],
				[1, 0],
				[0, 1],
				[0, 2]
			],
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[0, 1]
			]
		],
		'l': [
			[
				[0, 0],
				[0, 1],
				[0, 2],
				[1, 2]
			],
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[0, 1]
			],
			[
				[0, 0],
				[1, 0],
				[1, 1],
				[1, 2]
			],
			[
				[0, 1],
				[1, 1],
				[2, 1],
				[2, 0]
				
			]
		],
		'square': [
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[1, 0]
			]
		],
		'z' : [
			[
				[0, 0],
				[1, 0],
				[1, 1],
				[2, 1]
			],
			[
				[1, 0],
				[1, 1],
				[0, 1],
				[0, 2]
			]
		],
		's' : [
			[
				[0, 1],
				[1, 1],
				[1, 0],
				[2, 0]
			],
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[1, 2]
			]
		],
		't' : [
			[
				[0, 1],
				[1, 0],
				[1, 1],
				[2, 1]
			], 
			[
				[0, 0],
				[0, 1],
				[0, 2],
				[1, 1]
			],
			[
				[0, 0],
				[1, 0],
				[2, 0],
				[1, 1]
			],
			[
				[0, 1],
				[1, 0],
				[1, 1],
				[1, 2]
			]
		]
	},
	'piece_dimensions': function(type, rotation) {
		
		var blocks = this.available_piece_types[type][rotation];
		var dimensions = {x: 0, y: 0};
		
		for(var i = 0;i<blocks.length;i++) {
			var largest_y = blocks[i][1] + 1;
			var largest_x = blocks[i][0] + 1;
			if(largest_y > dimensions.y) {
				dimensions.y = largest_y;
			}
			if(largest_x > dimensions.x) {
				dimensions.x = largest_x;
			}
		}
		
		return dimensions;
	},
	
	'active_piece': null,
	'ctx': null,
	'grid_size': [10, 16],
	'init': function() {
		this.get_canvas();
		this.init_grid();
		this.new_piece();
		this.add_piece_to_grid();
	},
	'get_canvas' : function() {
		this.ctx = document.getElementById('grid').getContext('2d');
	},
	'start': function () {
		this.interval = setInterval(base.progress, this.refresh_rate);
	},
	'random_piece_key': function() {
		var keys = []
		for(var key in this.available_piece_types) {
			keys.push(key);
		}
		return keys[Math.floor(Math.random()*keys.length)];
	},
	'new_piece': function() {

		var new_x = Math.floor(Math.random()*(this.grid_size[0]-3)+1);
		this.draw_piece(this.random_piece_key(), new_x, 0, 0);
	},
	'progress': function() {

		var last_active_piece_position = base.active_piece;

		base.clear_active_piece();
		base.draw_piece(last_active_piece_position.type, last_active_piece_position.x, last_active_piece_position.y+1, last_active_piece_position.rotation);

		base.add_piece_to_grid();
		base.draw_grid();
	},
	'init_grid': function() {
		
		for(var i = 0;i<this.grid_size[0];i++) {
			this.grid.push([]);
			for(var j = 0;j<this.grid_size[1];j++) {
				this.grid[i].push(false);
				//Add one more and make it true to make the bottom of the screen
				if(j+1 == this.grid_size[1]) {
					console.log('LAST');
					this.grid[i].push(true);
				}
			}
		}
		
		this.draw_grid();
	},
	'draw_grid': function() {

		this.ctx.fillStyle = this.colors.blue;

		for(var i = 0;i<this.grid.length;i++) {
			for(var j = 0;j<this.grid[i].length;j++) {
				if(this.grid[i][j]) {
					this.ctx.fillRect(i*this.square, j*this.square, this.square, this.square);
				}
			}
		}
	},
	'grid': [],
	'add_piece_to_grid': function() {
		//Detect if the piece should be added to the grid
		
		var piece_dimensions = this.piece_dimensions(this.active_piece.type, this.active_piece.rotation);

		//Determine columns to check
		var columns_to_check = [];
		var c = this.active_piece.x;
		while(c < (this.active_piece.x + piece_dimensions.x)) {
			columns_to_check.push(c);
			c++;
		}
		console.log(columns_to_check);
		
		//Create parallel array with how many blocks down to count on each column based on it shape
		var spaces_down_to_check = [0,0,0];
		//Loop based on width looking at how many blocks down each is
		for(var i = 0;i<piece_dimensions.x;i++) {
			
			//Look through block pattern
			var rotation = this.available_piece_types[this.active_piece.type][this.active_piece.rotation];
			for(var j = 0;j<rotation.length;j++) {
				var distance_down = rotation[j][1]+1;
				if(rotation[j][0]==i && distance_down > spaces_down_to_check[i]) {
					spaces_down_to_check[i] = distance_down;
				}
			}
		}		
		console.log(spaces_down_to_check);
		
		//Detect a hit
		var hit = false;
		for(var i = 0;i<columns_to_check.length;i++) {
			var column = this.grid[columns_to_check[i]];
			//Hit or bottom
			if((column[this.active_piece.y + spaces_down_to_check[i]])) {
				
				//Add piece to grid
				var piece_shape = this.available_piece_types[this.active_piece.type][this.active_piece.rotation];
				for(var j = 0;j<piece_shape.length;j++) {
					this.grid[this.active_piece.x + piece_shape[j][0]][this.active_piece.y + piece_shape[j][1]] = true;
				}
				this.clear_active_piece();
				this.new_piece();
			}
		}
		
		
	},
	'clear_active_piece': function() {
		this.ctx.clearRect(0,0,600,600);
		this.active_piece = null;
	},
	'draw_piece': function(piece_type, x_grid_offset, y_grid_offset, rotation) {
		this.ctx.fillStyle = this.colors.red;
		
		//Track our piece
		this.active_piece = {'type': piece_type, 'x': x_grid_offset, 'y': y_grid_offset, 'rotation': rotation};
		
		//Defaults
		var x_grid_offset = typeof x_grid_offset !== 'undefined' ? x_grid_offset : 0;
		var y_grid_offset = typeof y_grid_offset !== 'undefined' ? y_grid_offset : 0;

		for(var i = 0;i<this.available_piece_types[piece_type][rotation].length;i++) {
			var square = this.available_piece_types[piece_type][rotation][i];
			this.ctx.fillRect(square[0]*this.square + this.square*x_grid_offset, square[1]*this.square + this.square*y_grid_offset, this.square, this.square);
		}
		
	},
	'rotate_piece': function() {
		
		
		
		var next_rotation = base.active_piece.rotation + 1;
		if(next_rotation == base.available_piece_types[base.active_piece.type].length) {
			next_rotation = 0;
		}
		
		//Case where a rotation will put a piece off screen
		var new_x = base.active_piece.x;
		if(base.piece_dimensions(base.active_piece.type, next_rotation).x + base.active_piece.x > base.grid_size[0]) {
			new_x = new_x - 1;
		}
		
		var last_active_piece_position = base.active_piece;
		base.clear_active_piece();
		base.draw_piece(last_active_piece_position.type, new_x, last_active_piece_position.y, next_rotation);
		
		this.draw_grid();
	},
	'move_piece': function(direction) {
		
		var offset = -1;
		if(direction == 'right') {
			offset = 1;
		}
		
		if((this.active_piece.x + offset >= 0) && (this.active_piece.x + base.piece_dimensions(this.active_piece.type, this.active_piece.rotation).x + offset <= this.grid_size[0])) {
			var last_active_piece_position = base.active_piece;
			base.clear_active_piece();
			this.draw_piece(last_active_piece_position.type, last_active_piece_position.x + offset, last_active_piece_position.y, last_active_piece_position.rotation);
		}
		this.draw_grid();
	},
	'render': function() {
		
				
	}
}

$(document).ready(function() {
	base.init();
	
	$('#start').click(function() {
		base.start();
	});
	
	$(window).bind('keydown', function(e) {
		switch(e.keyCode) {
			//Space
			case 32:
				base.rotate_piece();
			break;
			//Left
			case 37:
				base.move_piece('left');
			break;
			//Right
			case 39:
				base.move_piece('right');
			break;
			//Down
			case 40:
				base.progress();
		}
	});
});


