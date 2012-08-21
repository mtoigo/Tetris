
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
//Random element from an array
Array.prototype.random = function() {
	return this[Math.floor(Math.random()*this.length)]
}

var base = {
	'colors': {
		//Red, green, purple, marine
		'pieces': ['rgb(200,0,0)', 'rgb(17, 100, 204)', 'rgb(134, 12, 211)', 'rgb(20, 135, 152)'],
		'complete_line': 'rgb(9, 150, 16)',
		'block_border': {
			'color': 'rgb(0, 0, 0)',
			'width': 1
		}
	},
	'grid': {
		'tracking': [],
		'square_size': 30,
		'size': [10, 16]
	},
	'settings': {
		'lines_per_level': 10,
		'initial_speed': 1000,
		'level_speed_increase': 100
	},
	'interval': false,
	'key_hold': false,
	'ctx': null,
	'complete_rows': [],
	'next_piece': false,
	'active_piece': {
		'info': {
			'type': false,
			'rotation': false,
			'x': false,
			'y': false,
			'color': false
		},
		'dimensions': function(rotation) {
			if(rotation==undefined) {
				rotation = this.info.rotation;
			}

			var blocks = base.available_piece_types[this.info.type][rotation];
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
		'columns': function(rotation) {
			
			if(rotation==undefined) {
				rotation = this.info.rotation;
			}
			
			var columns_to_check = [];
			var c = this.info.x;
			while(c < (this.info.x + this.dimensions(rotation).x)) {
				columns_to_check.push(c);
				c++;
			}
			return columns_to_check
		},
		'rows': function(rotation) {
			
			if(rotation==undefined) {
				rotation = this.info.rotation;
			}

			var rows_to_check = [];
			var c = this.info.y;
			while(c < (this.info.y + this.dimensions(rotation).y)) {
				rows_to_check.push(c);
				c++;
			}
			return rows_to_check;
		},
		'border': function(rotation) {
			
			if(rotation==undefined) {
				rotation = this.info.rotation;
			}
			
			//Create parallel arrays with how many blocks on the left and right to look over when moving
			borders = {
				'left': [0, 0, 0, 0],
				'right': [0, 0, 0, 0],
				'bottom': [0, 0, 0, 0]
			};
			
			var blocks= base.available_piece_types[this.info.type][rotation];

			//Left and Right
			for(var i = 0;i<this.dimensions().y;i++) {
				//Look through block pattern
				for(var j = 0;j<blocks.length;j++) {

					//Set spaces right to check
					var distance_right = blocks[j][0] + 1;
					if(blocks[j][1]==i && distance_right > borders.right[i]) {
						borders.right[i] = distance_right;
					}

					//Set spaces left to check
					var distance_left = blocks[j][0];
					if(blocks[j][1]==i) {
						if(distance_left==0) {
							borders.left[i] = 1;
						}
					}
				}
			}
			
			//Loop based on width looking at how many blocks down each is
			for(var i = 0;i<this.dimensions().x;i++) {

				//Look through block pattern
				for(var j = 0;j<blocks.length;j++) {
					var distance_down = blocks[j][1]+1;
					if(blocks[j][0]==i && distance_down > borders.bottom[i]) {
						borders.bottom[i] = distance_down;
					}
				}
			}
			
			return borders; 
		}
	},
	'status': {
		'score': 0,
		'lines': 0,
		'level': 0
	},
	'available_piece_types': {
		'long': [
			[[0, 0], [0, 1], [0, 2], [0, 3]],
			[[0, 0], [1, 0], [2, 0], [3, 0]]
		],
		'j': [
			[[1, 0], [1, 1], [1, 2], [0, 2]],
			[[0, 0], [0, 1], [1, 1], [2, 1]],
			[[0, 0], [1, 0], [0, 1], [0, 2]],
			[[0, 0], [1, 0], [2, 0], [2, 1]]
		],
		'l': [
			[[0, 0], [0, 1], [0, 2], [1, 2]],
			[[0, 0], [1, 0], [2, 0], [0, 1]],
			[[0, 0], [1, 0], [1, 1], [1, 2]],
			[[0, 1], [1, 1], [2, 1], [2, 0]]
		],
		'square': [
			[[0, 0], [0, 1], [1, 1], [1, 0]]
		],
		'z' : [
			[[0, 0], [1, 0], [1, 1], [2, 1]],
			[[1, 0], [1, 1], [0, 1], [0, 2]]
		],
		's' : [
			[[0, 1], [1, 1], [1, 0], [2, 0]],
			[[0, 0], [0, 1], [1, 1], [1, 2]]
		],
		't' : [
			[[0, 1], [1, 0], [1, 1], [2, 1]], 
			[[0, 0], [0, 1], [0, 2], [1, 1]],
			[[0, 0], [1, 0], [2, 0], [1, 1]],
			[[0, 1],[1, 0], [1, 1], [1, 2]]
		]
	},
	'init': function() {
		
		this.ctx = document.getElementById('grid').getContext('2d');

		//Set up our grid tracking
		for(var i = 0;i<this.grid.size[0];i++) {
			this.grid.tracking.push([]);
			for(var j = 0;j<this.grid.size[1];j++) {
				this.grid.tracking[i].push(false);
				//Add one more and make it true to make the bottom of the screen
				if(j+1 == this.grid.size[1]) {
					this.grid.tracking[i].push(true);
				}
			}
		}
		
		//Next piece
		this.next_piece = {
			'shape': this._random_piece_key(),
			'color': this.colors.pieces.random()
		};
	},
	'start': function () {
		
		this._new_piece();
		this.interval = setInterval($.proxy(this.progress, base), this.settings.initial_speed)
	},
	'progress': function() {

		//Move our active piece down
		var last_active_piece_position = this.active_piece.info;
		this._clear_canvas();
		this._draw_piece(last_active_piece_position.type, last_active_piece_position.x, last_active_piece_position.y+1, last_active_piece_position.rotation);
		
		//Sneak a piece left or right before it hits something if we're holding a key
		if(this.key_hold) {
			this.move_piece(this.key_hold);
		}
		
		this._add_piece_to_grid();
		this._check_for_complete_rows();
		this._draw_grid();
	},
	'rotate_piece': function() {
		
		//Get block pattern for next rotation
		var next_rotation = this.active_piece.info.rotation + 1;
		if(next_rotation == this.available_piece_types[this.active_piece.info.type].length) {
			next_rotation = 0;
		}
		
		//Case where a rotation will put a piece off screen, move it left until we're good
		var x_offset = 0;
		while((this.active_piece.dimensions(next_rotation).x + this.active_piece.info.x) - x_offset > this.grid.size[0]) {
			x_offset = x_offset + 1;
		}
		var old_x = this.active_piece.info.x;
		var new_x = this.active_piece.info.x - x_offset;
		this.active_piece.info.x = new_x; //TODO - Will have to undo if the move is illegal
		
		//Check for overlap with other blocks
		var rows_to_check = this.active_piece.rows(next_rotation);
		var spaces_left_to_check = this.active_piece.border(next_rotation).left;
		var spaces_right_to_check = this.active_piece.border(next_rotation).right;
		var spaces_down_to_check = this.active_piece.border(next_rotation).bottom;
		
		//Check for overlap with existing pieces
		var valid = true;
		for(var i = 0;i<rows_to_check.length;i++) {
			//Right
			for(var j = 0;j<spaces_right_to_check[i];j++) {
				if(this.grid.tracking[this.active_piece.info.x + j][this.active_piece.info.y + i]) {
					valid = false;
				}
			}
			//Left
			for(var j = 0;j<spaces_left_to_check[i];j++) {
				if(this.grid.tracking[this.active_piece.info.x - j][this.active_piece.info.y + i]) {
					valid = false;
				}
			}
			//Below
			for(var j = 1;j<spaces_down_to_check[i]+1;j++) {
				if(this.grid.tracking[this.active_piece.info.x][this.active_piece.info.y + j]) {
					valid = false;
				}
			}
		}
		
		if(valid) {
			//Rotate
			var last_active_piece_position = this.active_piece.info;
			this._clear_canvas();
			this._draw_piece(last_active_piece_position.type, new_x, last_active_piece_position.y, next_rotation);

			this._add_piece_to_grid();
			this._draw_grid();
		}
		else {
			this.active_piece.info.x = old_x;
		}
	},
	'move_piece': function(direction) {
		
		//Track key holding
		this.key_hold = direction;

		var offset = -1;
		if(direction == 'right') {
			offset = 1;
		}
		
		//Check for grid edges
		var in_grid = false;
		if((this.active_piece.info.x + offset >= 0) && (this.active_piece.info.x + this.active_piece.dimensions().x + offset <= this.grid.size[0])) {
			in_grid = true;
		}
		
		//Determine grid rows to check
		var rows_to_check = this.active_piece.rows();
		
		//Create parallel arrays with how many blocks on the left and right to look over when moving
		var spaces_left_to_check = this.active_piece.border().left;
		var spaces_right_to_check = this.active_piece.border().right;

		//Detect blocks in the way of our move
		var valid = true;
		if(in_grid) {
			for(var i = 0;i<rows_to_check.length;i++) {
				if(direction=='right') {
					if(this.grid.tracking[this.active_piece.info.x + spaces_right_to_check[i]][this.active_piece.info.y + i]) {
						valid = false;
					}
				}
				else {
					if(this.active_piece.info.x - spaces_left_to_check[i] > 0) {
						if(this.grid.tracking[this.active_piece.info.x - spaces_left_to_check[i]][this.active_piece.info.y + i]) {
							valid = false;
						}
					}
				}
			}
		}

		//Legal Move
		if(valid && in_grid) {
			var last_active_piece_position = this.active_piece.info;
			this._clear_canvas();
			this._draw_piece(last_active_piece_position.type, last_active_piece_position.x + offset, last_active_piece_position.y, last_active_piece_position.rotation);
			
			this._add_piece_to_grid();
			
			//Cancel our keyhold to prevent clunky movement
			this.key_hold = false;
		}

		this._draw_grid();
	},
	'_random_piece_key': function() {

		var keys = []
		for(var key in this.available_piece_types) {
			keys.push(key);
		}
		return keys.random();
	},
	'_new_piece': function() {
		
		var new_x = Math.floor(Math.random()*(this.grid.size[0]-3)+1);
		this.active_piece.info.color = this.next_piece.color;
		this._draw_piece(this.next_piece.shape, new_x, 0, 0);
		
		this.next_piece = {
			'shape': this._random_piece_key(),
			'color': this.colors.pieces.random()
		};
		
		//Draw our next piece
		var next_ctx = document.getElementById('next').getContext('2d');
		next_ctx.clearRect(0, 0, 200, 200);
		var blocks = this.available_piece_types[this.next_piece.shape][0];
		for(var i = 0; i < blocks.length ; i++) {
			next_ctx.strokeStyle = this.colors.block_border.color;
			next_ctx.lineWidth = this.colors.block_border.width;
			next_ctx.strokeRect(blocks[i][0]*this.grid.square_size, blocks[i][1]*this.grid.square_size, this.grid.square_size, this.grid.square_size);
			next_ctx.fillStyle = this.next_piece.color;
			next_ctx.fillRect(blocks[i][0]*this.grid.square_size, blocks[i][1]*this.grid.square_size, this.grid.square_size, this.grid.square_size);
		}
		
		if(this._add_piece_to_grid()) {
			this._game_over();
		}
	},
	'_game_over': function() {
		clearInterval(this.interval);
		$('#game_over').show();
		$('#play_again').show();
	},
	'_draw_grid': function() {

		for(var i = 0;i<this.grid.tracking.length;i++) {
			for(var j = 0;j<this.grid.tracking[i].length;j++) {
				if(this.grid.tracking[i][j]) {
					this.ctx.strokeStyle = this.colors.block_border.color;
					this.ctx.lineWidth = this.colors.block_border.width;
					this.ctx.strokeRect(i*this.grid.square_size, j*this.grid.square_size, this.grid.square_size, this.grid.square_size);
					
					this.ctx.fillStyle = this.grid.tracking[i][j];
					this.ctx.fillRect(i*this.grid.square_size, j*this.grid.square_size, this.grid.square_size, this.grid.square_size);
				}
			}
		}
	},
	'_add_piece_to_grid': function() {
		
		//Detect if the piece should be added to the grid
		var piece_dimensions = this.active_piece.dimensions();

		//Determine columns to check
		var columns_to_check = this.active_piece.columns();
		var spaces_down_to_check = this.active_piece.border().bottom;
		
		//Detect a vertical hit
		var hit = false;
		for(var i = 0;i<columns_to_check.length;i++) {
			var column = this.grid.tracking[columns_to_check[i]];
			//Hit or bottom
			if((column[this.active_piece.info.y + spaces_down_to_check[i]])) {
				//Add piece to grid
				var piece_shape = this.available_piece_types[this.active_piece.info.type][this.active_piece.info.rotation];
				for(var j = 0;j<piece_shape.length;j++) {
					this.grid.tracking[this.active_piece.info.x + piece_shape[j][0]][this.active_piece.info.y + piece_shape[j][1]] = this.active_piece.info.color;
				}
				
				this._clear_canvas();
				this._new_piece();
				
				return true;
			}
		}
		return false;
	},
	'_clear_canvas': function() {
		this.ctx.clearRect(0, 0 ,this.grid.square_size*this.grid.size[0], this.grid.square_size*this.grid.size[1]);
	},
	'_draw_piece': function(piece_type, x_grid_offset, y_grid_offset, rotation) {
		
		this.ctx.fillStyle = this.active_piece.info.color;
		
		//Track our piece
		this.active_piece.info = {'type': piece_type, 'x': x_grid_offset, 'y': y_grid_offset, 'rotation': rotation, 'color': this.ctx.fillStyle};
		
		//Defaults
		var x_grid_offset = typeof x_grid_offset !== 'undefined' ? x_grid_offset : 0;
		var y_grid_offset = typeof y_grid_offset !== 'undefined' ? y_grid_offset : 0;

		for(var i = 0;i<this.available_piece_types[piece_type][rotation].length;i++) {
			
			var square = this.available_piece_types[piece_type][rotation][i];
			var x_start = square[0]*this.grid.square_size + this.grid.square_size*x_grid_offset;
			var y_start = square[1]*this.grid.square_size + this.grid.square_size*y_grid_offset;
			var size = this.grid.square_size;
			
			//Fill
			this.ctx.fillRect(x_start, y_start, size, size);
			
			//Stroke
			this.ctx.strokeStyle = this.colors.block_border.color;
			this.ctx.lineWidth = this.colors.block_border.width;
			this.ctx.strokeRect(x_start, y_start, size, size);
		}
	},
	'_check_for_complete_rows': function() {

		//Remove complete rows
		if(this.complete_rows.length > 0) {

			//Transform the grid to have rows before columns (y before x)
			var new_grid = [];
			for(var i = 0;i<this.grid.tracking[0].length;i++) {
				var new_row = []
				for(var j = 0;j<this.grid.tracking.length;j++) {
					
					new_row.push(this.grid.tracking[j][i]);
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
				new_grid.remove(this.complete_rows[i]);
				new_grid.unshift(new_row);
			}
	
			//Convert back to normal grid (x before y)
			for(var i = 0;i < new_grid[0].length;i++) {
				for(var j = 0;j < new_grid.length;j++) {
					this.grid.tracking[i][j] = new_grid[j][i];
				}
			}
			
			//Update score
			this.status.lines = this.status.lines + this.complete_rows.length;
			this.status.score = this.status.score + ((this.complete_rows.length * 10) * this.complete_rows.length);
			
			//Level up
			var old_level = this.status.level;
			this.status.level = Math.floor(this.status.lines / this.settings.lines_per_level);
			if(this.status.level != old_level) {				
				var new_speed = this.settings.initial_speed - (this.settings.level_speed_increase * (this.status.level + 1));
				clearInterval(this.interval);
				this.interval = setInterval($.proxy(this.progress, base), new_speed);
			}
			
			//Update Status
			$('#score').html(this.status.score);
			$('#lines').html(this.status.lines);
			$('#level').html(this.status.level);
			
			//Reset
			this.complete_rows = [];
		}
		
		//Check for complete rows (ignore row below bottom line)
		for(var i = 0;i<this.grid.tracking[0].length-1;i++) {
			var complete = true;
			for(var j = 0;j<this.grid.tracking.length;j++) {
				if(!this.grid.tracking[j][i]) {
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
			for(var j = 0;j<this.grid.tracking.length;j++) {
				this.grid.tracking[j][this.complete_rows[i]] = false;
			}

			//Light up row
			this.ctx.fillStyle = this.colors.complete_line;
			this.ctx.fillRect(0, this.complete_rows[i]*this.grid.square_size, this.grid.square_size*this.grid.size[0], this.grid.square_size);
		}
		
	}
}

$(document).ready(function() {
	base.init();
	
	$('#start').click(function() {
		base.start();
		$(this).hide();
	});
	
	$('#play_again').click(function() {
		document.location.reload(true);
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

	$(window).bind('keyup', function(e) {
		base.key_hold = false
	});
});


