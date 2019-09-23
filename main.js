// import modules
const mainCleanup = require('./main.cleanup');
const mainConfigure = require('./main.configure');
const spawnLogic = require('./spawn.logic');
const creepLogic = require('./creep.logic');
const structureLogic = require('./structure.logic');
// test
module.exports.loop = function () {
    // check for memory for orphaned CREEPS and STRUCTURES
    // BEFORE starting game scripts
    mainCleanup.cleanupRooms();
    mainCleanup.cleanupFlags();
    mainCleanup.cleanupSpawns();
    mainCleanup.cleanupCreeps();
    // Configure GAME settings in memory
    mainConfigure.cfgGame();

    // For every ROOM in Game.rooms
    for (let r in Game.rooms) {
        // get the GAME object
        let ROOM = Game.rooms[r];
        // configure the current ROOM
        // ROOMS do not have IDs,
        mainConfigure.cfgRoom(r);

        //run ROOM defenses first
        let towers = ROOM.find(FIND_MY_STRUCTURES, {
            filter : (s) => s.structureType === STRUCTURE_TOWER && s.energy > 0
        });
        if (towers[0]) {

            for (let t in towers) {
                structureLogic.run(towers[t].id);
            }
        }

        //run ROOM defenses first
        let links = ROOM.find(FIND_MY_STRUCTURES, {
            filter : (s) => s.structureType === STRUCTURE_LINK});

        if (links[0]) {

            for (let l in links) {
                structureLogic.run(links[l].id);
            }
        }
    }

    // for every SPAWN in Game.spawns
    for (let s in Game.spawns) {
        // configure the current SPAWN
        mainConfigure.cfgSpawn(Game.spawns[s].id);
        // Check if SPAWN is in the process of SPAWNING a CREEP
        if (Game.spawns[s].spawning === null) {
            // run Main SPAWN script if not busy SPAWNING
            spawnLogic.run(Game.spawns[s].id);
        }
    }

    // for every CREEP in Game.creeps
    for (let c in Game.creeps) {

        //Game.creeps[c].memory.unloadRoom = 'W18N55';
        if (!Game.creeps[c].spawning) {

            creepLogic.run(Game.creeps[c].id)
        }
    }

};