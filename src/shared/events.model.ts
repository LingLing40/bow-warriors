export class GameEvent {
	public static authentication: string = 'authentication:successful';
	public static end: string = 'game:over';
	public static start: string = 'game:start';
	public static drop: string = 'drop';
}

export class CometEvent {
	public static create: string = 'comet:create';
	public static destroy: string = 'comet:destroy';
	public static hit: string = 'comet:hit';
	public static coordinates: string = 'comet:coordinates';
}

export class ServerEvent {
	// initial connection of a new client on server
	public static connected: string = 'connection';

	// client disconnects from server
	public static disconnected: string = 'disconnect';
}

export class PlayerEvent {
	// server informs existing players about new player
	public static joined: string = 'player:joined';

	// server sends initial data for own player
	public static protagonist: string = 'player:protagonist';

	// server sends list of all other players available
	public static players: string = 'actors:collection';

	// server informs others about a player that quit
	public static quit: string = 'player:left';

	// client informs server when hit by arrow
	public static hit: string = 'player:hit';

	// client sends own movement coords, server informs others
	public static coordinates: string = 'player:coordinates';
}

export class ArrowEvent {
	// client shoots arrow
	public static shoot: string = 'arrow:shoot';

	// server triggers arrow creation
	public static create: string = 'arrow:create';

	// client detects hit of (other players) arrow
	// public static hit: string = 'arrow:hit';

	// client or server triggers arrow destruction
	public static destroy: string = 'arrow:destroy';

	// client updates positions of own arrows, server broadcasts positions
	public static coordinates: string = 'arrow:coordinates';
}