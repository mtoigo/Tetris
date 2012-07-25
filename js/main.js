//Put pieces in a grid when they land

var base = {
	'refresh_rate': 1000,
	'colors': {
		'red': 'rgb(200,0,0)'
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
	'pieces_on_screen': [],
	'ctx': null,
	'init': function() {
		this.get_canvas();
		this.render();
	},
	'get_canvas' : function() {
		this.ctx = document.getElementById('grid').getContext('2d');
	},
	'start': function () {
		this.interval = setInterval(base.progress, this.refresh_rate);
	},
	'progress': function() {
		//base.get_canvas();
		
		var last_positions = base.pieces_on_screen;
		base.clear_pieces();
		for(var i = 0;i<last_positions.length;i++) {
			var piece = last_positions[i];
			base.draw_piece(piece.type, piece.x, piece.y+1, piece.rotation);
		}
	},
	'clear_pieces': function() {
		this.ctx.clearRect(0,0,600,600);
		this.pieces_on_screen = [];
	},
	'draw_piece': function(piece_type, x_grid_offset, y_grid_offset, rotation) {
		this.ctx.fillStyle = this.colors.red;
		
		//Track our piece
		this.pieces_on_screen.push({'type': piece_type, 'x': x_grid_offset, 'y': y_grid_offset, 'rotation': rotation});
		
		//Defaults
		var x_grid_offset = typeof x_grid_offset !== 'undefined' ? x_grid_offset : 0;
		var y_grid_offset = typeof y_grid_offset !== 'undefined' ? y_grid_offset : 0;

		for(var i = 0;i<this.available_piece_types[piece_type][rotation].length;i++) {
			var square = this.available_piece_types[piece_type][rotation][i];
			this.ctx.fillRect(square[0]*this.square + this.square*x_grid_offset, square[1]*this.square + this.square*y_grid_offset, this.square, this.square);
		}
		
	},
	'rotate_piece': function() {
		
		var last_positions = base.pieces_on_screen;
		base.clear_pieces();
		var piece = last_positions[0];
		
		var next_rotation = piece.rotation + 1;
		if(next_rotation == base.available_piece_types[piece.type].length) {
			next_rotation = 0;
		}
		
		base.draw_piece(piece.type, piece.x, piece.y, next_rotation);
	},
	'move_piece': function(direction) {
		
		var last_positions = base.pieces_on_screen;
		base.clear_pieces();
		var piece = last_positions[0];
		
		var offset = -1;
		if(direction == 'right') {
			offset = 1;
		}
		this.draw_piece(piece.type, piece.x + offset, piece.y, piece.rotation);
	},
	'render': function() {
		
		
		
		this.draw_piece('t', 0, 0, 0);		
	}
}

$(document).ready(function() {
	base.init();
	
	$('#start').click(function() {
		base.start();
	});
	
	$(window).bind('keydown', function(e) {
		//down 40
		console.log(e.keyCode);
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


