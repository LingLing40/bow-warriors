# Bow Warriors
A browser-based realtime multiplayer game. Choose your character and hit others with arrows to earn points for your team!

Built on Phaser 3 game engine, Socket.IO for realtime server communication, and TypeScript.

## About
This project is a playground for game development with Phaser 3. I used it to experiment with the capabilities of web sockets and the Phaser 3 game framework.

This demo is fully playable, but is not overly optimized for performance and an optimal playability. I hope that it may serve as a reference to myself and help others implement their own browser game.

## How to run
In development mode, run:
```bash
npm run start:dev
```

For production use, `package.json` has built in commands to support deployments on [Heroku](https://heroku.com) and [Now](https://zeit.co/now). Both require to run the build command first:
```bash
npm run build
node ./src/server/server.js
```

## Ideas to extend the game
- add marker for own player
- add automatic game reset and time limit
- show timer for game round
- show player statistics at end of game
- portrait mode detection -> show hint to turn device
- power ups

## Attributions
Graphics, tutorials, code bits and other resources used to develop this game.

- Original project template: see github fork
- Graphic resources: see folder `/credits`

## Resources
More useful resources used for this game, or to create games similar to Bow Warriors.

### Frameworks
- [Phaser 3](https://phaser.io)
- [Phaser 3 Labs (examples and demos)](https://labs.phaser.io)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/index.html) ([Github](https://github.com/photonstorm/phaser3-docs))
- [Socket.IO](https://socket.io)

### Tools
- [Tiled map editor](https://www.mapeditor.org/)
- [Textcraft.net: game logo generator](http://textcraft.net)
- [Phaser Editor (IDE for Phaser 2)](https://phasereditor2d.com/)
- [Tile Extruder: remove tile bleeding using tilemaps](https://github.com/sporadic-labs/tile-extruder)
- [Piskel: online sprite editor](https://www.piskelapp.com/)

### Graphic resources
- [Liberated Pixel Cup (LPC)](http://lpc.opengameart.org) ([Github](https://github.com/stefanbeller/lpc))
- [Open Game Art](http://opengameart.org/)
- [Kenney](http://kenney.nl/)
- [Itch.io](https://itch.io/game-assets)
- [Pixel Game Art](http://pixelgameart.org/web/)
- [LPC Spritesheet Character Generator](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/)

#### Generated Characters:
- [LPC Character: Warrior](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?body=tanned2&eyes=green&legs=pants_teal&clothes=longsleeve_white&mail=chain&armor=chest_plate&spikes=none&greaves=metal&shoes=boots_metal&=shoes_black&belt=none&weapon=bow&ammo=arrow&quiver=none&nose=big&ears=none&jacket=none&hair=messy2_white&arms=plate&bracers=leather)
- [LPC Character: Princess](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?sex=female&body=tanned&eyes=blue&=cape_brown&nose=button&ears=elven&legs=pants_magenta&clothes=gown&gown-underdress=1&gown-overskirt=1&gown-blue-vest=1&mail=none&armor=chest_gold&jacket=none&hair=princess_dark_blonde&arms=gold&shoulders=leather&bracers=none&greaves=none&gloves=golden&hat=tiara_gold&shoes=none&belt=gold&capeacc=none&cape=none&weapon=recurvebow&ammo=arrow&quiver=on)
- [LPC Character: Orc](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?body=orc&eyes=none&legs=pants_magenta&clothes=longsleeve_white&mail=none&armor=chest_leather&spikes=none&greaves=none&shoes=none&=shoes_black&belt=leather&weapon=greatbow&ammo=arrow&quiver=none)
- [LPC Character: Pirate](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?sex=female&body=dark&=eyes_brown&clothes=pirate_white&gown-underdress=0&gown-blue-vest=0&hair=swoop_brown&hairsara-toplayer=0&hairsara-bottomlayer=0&hairsara-shadow=0&hat=bandana_red&belt=leather&buckle=none&bracelet=on&cape=tattered_brown&greaves=none&bracers=none&weapon=bow&ammo=none&quiver=on&legs=pants_red)
- [LPC Character: Elf](http://gaurav.munjal.us/Universal-LPC-Spritesheet-Character-Generator/#?body=darkelf&sex=female&eyes=yellow&nose=big&ears=elven&legs=sara&clothes=sara&armor=none&weapon=recurvebow&ammo=arrow&bracers=cloth&hair=unkempt_blue2&shoes=boots_metal&hat=none)

### Tutorials and articles
- [Making your first Phaser 3 game](http://phaser.io/tutorials/making-your-first-phaser-3-game)
- [Basic example on how to set up Phaser with Socket.IO (gamedevacademy.org)](https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/)
- [Article series on Medium: modular game worlds in Phaser 3 (with tilemaps)](https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6)
- [Make Pixel Art: The 10 Best Tools for Developers in 2018](https://v-play.net/game-resources/make-pixel-art-online)
- [JSConf talk: Realtime HTML5 Multiplayer Games with NodeJS](https://www.youtube.com/watch?v=z1_QpUkX2Gg)

### Miscellaneous
- [Phaser 3 Rex Notes: example joystick implementation](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/virtualjoystick/index.html)
- [Touch detection via touchstart event](https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685)