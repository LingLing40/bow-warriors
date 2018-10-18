export class GameEvent {
	// send server initial data for clients player
	public static authentication: string = 'authentication:successful';

	// server asks for game setup from first client (e.g. bases positions)
	public static setup: string = 'game:setup';

	// server sends team points update
	public static points: string = 'game:points';
}

export class ServerEvent {
	// initial connection of a new client on server
	public static connected: string = 'connection';

	// client did disconnect, but server still receives events
	public static reconnect: string = 'reconnect';

	// client disconnects from server
	public static disconnected: string = 'disconnect';

	// client disconnects from server
	public static stop: string = 'stop';

	// client disconnects from server
	public static reset: string = 'reset';
}

export class PlayerEvent {
	// server informs existing players about new player
	public static joined: string = 'player:joined';

	// server sends list of all other players available
	public static players: string = 'actors:collection';

	// server sends initial data for own player
	public static protagonist: string = 'player:protagonist';

	// client sends own movement coords, server informs others
	public static coordinates: string = 'player:coordinates';

	// client revives himself after dying, server notifies others
	public static revive: string = 'player:revive';

	// client informs server when hit by arrow
	public static hit: string = 'player:hit';

	// server informs others about a player that quit
	public static quit: string = 'player:left';
}

export class ArrowEvent {
	// client shoots arrow
	public static shoot: string = 'arrow:shoot';

	// server triggers arrow creation
	public static create: string = 'arrow:create';

	// client or server triggers arrow destruction
	public static destroy: string = 'arrow:destroy';

	// server sends (initial) list of all other arrows available
	public static arrows: string = 'arrow:collection'

	// client updates positions of own arrows, server broadcasts positions
	// public static coordinates: string = 'arrow:coordinates';
}
