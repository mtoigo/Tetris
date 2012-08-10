
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};


var base = {
	'refresh_rate': 1000,
	'colors': {
		'red': 'rgb(200,0,0)',
		'blue': 'rgb(17, 100, 204)',
		'green': 'rgb(9, 150, 16)'
	},
	'square': 30,
	'key_hold': false,
	'active_piece': null,
	'ctx': null,
	'grid_size': [10, 16],
	'grid': [],
	'complete_rows': [], 
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
				[2, 1]
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
	'init': function() {
		
		this._get_canvas();
		this._init_grid();
		
		//DEBUG BELOW
		//this._new_piece();
		//this.progress();
	},
	'start': function () {
		
		this._new_piece();
		this.interval = setInterval(base.progress, this.refresh_rate);
	},
	'progress': function() {

		var last_active_piece_position = base.active_piece;

		base._clear_active_piece();
		base._draw_piece(last_active_piece_position.type, last_active_piece_position.x, last_active_piece_position.y+1, last_active_piece_position.rotation);

		//TODO - messing with normal movement
		if(base.key_hold) {
			base.move_piece(base.key_hold);
		}

		base._add_piece_to_grid();
		base._draw_grid();

	},
	'rotate_piece': function() {
		
		var next_rotation = base.active_piece.rotation + 1;
		if(next_rotation == base.available_piece_types[base.active_piece.type].length) {
			next_rotation = 0;
		}
		
		//Case where a rotation will put a piece off screen
		var new_x = base.active_piece.x;
		if(base._piece_dimensions(base.active_piece.type, next_rotation).x + base.active_piece.x > base.grid_size[0]) {
			new_x = new_x - 1;
		}
		
		var last_active_piece_position = base.active_piece;
		base._clear_active_piece();
		base._draw_piece(last_active_piece_position.type, new_x, last_active_piece_position.y, next_rotation);

		this._add_piece_to_grid();
		this._draw_grid();
	},
	'move_piece': function(direction) {
		
		var offset = -1;
		if(direction == 'right') {
			offset = 1;
		}
		
		//Check for grid edges
		var in_grid = false;
		if((this.active_piece.x + offset >= 0) && (this.active_piece.x + base._piece_dimensions(this.active_piece.type, this.active_piece.rotation).x + offset <= this.grid_size[0])) {
			in_grid = true;
		}
		
		//Determine rows to check
		var piece_dimensions = this._piece_dimensions(this.active_piece.type, this.active_piece.rotation);
		var rows_to_check = [];
		var c = this.active_piece.y;
		while(c < (this.active_piece.y + piece_dimensions.y)) {
			rows_to_check.push(c);
			c++;
		}
		
		//Create parallel arrays with how many blocks on the left and right to look over when moving
		var spaces_left_to_check = [10,10,10,10];
		var spaces_right_to_check = [0,0,0,0];
		
		//Loop based on height looking at how far over on each side a piece is
		for(var i = 0;i<piece_dimensions.y;i++) {
			
			//Look through block pattern
			var rotation = this.available_piece_types[this.active_piece.type][this.active_piece.rotation];
			for(var j = 0;j<rotation.length;j++) {
				var distance_right = rotation[j][0] + 1;
				var distance_left = rotation[j][0] + 1;
				
				//Set spaces right to check
				if(rotation[j][1]==i && distance_right > spaces_right_to_check[i]) {
					spaces_right_to_check[i] = distance_right;
				}
				
				//Set spaces left to check
				if(rotation[j][1]==i && distance_left < spaces_left_to_check[i]) {
					spaces_left_to_check[i] = distance_left;
				}
			}
		}

		//Detect blocks in the way of our move
		var valid = true;
		if(in_grid) {
			for(var i = 0;i<rows_to_check.length;i++) {
				//Working
				if(direction=='right') {
					if(this.grid[this.active_piece.x + spaces_right_to_check[i]][this.active_piece.y + i]) {
						valid = false;
					}
				}
				else {
					if(this.active_piece.x - spaces_left_to_check[i] > 0) {
						if(this.grid[this.active_piece.x - spaces_left_to_check[i]][this.active_piece.y + i]) {
							valid = false;
						}
					}
				}
			}
		}

		//Legal Move
		if(valid && in_grid) {
			var last_active_piece_position = base.active_piece;
			base._clear_active_piece();
			this._draw_piece(last_active_piece_position.type, last_active_piece_position.x + offset, last_active_piece_position.y, last_active_piece_position.rotation);
		}
		
		this._draw_grid();
	},
	'_piece_dimensions': function(type, rotation) {
		
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
	'_get_canvas' : function() {
		
		this.ctx = document.getElementById('grid').getContext('2d');
	},
	'_random_piece_key': function() {
		
		var keys = []
		for(var key in this.available_piece_types) {
			keys.push(key);
		}
		return keys[Math.floor(Math.random()*keys.length)];
	},
	'_new_piece': function() {

		var new_x = Math.floor(Math.random()*(this.grid_size[0]-3)+1);
		this._draw_piece(this._random_piece_key(), new_x, 0, 0);
	},
	'_init_grid': function() {
		
		for(var i = 0;i<this.grid_size[0];i++) {
			this.grid.push([]);
			for(var j = 0;j<this.grid_size[1];j++) {
				this.grid[i].push(false);
				//Add one more and make it true to make the bottom of the screen
				if(j+1 == this.grid_size[1]) {
					this.grid[i].push(true);
				}
			}
		}
	},
	'_draw_grid': function() {

		this._check_for_complete_rows();

		this.ctx.fillStyle = this.colors.blue;

		for(var i = 0;i<this.grid.length;i++) {
			for(var j = 0;j<this.grid[i].length;j++) {
				
				this.ctx.strokeStyle = this.colors.red
				this.ctx.strokeRect(i*this.square, j*this.square, this.square, this.square);
				
				if(this.grid[i][j]) {
					this.ctx.fillRect(i*this.square, j*this.square, this.square, this.square);
				}
			}
		}
	},
	'_add_piece_to_grid': function() {
		
		//Detect if the piece should be added to the grid
		var piece_dimensions = this._piece_dimensions(this.active_piece.type, this.active_piece.rotation);

		//Determine columns to check
		var columns_to_check = [];
		var c = this.active_piece.x;
		while(c < (this.active_piece.x + piece_dimensions.x)) {
			columns_to_check.push(c);
			c++;
		}
		
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
		
		//Detect a vertical hit
		var hit = false;
		for(var i = 0;i<columns_to_check.length;i++) {
			var column = this.grid[columns_to_check[i]];
			//Hit or bottom
			if((column[this.active_piece.y + spaces_down_to_check[i]])) {
				//console.log(this.grid);
				//Add piece to grid
				var piece_shape = this.available_piece_types[this.active_piece.type][this.active_piece.rotation];
				for(var j = 0;j<piece_shape.length;j++) {
					this.grid[this.active_piece.x + piece_shape[j][0]][this.active_piece.y + piece_shape[j][1]] = true;
				}
				this._clear_active_piece();
				this._new_piece();
			}
		}
	},
	'_clear_active_piece': function() {
		this.ctx.clearRect(0,0,300,480);
		this.active_piece = null;
	},
	'_draw_piece': function(piece_type, x_grid_offset, y_grid_offset, rotation) {
		
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
	'_check_for_complete_rows': function() {

		//Remove complete rows
		if(this.complete_rows.length > 0) {

			//Transform the grid to have rows before columns (y before x)
			var new_grid = [];
			for(var i = 0;i<this.grid[0].length;i++) {
				var new_row = []
				for(var j = 0;j<this.grid.length;j++) {
					
					new_row.push(this.grid[j][i]);
				}				
				new_grid.push(new_row);
			}
			
			//Fresh Empty Row
			var new_row = []
			for(var i = 0;i<new_grid[0].length;i++) {
				new_row.push(false);
			}

			//Remove Rows and Add Empty Ones Up Top
			for(var i = 0;i<this.complete_rows.length;i++) {
				console.log('REMOVE' + this.complete_rows[i]);
				new_grid.remove(this.complete_rows[i]);
				new_grid.unshift(new_row);
			}
	
			//Convert back to normal grid (x before y)
			for(var i = 0;i < new_grid[0].length;i++) {
				for(var j = 0;j < new_grid.length;j++) {
					this.grid[i][j] = new_grid[j][i];
				}
			}
			
			console.log(this.grid);
			
			//Reset
			this.complete_rows = [];
		}
		
		//console.log(this.grid);
		//Check for complete rows (ignore row below bottom line)
		//console.log(this.grid[0].length);
		for(var i = 0;i<this.grid[0].length-1;i++) {
			var complete = true;
			for(var j = 0;j<this.grid.length;j++) {
				if(!this.grid[j][i]) {
					complete = false;
				}
			}
			//Ignore our bottom most row
			if(complete) {
				this.complete_rows.push(i);
			}
		}
		
		//Process them
		for(var i = 0;i<this.complete_rows.length;i++) {
			
			//Clear rows
			for(var j = 0;j<this.grid.length;j++) {
				this.grid[j][this.complete_rows[i]] = false;
			}

			//Light up row
			this.ctx.fillStyle = this.colors.green;
			this.ctx.fillRect(0, this.complete_rows[i]*this.square, this.square*this.grid_size[0], this.square);
		}
		
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
				base.key_hold = 'left';
			break;
			//Right
			case 39:
				base.move_piece('right');
				base.key_hold = 'right';
			break;
			//Down
			case 40:
				base.progress();
		}
	});

	$(window).bind('keyup', function(e) {
		base.key_hold = false
	});
});


