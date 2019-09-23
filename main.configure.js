// import modules

module.exports = {

    // configure GAME settings
    cfgGame: function () {

        // set GAME variable
        Memory.settings = {} ;
        // any STORAGE within this range is carrier and harvester use only
        Memory.settings.rangeToSourceStorage = 3 ;
        Memory.settings.rangeToDroppedEnergy = 5 ;
        Memory.settings.rangeToStage = 4 ;
        Memory.settings.rangeToControllerStorage = 6 ;
        Memory.settings.default_search_radius = 6 ;

        // add new roles here
        Memory.settings.creepRoles = ['harvester', 'carrier','upgrader','worker','scout','remHarvester',
            'remCarrier','remWorker','soldier'] ;

        // configure lists in MEMORY
        Memory.lists = {} ;
        Memory.lists.creepStates = {} ;
        // create list of CREEP STATES
        // non-LOADING STATES 0-9
        Memory.lists.creepStates.STAGING = 0 ;
        Memory.lists.creepStates.SCOUTING = 1 ;
        Memory.lists.creepStates.TRANSITIONING = 2 ;
        Memory.lists.creepStates.RESERVING = 3 ;
        Memory.lists.creepStates.CLAIMING = 4 ;
        Memory.lists.creepStates.ATTACKING = 5 ;
        // LOADING 10-19
        Memory.lists.creepStates.TARGETING_LD = 10 ;
        Memory.lists.creepStates.MOVING_LD = 11 ;
        Memory.lists.creepStates.HARVESTING = 12 ;
        Memory.lists.creepStates.WITHDRAWING = 13 ;
        Memory.lists.creepStates.PICKING_UP = 14 ;
        // UNLOADING 20-29
        Memory.lists.creepStates.TARGETING_UNLD = 20 ;
        Memory.lists.creepStates.MOVING_UNLD = 21 ;
        Memory.lists.creepStates.TRANSFERRING = 22 ;
        Memory.lists.creepStates.UPGRADING = 23 ;
        Memory.lists.creepStates.BUILDING = 24 ;
        Memory.lists.creepStates.REPAIRING = 25 ;
        Memory.lists.creepStates.DROPPING = 26 ;

        // store STRUCTURE lists in memory
        // In order of preference, these ENERGY STRUCTURES us (s).energy & (s).energyCapacity
        Memory.lists.storageEnergy = {STRUCTURE_EXTENSION,STRUCTURE_SPAWN,STRUCTURE_TOWER} ;
        // In order of preference, these STORAGE STRUCTURES us (s).energy & (s).energyCapacity
        Memory.lists.storageResource = {STRUCTURE_CONTAINER,STRUCTURE_STORAGE};
        Memory.lists.buildStructures = {STRUCTURE_EXTENSION,
                                        STRUCTURE_SPAWN,
                                        STRUCTURE_ROAD,
                                        STRUCTURE_TOWER,
                                        STRUCTURE_CONTAINER,
                                        STRUCTURE_RAMPART,
                                        STRUCTURE_WALL,
                                        STRUCTURE_STORAGE,
                                        STRUCTURE_LINK} ;
        Memory.lists.repairStructures = {STRUCTURE_SPAWN,
                                        STRUCTURE_EXTENSION,
                                        STRUCTURE_ROAD,
                                        STRUCTURE_TOWER,
                                        STRUCTURE_CONTAINER,
                                        STRUCTURE_STORAGE,
                                        STRUCTURE_LINK} ;
        // I always add the Game.time.  It makes it super easy to run updates every X game tics
        Memory.lastUpdate = Game.time;
    },

    // configure ROOM settings
    cfgRoom: function (r) {

        // get game ROOM object.  ROOMS don't have id(s), only names
        let ROOM = Game.rooms[r];

        // store ROOM exits in Memory
        ROOM.memory.exits = Game.map.describeExits(ROOM.name);

        // configure ROOM SOURCES
        // get all SOURCES in the room
        let roomSourcesBySpawn = ROOM.find(FIND_SOURCES);

        // check if any SOURCES found
        if (roomSourcesBySpawn[0])  {
            // create array for sources
            let roomSources = [] ;
            // profile each SOURCE in the ROOM and store in ROOM memory
            for (let s in roomSourcesBySpawn) {

                // get SOURCE game object
                let CURRENT_SOURCE = roomSourcesBySpawn[s];

                // determine number of access points
                // gets the surrounding land data to determine SOURCE accessibility
                let sourceAccessTerrain = ROOM.lookForAtArea(
                    LOOK_TERRAIN, CURRENT_SOURCE.pos.y - 1,
                    CURRENT_SOURCE.pos.x - 1,
                    CURRENT_SOURCE.pos.y + 1,
                    CURRENT_SOURCE.pos.x + 1,
                    true);

                // check source perimeter for creep accessible points
                // ** research and add lodash to your IDE if _.sum is not recognized.
                // _.sum (lodash) returns the number of CREEPs where property ROLE matches filter
                let sourceAccess = _.sum(sourceAccessTerrain, (a) => a.terrain === 'plain' || a.terrain === 'swamp');

                // get range from Game Settings
                let range = Memory.settings.rangeToSourceStorage ;

                // check SOURCE perimeter TERRAIN for amount of DROPPED_ENERGY
                let droppedEnergyInRange = CURRENT_SOURCE.pos.findInRange(FIND_DROPPED_RESOURCES, range,
                    { filter: (e) => e.resourceType === RESOURCE_ENERGY }
                );
                // use lodash to get total DROPPED ENERGY
                let amountEnergyInRange = _.sum(droppedEnergyInRange, 'amount');

                // look for RESOURCE STRUCTURES near SOURCE
                let structuresInRange = CURRENT_SOURCE.pos.findInRange(FIND_STRUCTURES, range);

                if (structuresInRange[0]) {
                    // if you find any, check them for ENERGY and add to SOURCE total.
                    for (let s in structuresInRange)    {

                        let structureEnergy = _.sum(structuresInRange[s].store);
                        amountEnergyInRange += structureEnergy;
                    }
                }
                // update properties
                let sourceProperties = {
                    sourceId: roomSourcesBySpawn[s].id, access: sourceAccess, energyInArea: amountEnergyInRange
                };
                // push properties to memory
                roomSources.push(sourceProperties) ;
            }

            // ROOM.memory.sources = [] ;
            // sort SOURCES by energy in area
            ROOM.memory.sources = _.sortBy(roomSources, 'energyInArea').reverse();
        }
        // store all SPAWN ids in ROOM memory,
        // used to get TOTAL ROOM populations, even when CREEPS are in another ROOM
        ROOM.memory.spawns = [];
        let SPAWNS = (ROOM.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN}}));

        // check if any SPAWNS
        if (SPAWNS[0]) {
            // add ROOM's SPAWN ids to memory
            for (let s in SPAWNS) {
                ROOM.memory.spawns.push({spawnId: SPAWNS[s].id});
            }
        }

        switch (ROOM.name) {

            case 'W18N55':

                // set GAME variable
                ROOM.memory.settings = {};
                ROOM.memory.settings.carryPerSource = 8 ;
                ROOM.memory.settings.carryPerRemoteSource = 12 ;
                ROOM.memory.settings.workPerController = 15  ;
                ROOM.memory.settings.workPerRemoteSource = 6 ;
                ROOM.memory.settings.roadsInPlace = true ;
                ROOM.memory.settings.wallLevel = 17000 ;

                // store current ROOM population by CREEP role
                // EXPLICIT DEFINE each role population as you add them, so they auto-complete when using later
                ROOM.memory.population = {};
                ROOM.memory.population.harvester = _.sum(Game.creeps,
                    (c) => c.memory.role === 'harvester' && c.memory.sourceRoom === ROOM.name);
                ROOM.memory.population.carrier = _.sum(Game.creeps,
                    (c) => c.memory.role === 'carrier' && c.memory.loadRoom === ROOM.name);
                ROOM.memory.population.upgrader = _.sum(Game.creeps,
                    (c) => c.memory.role === 'upgrader' && c.memory.controllerRoom === ROOM.name);
                ROOM.memory.population.maxUpgrader = 4 ;
                ROOM.memory.population.worker = _.sum(Game.creeps,
                    (c) => c.memory.role === 'worker' && c.memory.controllerRoom === ROOM.name);
                ROOM.memory.population.scout = _.sum(Game.creeps,
                    (c) => c.memory.role === 'scout' && c.memory.controllerRoom === ROOM.name);

                // Managed ROOM config
                ROOM.memory.managedRooms = ['W19N55','W17N55','W19N56','W17N56','W19N54'];
                ROOM.memory.population.remHarvester = _.sum(Game.creeps,
                    (c) => c.memory.role === 'remHarvester' && c.memory.homeId === ROOM.controller.id);
                ROOM.memory.population.remCarrier = _.sum(Game.creeps,
                    (c) => c.memory.role === 'remCarrier' && c.memory.homeId === ROOM.controller.id);
                ROOM.memory.population.remWorker = _.sum(Game.creeps,
                    (c) => c.memory.role === 'remWorker' && c.memory.homeId === ROOM.controller.id);
                ROOM.memory.population.soldier = _.sum(Game.creeps,
                    (c) => c.memory.role === 'soldier' && c.memory.homeId === ROOM.controller.id);
                break;

                case 'next room':
                break;
        }

        // set last update time
        ROOM.memory.lastUpdate = Game.time ;
    },

    // configure SPAWN settings
    cfgSpawn: function (spawnId) {

        // get SPAWN game object
        let SPAWN = Game.getObjectById(spawnId);

        // get all SOURCES in the room
        // you could pull SPAWN data from ROOM memory, this is just quicker.
        let roomSourcesBySpawn = SPAWN.room.find(FIND_SOURCES);
        let numberOfRoomSources = roomSourcesBySpawn.length;

        SPAWN.memory.sources = [] ;

        for (let i = 0; i <= ( numberOfRoomSources - 1 ) ; i++) {

            // get closest source to spawn from ARRAY roomSourcesBySpawn
            // can return no sources if creeps are blocking path
            let closestSource = SPAWN.pos.findClosestByRange(roomSourcesBySpawn);

            // remove the closestSource from ARRAY before running again
            for (let sourceNumber in roomSourcesBySpawn) {

                if (roomSourcesBySpawn[sourceNumber] === closestSource) {
                    // if the CURRENT SOURCE is the CLOSEST SOURCE, remove it from array
                    roomSourcesBySpawn.splice(sourceNumber, 1) ;
                    break;
                }
            }
            // gets the surrounding land data to determine SOURCE accessibility
            let sourceAccessTerrain = SPAWN.room.lookForAtArea(
                LOOK_TERRAIN, closestSource.pos.y - 1,
                            closestSource.pos.x - 1,
                            closestSource.pos.y + 1,
                            closestSource.pos.x + 1,
                            true);

            // check source perimeter for creep accessible points
            let sourceAccess = _.sum(sourceAccessTerrain, (a) => a.terrain === 'plain' || a.terrain === 'swamp');

            // check SOURCE perimeter TERRAIN for amount of DROPPED_ENERGY
            let droppedEnergyInRange = closestSource.pos.findInRange(
                FIND_DROPPED_RESOURCES, Memory.settings.rangeToDroppedEnergy, { filter: (e) =>
                        e.resourceType === RESOURCE_ENERGY}
            );
            // use lodash to get total DROPPED ENERGY
            let amountEnergyInRange = _.sum(droppedEnergyInRange, 'amount');
            // look for STRUCTURES near SOURCE
            let structuresInRange = closestSource.pos.findInRange(FIND_STRUCTURES, Memory.settings.rangeToDroppedEnergy);

            if (structuresInRange[0]) {
                // if you find any, check them for ENERGY and add to SOURCE total.
                for (let s in structuresInRange)    {
                    let structureEnergy = _.sum(structuresInRange[s].store);
                    amountEnergyInRange = amountEnergyInRange + structureEnergy;
                }
            }
            // update properties
            let sourceProperties = {
                sourceId: closestSource.id, access: sourceAccess, energyInArea: amountEnergyInRange
            };
            // push properties to memory
            SPAWN.memory.sources.push(sourceProperties) ;
        }
        SPAWN.memory.lastUpdate = Game.time ;
    },
};
