// import modules

// Anytime you add an entity (creep, flag, structure, etc) to the World,
// ALWAYS create a housekeeping task to cleanup the game memory.
// If you don't, you will run into 'undefined' objects during iterations
module.exports = {

    cleanupRooms: function (){
        // check memory for spawns that have been deleted
        for (let room in Memory.rooms) {
            // check if spawn still exists
            if (!Game.rooms.hasOwnProperty(room))  {

                // if not, delete the memory entry
                console.log('room ' + room + " was deleted because it no longer exists") ;
                delete Memory.rooms[room];
            }
        }
    },

    // a function to remove all undefined CREEPs from memory
    cleanupSpawns: function() {

        // check memory for spawns that have been deleted
        for (let spawn in Memory.spawns) {
            // check if spawn still exists
            if (!Game.spawns.hasOwnProperty(spawn))  {

                // if not, delete the memory entry
                console.log('spawn ' + spawn + " was deleted because it no longer exists") ;
                delete Memory.spawns[spawn];
            }
        }
    },

    // a function to remove all undefined CREEPs from memory
    cleanupCreeps: function() {

        // check for memory for CREEPS who have died
        for (let name in Memory.creeps) {
            // and checking if the creep is still alive
            if (!Game.creeps.hasOwnProperty(name)) {

                // if not, delete the memory entry
                console.log("a creep name " + name + " died.") ;
                delete Memory.creeps[name];

            }
        }
    },

    // a function to remove all undefined CREEPs from memory
    cleanupFlags: function() {

        // check for memory for CREEPS who have died
        for (let flag in Memory.flags) {
            // and checking if the creep is still alive
            if (!Game.flags.hasOwnProperty(flag)) {

                // if not, delete the memory entry
                console.log("Flag " + flag + " was deleted.") ;
                delete Memory.flags[flag];

            }
        }
    },
};