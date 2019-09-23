// import modules
require('./spawn.prototype')();

module.exports = {

    run: function (spawnId) {

        // get SPAWN from spawnId
        const SPAWN = Game.getObjectById(spawnId);
        // get SPAWN's ROOM to access and update population stored in ROOM's memory
        const ROOM = SPAWN.room;
        // set ROOM population memory for simplicity below
        const roomPopulation = ROOM.memory.population ;
        // set CLOSEST SOURCE from memory, stored in memory by proximity
        const closestSourceId = SPAWN.memory.sources[0].sourceId;

        // ****************************************************
        // As soon as enough ENERGY in SPAWN, spawn base CREEPS
        // ****************************************************

        if (ROOM.energyAvailable < 300) {
            // 300 is the smallest creep i wont to spawn. No use in moving forward
        }
        // First rule of FC, always have at least on HARVESTER as a failsafe
        // Harvester will harvest and DROP ENERGY while spawn re-charges
        // Harvesters DO NOT MOVE ENERGY, they DROP or TRANSFER to nearby storage
        else if (roomPopulation.harvester === 0 ) {
            console.log('harvester failsafe');
            // Spawn a harvester.  Because this is the first harvester, we pass it the SPAWN's first SOURCE
            if (SPAWN.spawnHarvester(closestSourceId, 'harvester', SPAWN.room.controller.id,
                ROOM.energyAvailable, 5) === OK) {
                // Successful spawn returns OK
                // update Population
                this.updatePopulation(ROOM, 'harvester', ROOM.name);
            }
        }
        // Second rule of FC, make sure you have two carriers
        // By the time the CARRIERS spawn there will be a pile of ENERGY art the SOURCE
        // CARRIERS should quickly move DROPPED ENERGY from harvester to SPAWN
        else if (roomPopulation.carrier < 2 ) {
            console.log('carrier failsafe');
            // Spawn at least two carriers.  Because this is the first harvester, we pass it the SPAWN's first SOURCE
            if (SPAWN.spawnCarrier(closestSourceId, SPAWN.room.controller.id, 'carrier', ROOM.energyAvailable,
                1,  ROOM.memory.settings.roadsInPlace) === OK) {
                // update Population
                this.updatePopulation(ROOM, 'carrier', ROOM.name);
            }
        }
        // if current population of upgraders is less than the max, spawn an upgrader
        else if (ROOM.memory.population.upgrader < ROOM.memory.population.maxUpgrader) {

            if (SPAWN.spawnUpgrader(SPAWN.room.controller.id, 'upgrader', ROOM.energyAvailable) === OK) {
                // update Population
                this.updatePopulation(ROOM, 'upgrader', ROOM.name);
            }
        }

        // ************************************************************
        // Added Soldier spawning to top
        // ************************************************************

        // Spawns a Soldier if hostile creep found in visible ROOMs
        else if (this.checkSoldierRequired(SPAWN,ROOM,'soldier')) {}

        // ************************************************************
        // WE NOW HAVE OUR FAILSAFE HARVESTER AND CARRIERS AND UPGRADER
        // ************************************************************

        // Spawns a Harvester if needed.  Based on WORK units per SOURCE
        else if (this.checkHarvesterRequired(SPAWN,ROOM,'harvester')) {}
        // Spawns a Carrier if needed.  Based on CARRY units per SOURCE
        else if (this.checkCarrierRequired(SPAWN,ROOM,'carrier')) {}
        // Spawns a Worker if needed.  Based on CARRY units per SOURCE
        else if (this.checkWorkerRequired(SPAWN,ROOM,'worker')) {}

        // *************************************************
        // WE NOW HAVE SOME BUILDERS AND TOWER
        // *************************************************
        // LETS LOOK IN THE ADJACENT ROOMS
        // *************************************************

        // Spawns a Scout if needed.  Based on Managed ROOMS in memory
        else if (this.checkScoutRequired(SPAWN,ROOM,'scout')) {}
        // Spawns a remote harvester if needed.  Based on SOURCES in managed ROOMs
        else if (this.checkRemoteHarvesterRequired(SPAWN,ROOM,'remHarvester')) {}
        // Spawns a remote carrier if needed.  Based on SOURCES in managed ROOMs
            // *** Remote Harvester runs Remote Carrier Check ***
        // Spawns a remote worker if needed.  Based on SOURCES and available construction
        else if (this.checkRemoteWorkerRequired(SPAWN,ROOM,'remWorker')) {}
    },

    // Harvester population determined by WORK units to SOURCE.energyCapacity
    checkHarvesterRequired: function (SPAWN, ROOM, creepRole) {

        // check of there are any SOURCES in SPAWN memory
        if (SPAWN.memory.sources[0])   {
            // foreach SOURCE stored in SPAWN memory. SOURCES stored in order of proximity to spawn
            for (let s in SPAWN.memory.sources) {

                // get the SOURCE object
                let SOURCE = Game.getObjectById(SPAWN.memory.sources[s].sourceId) ;

                // get SOURCE capacity
                let sourceCapacity = SOURCE.energyCapacity;

                // determine how mane WORK UNITS required
                // 300 is for ticks between SOURCE replenish, 2 is for amount transferred per tick by WORK
                let maxWorkUnits = Math.ceil((sourceCapacity / 300) / 2) ;

                let sumHarvesterAssigned = _.sum(Game.creeps, (c) => c.memory.role === creepRole
                                                                && c.memory.sourceId === SOURCE.id);

                if (sumHarvesterAssigned === 0) {
                    // if no harvester assigned, request harvester with MAX WORK UNITS
                    if ((SPAWN.spawnHarvester(SOURCE.id, creepRole, SPAWN.room.controller.id,
                        ROOM.energyAvailable, maxWorkUnits)) === OK) {
                        // Successful spawn returns OK
                        // update Population
                        this.updatePopulation(ROOM, creepRole, ROOM.name);

                        return true ;
                    }
                }
                // cannot have more harvester than source access
                else if (sumHarvesterAssigned < SPAWN.memory.sources[s].access) {

                    // get harvesters assign to current source
                    let harvestersAssignedToSource = SPAWN.room.find(FIND_MY_CREEPS,
                        {filter: (c) => (c.memory.role === creepRole && c.memory.sourceId === SOURCE.id)});

                    let harvestersWorkParts = 0;

                    for (let h in harvestersAssignedToSource) {
                        harvestersWorkParts += harvestersAssignedToSource[h].memory.work;
                    }

                    // get WORKS units needed
                    let workUnitsNeeded = (maxWorkUnits - harvestersWorkParts);

                    if (workUnitsNeeded > 0) {
                        // add one to the work needed, just seems to work better
                        workUnitsNeeded++ ;

                        if ((SPAWN.spawnHarvester(SOURCE.id, creepRole, SPAWN.room.controller.id,
                            ROOM.energyAvailable, workUnitsNeeded)) === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, ROOM.name);

                            return true ;
                        }
                    }
                }
            }
        }
        // no SOURCES and no SPAWN, so no harvester
        return false;
    },

    // Carrier population determined by WORK units per SOURCE
    checkCarrierRequired: function (SPAWN, ROOM, creepRole) {

        const maxCarryUnits = ROOM.memory.settings.carryPerSource;

        // check of there are any SOURCES in SPAWN memory
        if (SPAWN.memory.sources[0])   {
            // foreach SOURCE stored in SPAWN memory. SOURCES stored in order of proximity to spawn
            for (let s in SPAWN.memory.sources) {

                // get the SOURCE object
                let SOURCE = Game.getObjectById(SPAWN.memory.sources[s].sourceId) ;

                let sumCarriersAssigned = _.sum(Game.creeps,
                    (c) => c.memory.role === creepRole && c.memory.loadId === SOURCE.id);

                // spawn first carrier
                if (sumCarriersAssigned === 0) {

                    // if no harvester assigned, request harvester with MAX WORK UNITS
                    if ((SPAWN.spawnCarrier(SOURCE.id, ROOM.controller.id,creepRole, ROOM.energyAvailable,
                        1, ROOM.memory.settings.roadsInPlace)) === OK) {
                        // Successful spawn returns OK
                        // update Population
                        this.updatePopulation(ROOM, creepRole, ROOM.name);

                        return true ;
                    }
                }
                // failsafe, assumes 1 CARRY per CREEP
                else if (sumCarriersAssigned <= ROOM.memory.settings.carryPerSource) {

                    // get harvesters assign to current source
                    let carriersAssignedToSource = SPAWN.room.find(FIND_MY_CREEPS,
                        {filter: (c) => (c.memory.role === creepRole && c.memory.loadId === SOURCE.id)});

                    // sum the number of CARRY units assigned
                    let carrierCarryParts = 0;

                    for (let h in carriersAssignedToSource) {

                        carrierCarryParts += carriersAssignedToSource[h].memory.carry;
                    }

                    // get WORKS units needed
                    let carryUnitsNeeded = (maxCarryUnits - carrierCarryParts);

                    // prevent small creeps
                    if (carryUnitsNeeded <= (maxCarryUnits / 4)) {
                        // do nothing
                    }

                    // try to keep at least two CREEPs
                    else if (carryUnitsNeeded > (maxCarryUnits / 2)) {

                        carryUnitsNeeded = (maxCarryUnits / 2) ;
                    }

                    if (carryUnitsNeeded > 0) {

                        if ((SPAWN.spawnCarrier(SOURCE.id, ROOM.controller.id,creepRole, ROOM.energyAvailable,
                            1, ROOM.memory.settings.roadsInPlace)) === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, ROOM.name);

                            return true ;
                        }
                    }
                }
            }
        }
        // no SOURCES and no SPAWN, so no harvester
        return false;
    },

    // Worker population determined by WORK units to total ROOM SOURCES
    checkWorkerRequired: function (SPAWN, ROOM, creepRole) {

        let sumWorkersAssigned = _.sum(Game.creeps,
            (c) => c.memory.role === creepRole
                && c.memory.controllerId === SPAWN.room.controller.id);

        let maxWorkUnits = ROOM.memory.settings.workPerController ;

        if (sumWorkersAssigned === 0 ) {

            // if no harvester assigned, request harvester with MAX WORK UNITS
            if ((SPAWN.spawnWorker(SPAWN.room.controller.id, creepRole, ROOM.energyAvailable,
                maxWorkUnits, ROOM.memory.settings.roadsInPlace)) === OK) {
                // Successful spawn returns OK
                // update Population
                this.updatePopulation(ROOM, creepRole, ROOM.name);

                return true ;
            }
        }
        // fail safe, prevent spawn storm
        else if (sumWorkersAssigned <= 6) {

            // get harvesters assign to current source
            let workersAssignedToController = SPAWN.room.find(FIND_MY_CREEPS,
                {filter: (c) => (c.memory.role === creepRole
                        && c.memory.controllerId === SPAWN.room.controller.id)});

            // sum the number of CARRY units assigned
            let workerWorkParts = 0;

            for (let w in workersAssignedToController) {
                workerWorkParts += workersAssignedToController[w].memory.work;
            }
            // get WORKS units needed
            let workUnitsNeeded = (maxWorkUnits - workerWorkParts);

            // prevent small creeps
            if (workUnitsNeeded < (maxWorkUnits / 4)) {
                // do nothing
            }
            // keep at least two CREEPS
            else if (workUnitsNeeded > (maxWorkUnits / 2)) {
                workUnitsNeeded = (maxWorkUnits / 2)
            }

            if (workUnitsNeeded > 0) {

                if ((SPAWN.spawnWorker(SPAWN.room.controller.id, creepRole, ROOM.energyAvailable,
                    workUnitsNeeded, ROOM.memory.settings.roadsInPlace)) === OK) {
                    // Successful spawn returns OK
                    // update Population
                    this.updatePopulation(ROOM, creepRole, ROOM.name);

                    return true ;
                }
            }
        }
        return false
    },

    //-----------------------------------------------------------------------
    // REQUIRES ROOM ENTRY INTO ROOM.memory.managedRooms
    //-----------------------------------------------------------------------

    // Scout population determined available ROOM exits
    checkScoutRequired: function (SPAWN, ROOM, creepRole) {

        for (let r in ROOM.memory.managedRooms) {

            let remoteRoomName = ROOM.memory.managedRooms[r];

            if (!Game.rooms[remoteRoomName]) {

                console.log('here');

                let assignedCreeps = _.sum(Game.creeps,
                    (c) => c.memory.role === creepRole
                        && c.memory.scoutRoom === remoteRoomName);

                if (assignedCreeps === 0) {

                    // lost visibility, spawn a scout
                    if (SPAWN.spawnScout(remoteRoomName, creepRole, SPAWN.room.controller.id) === OK) {

                        // Successful spawn returns OK
                        this.updatePopulation(ROOM, creepRole, remoteRoomName);

                        return true
                    }
                }
            }
        }
        return false
    },

    // Scout population determined available ROOM exits
    checkSoldierRequired: function (SPAWN, ROOM, creepRole) {

        for (let r in ROOM.memory.managedRooms) {

            let REMOTE_ROOM = Game.rooms[ROOM.memory.managedRooms[r]];

            // Check if ROOM is visible
            if (REMOTE_ROOM) {

                let hostiles = REMOTE_ROOM.find(FIND_HOSTILE_CREEPS);

                if (hostiles[0]) {

                    let sumSoldiersDeployed = _.sum(Game.creeps,
                        (c) => c.memory.role === creepRole && c.memory.targetRoom === REMOTE_ROOM.name);

                    let maxSoldiersDeployed = Math.ceil(hostiles.length / 2) ;

                    if (sumSoldiersDeployed < maxSoldiersDeployed ) {

                        let homeControllerId = REMOTE_ROOM.controller.id ;

                        // if no harvester assigned, request harvester with MAX WORK UNITS
                        if ((SPAWN.spawnSoldier(homeControllerId, creepRole, ROOM.energyAvailable))
                            === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                            return true ;
                        }
                    }
                }
            }
        }
        return false
    },

    // Remote Harvester population determined by WORK units to SOURCE.energyCapacity
    checkRemoteHarvesterRequired: function (SPAWN, ROOM, creepRole) {

        for (let r in ROOM.memory.managedRooms) {

            let REMOTE_ROOM = Game.rooms[ROOM.memory.managedRooms[r]];
            // Check if ROOM is visible
            if (!REMOTE_ROOM) {
                // lost visibility
            }
            // check if ROOM has SOURCES
            else if (REMOTE_ROOM.memory.sources[0])   {

                for (let s in REMOTE_ROOM.memory.sources) {

                    let REMOTE_SOURCE = Game.getObjectById(REMOTE_ROOM.memory.sources[s].sourceId);

                    // get SOURCE capacity
                    let sourceCapacity = REMOTE_SOURCE.energyCapacity;

                    // determine how mane WORK UNITS required
                    // 300 is for ticks between SOURCE replenish, 10 is for amount transferred per tick by WORK
                    let maxWorkUnits = Math.ceil((sourceCapacity / 300) / 2) ;

                    // get harvesters assign to current source
                    let sumHarvestersAssignedToSource = _.sum(Game.creeps,
                        (c) => c.memory.role === creepRole
                            && c.memory.sourceId === REMOTE_SOURCE.id
                            && c.ticksToLive > 70);

                    if (sumHarvestersAssignedToSource < 1) {

                        // if there are assign Harvesters
                        if (sumHarvestersAssignedToSource < REMOTE_ROOM.memory.sources[s].access) {

                            if ((SPAWN.spawnHarvester(REMOTE_SOURCE.id, creepRole, SPAWN.room.controller.id,
                                ROOM.energyAvailable, maxWorkUnits)) === OK) {
                                // Successful spawn returns OK
                                // update Population
                                this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                                return true;
                            }
                        }
                    }

                    // added here to make sure remote sources with harvester get remote carriers
                    else if (this.checkRemoteCarrierRequired(SPAWN,ROOM,'remCarrier')) {

                        return true;
                    }
                }
            }
        }
        // no SOURCES, so no remote harvester
        return false;
    },

    // Remote Carrier population determined by WORK units per SOURCE
    checkRemoteCarrierRequired: function (SPAWN, ROOM, creepRole) {

        for (let r in ROOM.memory.managedRooms) {

            let REMOTE_ROOM = Game.rooms[ROOM.memory.managedRooms[r]];

            // check if ROOM is visible
            if (!REMOTE_ROOM) {
                // lost visibility into to room
            }
            // check of there are any SOURCES in SPAWN memory
            else if (REMOTE_ROOM.memory.sources[0])   {
                // foreach SOURCE stored in SPAWN memory. SOURCES stored in order of proximity to spawn
                for (let s in REMOTE_ROOM.memory.sources) {

                    // get the SOURCE object
                    let REMOTE_SOURCE = Game.getObjectById(REMOTE_ROOM.memory.sources[s].sourceId) ;

                    // determine how mane CARRY UNITS required
                    // using SOURCE.capacity and average round trip, 10 CARRY per SOURCE
                    let maxCarryUnits = ROOM.memory.settings.carryPerRemoteSource ;

                    // get harvesters assign to current source
                    let numCarriersAssignedToSource = _.sum(Game.creeps,
                        (c) => c.memory.role === creepRole
                            && c.memory.loadId === REMOTE_SOURCE.id);

                    // spawn first remote carrier
                    if (numCarriersAssignedToSource === 0) {

                        // if no harvester assigned, request harvester with MAX WORK UNITS
                        if ((SPAWN.spawnCarrier(REMOTE_SOURCE.id, SPAWN.room.controller.id , creepRole,
                            ROOM.energyAvailable, 3, false)) === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                            return true ;
                        }
                    }

                    // fail safe, prevent spawn storm.  Assumes 1 CARRY per CREEP
                    else if (numCarriersAssignedToSource <= ROOM.memory.settings.carryPerRemoteSource){

                        // get the number of CARRIERS assigned to REMOTE_SOURCE
                        let carrierCarryParts = 0;

                        for (let c in Game.creeps) {
                            // get CREEP object
                            let CURRENT_CREEP = Game.creeps[c];
                            // SUM number of CARRY parts on all the carriers

                            if (CURRENT_CREEP.memory.role === creepRole
                                && CURRENT_CREEP.memory.loadId === REMOTE_SOURCE.id) {

                                carrierCarryParts += CURRENT_CREEP.memory.carry;
                            }
                        }

                        if (carrierCarryParts < maxCarryUnits) {

                            let carryUnitsRequired = maxCarryUnits - carrierCarryParts;

                            // prevent small creeps
                            if (carryUnitsRequired <= (maxCarryUnits / 5)) {
                                // do nothing
                            }

                            // make sure there are always three
                            else if (carryUnitsRequired > (maxCarryUnits / 3)) {

                                carryUnitsRequired = Math.ceil(maxCarryUnits / 3) ;
                            }

                            if (carryUnitsRequired > 0) {

                                // if no harvester needed, request harvester
                                if ((SPAWN.spawnCarrier(REMOTE_SOURCE.id, SPAWN.room.controller.id , creepRole,
                                    ROOM.energyAvailable, 3, false
                                    )) === OK) {
                                    // Successful spawn returns OK
                                    // update Population
                                    this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                                    return true ;
                                }
                            }
                        }
                    }
                }
            }
            // go to next Managed ROOM
        }
        // no SOURCES, so no remote carriers
        return false;
    },

    // Scout population determined available ROOM exits
    checkRemoteWorkerRequired: function (SPAWN, ROOM, creepRole) {

        for (let r in ROOM.memory.managedRooms) {

            let REMOTE_ROOM = Game.rooms[ROOM.memory.managedRooms[r]];
            // add below for failsafe, to prevent spawn storm for REPAIRS
            let maxRemoteRepairer = 1 ;
            // add below for failsafe, to prevent spawn storm for BUILDING
            let maxRemoteWorker = 2 ;

            // Check if ROOM is visible
            if (REMOTE_ROOM) {

                let sumWorkersAssigned = _.sum(Game.creeps,
                    (c) => c.memory.role === creepRole && c.memory.controllerRoom === REMOTE_ROOM.name);

                let remoteConstruction = REMOTE_ROOM.find(FIND_CONSTRUCTION_SITES);
                let remoteRepairSites = REMOTE_ROOM.find(FIND_STRUCTURES,
                    {filter: (s) => s.hits < (.5 * s.hitsMax)});

                if (remoteConstruction[0]) {

                    if (sumWorkersAssigned < maxRemoteWorker ) {

                        let maxWorkUnits = Math.ceil(ROOM.memory.settings.workPerRemoteSource / maxRemoteWorker) ;

                        // if no harvester assigned, request harvester with 1/2 MAX WORK UNITS
                        if ((SPAWN.spawnWorker(REMOTE_ROOM.controller.id, creepRole, ROOM.energyAvailable,
                            maxWorkUnits, false)) === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                            return true ;
                        }
                    }
                }

                else if (remoteRepairSites[0]) {

                    if (sumWorkersAssigned < maxRemoteRepairer ) {

                        let maxWorkUnits = Math.ceil(ROOM.memory.settings.workPerRemoteSource / maxRemoteWorker) ;

                        // if no harvester assigned, request harvester with 1/2 MAX WORK UNITS
                        if ((SPAWN.spawnWorker(REMOTE_ROOM.controller.id, creepRole, ROOM.energyAvailable,
                            maxWorkUnits, false)) === OK) {
                            // Successful spawn returns OK
                            // update Population
                            this.updatePopulation(ROOM, creepRole, REMOTE_ROOM.name);

                            return true ;
                        }
                    }
                }
            }
        }
        return false
    },

    // a function to remove all undefined CREEPs from memory
    updatePopulation: function (ROOM, roleToUpdate, targetRoomName) {

        ROOM.memory.population[roleToUpdate] += 1;

        console.log(roleToUpdate + " was spawned for " + targetRoomName);
        console.log(roleToUpdate + ': ' + ROOM.memory.population[roleToUpdate]);
    },
};