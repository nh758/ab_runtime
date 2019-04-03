/**
 * Docker system process_watcher
 *
 * @description :: Server-side logic for running stateful checks 
 *                  on all processes on base operating system.
 * 
 *                  How often checks are run is determined by source
 *                  Source must pass "current-processes" and "pidusage" modules
 */

var psLookup;
var pidusage;
const _ = require("lodash");
/* 
 * if above {cpuAddLevel} go in here
 * if drop below {cpuRemoveLevel} remove
 * if not detected above {cpuAddLevel} for a {deleteInterval} remove
 * [{pid: unique id, lastDetectTime: last time detected},...]
 */
var processWatchList = []

/* 
 * If ps detected twice over {cpuAddLevel}
 * [{pid, name, cpu, ctime,memory,reportTime,lastDetectTime,firstDetectTime},...]
 ** reportTime
 * made first save & updated when process is reported 
 * Stops spammy reports, but allows reporting after {reportInterval}
 ** lastDetectTime 
 * last time detected, updates on check process
 ** firstDetectTime 
 * tracks first time a ps was put in Warn list, helps dev see age of ps?
 */
var processWarnList = [];

/* 
 * Both of these cpu values will be modified 
 * to be .00 types, if the top cpu values are <1
 */
// if x < is ok
var cpuRemoveLevel = 25;
//if x > track it
var cpuAddLevel = 50;

// If ps is last detected {deleteInterval} ago, remove from lists
var deleteInterval = (3 * 60 * 60 * 1000); // 3 hours
// re-report interval ; (a NEW warn list item is reported after 15 min)
var reportInterval = (90 * 60 * 1000); // 90 min

//Send alert to slack
function writeToSlack(message) {
  try {
    currStream.write("__alert:" + message);
  } catch (error) {
    console.error("currStream not set, cannot write to Slack");
  }
}
//boolean to help us only run check once
var cpuTypeChecked = false;
//cpu type check
function updateCPUTestValues(cpuValue) {
  if ((cpuRemoveLevel < 1) && (cpuAddLevel < 1)) {
    //already modified
    return null;
  } else if (cpuValue <= 1) {
    // change 1 to .01
    cpuRemoveLevel = (cpuRemoveLevel / 100);
    cpuAddLevel = (cpuAddLevel / 100);
    cpuTypeChecked = true;
  }
  cpuTypeChecked = true;
}

function cleanList(processes, currentTime = new Date().getTime()) {

  // If processes last reported {deleteInterval} ago
  // Remove from Lists
  _.remove(processWatchList, function (ele) {
    return (ele.lastDetectTime <= (currentTime - deleteInterval));
  });
  _.remove(processWarnList, function (ele) {
    return (ele.lastDetectTime <= (currentTime - deleteInterval));
  });

  // if process, in current report
  // drops below {cpuRemoveLevel} OR does not exist
  // Remove from Lists
  _.remove(processWatchList, function (ele) {
    var findCPU = function (currentProcess) {
      return ((currentProcess.pid == ele.pid) && (currentProcess
        .cpu <=
        cpuRemoveLevel));
    };
    return processes.some(findCPU);
  });
  _.remove(processWarnList, function (ele) {
    var findCPU = function (currentProcess) {
      //matches element && cpu is below removeLevel
      return ((currentProcess.pid == ele.pid) && (currentProcess
        .cpu <
        cpuRemoveLevel));
    };
    return processes.some(findCPU);
  });

}

function toMinutes(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + "." + (seconds < 10 ? '0' : '') + seconds;
}

function formatBytes(bytes, decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1024,
    dm = decimals <= 0 ? 0 : decimals || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * recordWarnProcess
 * @param {obj} processObject
 * the report object sent by checkProcess.
 * @param time currentTime
 * the current time, sent by checkProcess.
 */
function recordWarnProcess(processObject, currentTime) {
  //currentTime = new Date().getTime();
  var pidStored = function (stored) {
    if (stored == undefined) {
      return false;
    }
    return processObject.pid == stored.pid;
  };
  let found = 0;
  pidusage(processObject.pid, function (err, stats) {
    // all processes always get updated with this information
    processObject.elapsed = toMinutes(stats.elapsed);
    processObject.memory = formatBytes(stats.memory);

  })
  if (processWarnList.some(pidStored)) {
    processObject.lastDetectTime = currentTime;
    //if exists in storage
    // update; cpu, memory, lastDetectTime, 

    //element.lastDetectTime <= (currentTime - reportInterval)
    index = _.findIndex(processWarnList, function (element) {
      return element.pid == processObject.pid
    })
    /* 
     * found time, Show how long a ps has been on list
     * age should be difference between found and current time 
     */
    processObject.firstDetectTime = processWarnList[index].firstDetectTime;
    // reportTime, Show how long since last report
    processObject.reportTime = processWarnList[index].reportTime;
    // If a new process, that is repeat offender, allow reporting it
    // Also a little over 15 min old 
    processObject.report = ((processObject.reportTime == undefined) && (
      processObject.firstDetectTime <= (currentTime - 15 * 60 * 1000)));
    //overwrite previous
    processWarnList.splice(index, 1, processObject);
  } else {
    processObject.lastDetectTime = currentTime;
    processObject.firstDetectTime = currentTime;
    processObject.report = false;
    processWarnList.push(processObject);
  }

}
module.exports = {
  /**
   * init
   * bring in the process watching modules
   * AND the stream for output to Slack
   */
  init: function (ps, pid, stream) {
    psLookup = ps;
    pidusage = pid;
    currStream = stream;
  },
  /**
   * checkProcess
   * initial checks
   */
  checkProcess: function checkProcess(currentTime = new Date().getTime()) {
    cpuTypeChecked = false;
    psLookup.get(function (err, processes) {

      var sorted = _.sortBy(processes, "cpu");
      let top5 = sorted.reverse().splice(0, 5);
      top5.forEach(element => {
        // tests need to match what OS returns for cpu
        // 25 or .25
        if (!cpuTypeChecked) {
          updateCPUTestValues(element.cpu);
        }
        //  This allows testing enviroment to pass in times,
        //  normally current-processes doesn't pass a timestamp
        currentTime = ((typeof (element.timestamp) !==
          'undefined') ? element.timestamp : currentTime);

        // check if high CPU offender before running log updates
        if (element.cpu >= cpuAddLevel) {
          var match = function (stored) {
            if (stored === undefined) {
              return false;
            }
            if (element.pid == stored.pid) {
              //if already in list
              //update stored information
              stored.cpu = element.cpu;

              // Note how lastDetectTime is only updated to current time 
              // IF the cpu is above {addLevel}
              stored.lastDetectTime = currentTime;

              //confirm exists
              return element.pid == stored.pid;
            }
          };
          let history = processWatchList.some(match);

          // check if process in watch list 
          if (history) {
            // detected new high usage process
            recordWarnProcess(element, currentTime);
          }

          // check if already in watch list 
          if (!history) {
            // adding to processWatchList
            processWatchList.push({
              name: element.name,
              pid: element.pid,
              cpu: element.cpu,
              lastDetectTime: currentTime
            });
          }
        }
      });
      cleanList(processes, currentTime)
    });

  },

  /**
   * reportHighUsageProcess
   * sends process statistics to Slack channel
   */
  reportHighUsageProcess: function reportHighUsageProcess(currentTime =
    new Date().getTime()) {
    //let currentTime = new Date().getTime();
    // clean duplicates
    processWarnList = _.uniqBy(processWarnList, 'pid');
    // default message
    let fullReport = `issues exist`;
    if (processWarnList.length > 0) {
      let botMessage = ``;
      let sorted = _.sortBy(processWarnList, "cpu");
      //can limit how many processes are reported in this splice
      processWarnList = sorted.reverse().splice(0, 20);
      processWarnList.forEach(element => {

        // if not removed from warn list, re-warn afer {reportInterval}
        let reWarnTime = (element.reportTime <= (currentTime -
          reportInterval)); //
        if (reWarnTime || (element.report)) {
          // this message cannot contain ':' characters
          // should be 'botMessage ='...
          //reset after each message
          botMessage = (`\nThis process may be problematic \n` +
            element
            .name +
            //convert .1 to 10 for ease of reading
            ` CPU usage ` + ((element.cpu <= 1) ? element.cpu * 100 :
              element.cpu) +
            `, memory usage ` + formatBytes(element.memory) +
            `, last detected ` + toMinutes(Math.abs(currentTime -
              element
              .lastDetectTime)) +
            ` min ago, pid ` + element.pid +
            `, first logged ` + toMinutes(Math.abs(currentTime -
              element.firstDetectTime)) + ` ago.`
          );
          // Uncomment after making tests
          element.report = false;
          element.reportTime = currentTime;
          fullReport += botMessage;
          writeToSlack(botMessage)
        }
      });
    } else {
      //Don't writeTo slack if there's no issues!

      return ('no issues')
    }
    // either 'some issues' or 
    // the last report message will be returned here

    return (fullReport);
  },
  /**
   * reportProcesses
   * returns watch list
   * Only used for testing insert/drop logic
   */
  reportProcesses: function reportProcesses() {
    if (processWatchList.length > 0) {
      return processWatchList;
    } else {
      return undefined;
    }
  },
}
