var _ = require( 'lodash' );

function parseVal( platform, val ) {
	if( _.isObject( val ) && val.length === undefined ) {
		return val[ platform ] || val[ '*' ] || undefined;
	} else {
		return val;
	}
}

function hashStep( platform, step ) {
	var cwd = step.cwd || step.path || './';
	var cmd = step.cmd || step.command;
	var args = step.args || step.arguments || []
	return { 
		path: parseVal( platform, cwd ),
		command: parseVal( platform, cmd ),
		arguments: parseVal( platform, args )
	};
}

function stringStep( step ) {
	var parts = step.split( ':' );
	var cwd, cmd;
	if( parts.length > 1 ) {
		cwd = parts[ 0 ];
		cmd = parts[ 1 ];
	} else {
		cwd = './';
		cmd = parts[ 0 ];
	}
	parts = cmd.split( ' ' );
	cmd = parts.shift();
	args = parts;
	return {
		path: cwd,
		command: cmd,
		arguments: args || []
	}
}

function grokStep( platform, step ) {
	if( _.isString( step ) ) {
		return stringStep( step );
	} else if( _.isObject( step ) ) {
		if( step.cmd || step.command || step.cwd || step.path || step.args || step.arguments ) {
			return hashStep( platform, step );
		} else {
			return grokStep( platform, step[ platform ] || step[ '*' ] );
		}
	}
}

function commandSet( platform, raw ) {
	if( raw.platforms ) {
		var subset = raw.platforms[ platform ] || raw.platforms[ '*' ];
		return subset ? commandSet( platform, subset ) : {};
	}
	var stepKeys = _.keys( _.omit( raw, '_revisions' ) );
	var baseline = _.reduce( stepKeys, function( acc, k ) {
		var step = grokStep( platform, raw[ k ] );
		if( step ) {
			acc[ k ] = step;
		}
		return acc;
	}, {} );
	if( raw._revisions ) {
		var revisions = raw._revisions[ platform ] || raw._revisions[ '*' ] || {};
		_.each( revisions, function( v, k ) {
			if( !v ) {
				delete baseline[ k ];
			} else {
				var step = grokStep( platform, v );
				baseline[ k ] = _.merge( baseline[ k ], step );
			}
		} );
	}
	return baseline;
}

module.exports = commandSet;