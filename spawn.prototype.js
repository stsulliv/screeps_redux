// import modules

module.exports = function() {

    // create a new function for StructureSpawn - WORKER (good for harvesting/mining)
    StructureSpawn.prototype.spawnHarvester = function(sourceId,
                                                    creepRole,
                                                    homeId,
                                                    roomEnergy,
                                                    unitsNeeded)
    {
        let SOURCE = Game.getObjectById(sourceId) ;


        //build the creep body
        let creepBody = [] ;
        let workUnits = 0 ;
        let carryUnits = 0 ;

        for (let i = 0; i < unitsNeeded; i++) {

            creepBody.push(WORK,MOVE) ;
            roomEnergy -= 150;
            workUnits++ ;

            if (roomEnergy < 150 ) {
                break
            }
        }
        // add a CARRY if 100 energy left
        if (roomEnergy > 100) {

            creepBody.push(CARRY,MOVE) ;
            carryUnits++ ;
        }
        // add a CARRY if 50 energy left
        else if (roomEnergy > 50) {

            creepBody.push(CARRY) ;
            carryUnits++ ;
        }
        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            creepRole + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: homeId,
                    targetRoom: SOURCE.room.name,
                    sourceRoom: SOURCE.room.name,
                    sourceId: SOURCE.id,
                    state: Memory.lists.creepStates.TARGETING_LD,
                    work: workUnits,
                    carry: carryUnits}
            }
        )
    };

    StructureSpawn.prototype.spawnCarrier= function(loadId,
                                                    unloadId,
                                                    creepRole,
                                                    roomEnergy,
                                                    unitsNeeded,
                                                    roads)
    {

        let LOAD = Game.getObjectById(loadId) ;
        let UNLOAD = Game.getObjectById(unloadId) ;

        //build the creep body
        let creepBody = [] ;
        let carryUnits = 0 ;

        // with roads
        if (roads) {

            for (let i = 0; i < unitsNeeded; i++) {
                creepBody.push(CARRY,CARRY,MOVE) ;

                roomEnergy -= 150 ;
                carryUnits++ ;

                if (roomEnergy < 150) {

                    break
                }
            }

        }
        // no roads
        else {

            for (let i = 0; i < unitsNeeded; i++) {
                creepBody.push(CARRY,MOVE) ;

                roomEnergy -= 100 ;
                carryUnits++ ;

                if (roomEnergy < 100) {

                    break
                }
            }
        }

        console.log(unitsNeeded + ' units requested, ' + carryUnits + ' units spawned');
        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            creepRole + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: unloadId,
                    targetRoom: LOAD.room.name,
                    loadRoom: LOAD.room.name,
                    loadId: LOAD.id,
                    unloadRoom: UNLOAD.room.name,
                    unloadId: UNLOAD.id,
                    state: Memory.lists.creepStates.TARGETING_LD,
                    carry: carryUnits}
            }
        )
    };

    StructureSpawn.prototype.spawnUpgrader= function(controllerId,
                                                     creepRole,
                                                     roomEnergy)
    {
        let CONTROLLER = Game.getObjectById(controllerId);

        //build the creep body
        let creepBody = [] ;

        let maxWorkCarryMoveUnits = Math.floor(roomEnergy / 200);

        // set maximum size of upgrader
        if (maxWorkCarryMoveUnits > 4) {

            maxWorkCarryMoveUnits = 4 ;
        }

        for (let i = 0; i < maxWorkCarryMoveUnits; i++) {

            creepBody.push(WORK,CARRY,MOVE) ;
        }

        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            creepRole + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: controllerId,
                    targetRoom: CONTROLLER.room.name,
                    controllerRoom: CONTROLLER.room.name,
                    controllerId: CONTROLLER.id,
                    state: Memory.lists.creepStates.TARGETING_LD,
                    work: maxWorkCarryMoveUnits,
                    carry: maxWorkCarryMoveUnits}
            }
        )
    };

    StructureSpawn.prototype.spawnWorker = function(controllerId,
                                                    creepRole,
                                                    roomEnergy,
                                                    unitsNeeded,
                                                    roads)
    {

        let CONTROLLER = Game.getObjectById(controllerId);

        //build the creep body
        let creepBody = [] ;
        let workCarryUnits = 0 ;

        // with roads
        if (roads) {

            let maxWorkCarryMoveUnits = Math.floor(roomEnergy / 200);
            // check units needed don't exceed available energy
            if (unitsNeeded > maxWorkCarryMoveUnits) {

                unitsNeeded = maxWorkCarryMoveUnits ;
            }

            // manage maximum size
            if (unitsNeeded > 3) {

                unitsNeeded = 3 ;
            }

            for (let i = 0; i < unitsNeeded; i++) {

                creepBody.push(WORK,CARRY,MOVE) ;
                workCarryUnits++ ;
            }
        }
        // no roads
        else {
            // get max units based on body unit cost
            let maxWorkCarryMoveUnits = Math.floor(roomEnergy / 250);
            // check units needed don't exceed available energy
            if (unitsNeeded > maxWorkCarryMoveUnits) {

                unitsNeeded = maxWorkCarryMoveUnits ;
            }

            // manage maximum size
            if (unitsNeeded > 3) {

                unitsNeeded = 3;
            }

            for (let i = 0; i < unitsNeeded; i++) {

                creepBody.push(WORK,CARRY,MOVE,MOVE) ;
                workCarryUnits++ ;
            }
        }

        console.log(unitsNeeded + ' units requested, ' + workCarryUnits + ' units spawned');
        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            creepRole + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: CONTROLLER.id,
                    targetRoom: CONTROLLER.room.name,
                    controllerRoom: CONTROLLER.room.name,
                    controllerId: CONTROLLER.id,
                    state: Memory.lists.creepStates.TARGETING_LD,
                    work: workCarryUnits,
                    carry: workCarryUnits}
            }
        )
    };

    StructureSpawn.prototype.spawnScout = function(remoteRoom,
                                                   creepRole,
                                                   homeId)
    {

        //build the creep body
        let creepBody = [] ;
        let moveUnits = 1;

        for (let i = 0; i < moveUnits; i++) {

            creepBody.push(MOVE) ;
        }

        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            'scout' + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: homeId,
                    targetRoom: remoteRoom,
                    scoutRoom: remoteRoom,
                    state: Memory.lists.creepStates.SCOUTING}
            }
        )
    };

    StructureSpawn.prototype.spawnSoldier = function(controllerId,
                                                    creepRole,
                                                    roomEnergy)
    {

        let CONTROLLER = Game.getObjectById(controllerId);

        //build the creep body
        let creepBody = [] ;

        let attackUnits = Math.floor(roomEnergy / 300);

        // set maximum size soldier
        if (attackUnits > 2) {

            attackUnits = 2 ;
        }

        let moveUnits = 2 * attackUnits ;
        let toughUnits = 2 * attackUnits ;

        for (let i = 0; i < toughUnits; i++) {

            creepBody.push(TOUGH) ;
        }

        for (let i = 0; i < moveUnits; i++) {

            creepBody.push(MOVE) ;
        }

        for (let i = 0; i < attackUnits; i++) {

            creepBody.push(ATTACK,MOVE) ;
        }

        // create creep with the created body and the given role
        return this.spawnCreep(
            creepBody,
            creepRole + Game.time,
            {memory: {
                    role: creepRole,
                    homeId: CONTROLLER.id,
                    targetRoom: CONTROLLER.room.name,
                    controllerRoom: CONTROLLER.room.name,
                    controllerId: CONTROLLER.id,
                    state: Memory.lists.creepStates.ATTACKING,
                    attack: attackUnits}
            }
        )
    };
};