 /**
  * test the definitions, storage, testing, and reporting
  * for the process check process
  */
 var _ = require("lodash");
 var expect = require("chai").expect;
 var path = require("path");

 /* 
  * testPIDs
  * a set of test PID objects
  * 'high_usage_ps',
  *     Stays at 100% for full "5.5" hours
  * 'low_usage_ps',
  *     Always below 'cpuRemoveLevel' track option
  * 'mid_usage_ps',
  *     above cpuAddLevel for first tests
  *     for time test drops below 'cpuAddLevel' BUT NOT below 'cpuRemoveLevel'
  *     This tests if 'aging out' works, 
  *     as mid isn't the type of process we're looking for
  * 'spiky_usage_ps',
  *     above 'cpuAddLevel' for first tests
  *     for time test drops below 'cpuRemoveLevel'
  *     For unix test .60 test should go back in
  * 'decreasing_usage_ps'
  *     above 'cpuAddLevel' for first tests
  *     for time test drops below 'cpuRemoveLevel'
  *     For unix test .60 test should go back in
  */
 var testPIDs = [{
   name: 'high_usage_ps',
   pid: 1,
   cpu: 100,
   memory: 1000000,
   elapsed: 0,
   timestamp: new Date().getTime()
 }, {
   name: 'low_usage_ps',
   pid: 2,
   cpu: 10,
   memory: 1000000,
   elapsed: 0,
   timestamp: new Date().getTime()
 }, {
   name: 'mid_usage_ps',
   pid: 3,
   cpu: 55,
   memory: 1000000,
   elapsed: 0,
   timestamp: new Date().getTime()
 }, {
   name: 'spiky_usage_ps',
   pid: 4,
   cpu: 85,
   memory: 1000000,
   elapsed: 0,
   timestamp: new Date().getTime()
 }, {
   name: 'decreasing_usage_ps',
   pid: 5,
   cpu: 99,
   memory: 1000000,
   elapsed: 0,
   timestamp: new Date().getTime()
 }];
 /* psLookup 
  * Replaces a module
  * returns all of the pid objects
  */
 let psLookup = {
   testPIDs,
   get: function get(cb) {
     cb(null, testPIDs);
   }
 }
 /* pidusage
  * Replaces a module
  * returns a single object when a pid is passed in.
  */
 var pidusage = (function (pidFind) {
   //will use our test PID object to avoid redundancy
   var result = testPIDs.filter(function (element) {
     return element.pid === pidFind;
   });
   return (null, result);
 })

 // get our process_watch:
 var process_watch = require(path.join(__dirname, "..", "..", "src",
   "process_watch"));

 describe("process_watch: checkProcess", function () {
   // Test initial check Process functions:
   /* it("Watch list initialized ", function () {
     expect(process_watch.init(psLookup, pidusage), "should match").to
       .equal(testPIDs);
   }); */

   process_watch.init(psLookup, pidusage)

   describe("-> First Process Check ", function () {
     process_watch.checkProcess();
     it("Watch list initialized ", function () {
       let watchList = process_watch.reportProcesses();
       expect(watchList, "Watch list should have processes stored ")
         .to.exist;
       expect(watchList[0], "at least one should be watched").to
         .exist;
       expect(watchList[3], "Full 4 should be watched").to.exist;
       expect(watchList[4], "only 4 of 5 should be watched").to.not
         .exist;
       // Check order of insertion?
       // [0].cpu == 99 || [0].name == highusageps ?
       expect(watchList[0].pid,
         "highest usage process '1' to be first").to.equal(1);
     });
     it("Warn processes should be empty ", function () {
       // should be NO warn processes
       expect(process_watch.reportHighUsageProcess()).to.equal(
         'no issues');
     });
   });
   describe("-> Process Check over time", function () {
     it("Test logic when fed 5 min newer data ", function () {
       // Alter the process variables and 'age' them
       let fiveMinutesNewer = ((new Date().getTime()) + (5 * 60 *
         1000));
       testPIDs = [{
         name: 'high_usage_ps',
         pid: 1,
         cpu: 100,
         memory: 1000000,
         elapsed: 0,
         timestamp: fiveMinutesNewer
       }, {
         name: 'low_usage_ps',
         pid: 2,
         cpu: 15,
         memory: 1000000,
         elapsed: 0,
         timestamp: fiveMinutesNewer
       }, {
         name: 'mid_usage_ps',
         pid: 3,
         cpu: 53,
         memory: 1000000,
         elapsed: 0,
         timestamp: fiveMinutesNewer
       }, {
         name: 'spiky_usage_ps',
         pid: 4,
         cpu: 80,
         memory: 1000000,
         elapsed: 0,
         timestamp: fiveMinutesNewer
       }, {
         name: 'decreasing_usage_ps',
         pid: 5,
         cpu: 91,
         memory: 1000000,
         elapsed: 0,
         timestamp: fiveMinutesNewer
       }];
       // Send the new 'aged' variable ? 
       process_watch.init(psLookup, pidusage)
       // Run check again
       process_watch.checkProcess();
       let watchList = process_watch.reportProcesses();
       expect(watchList, "Processes should be in watch list ").to
         .exist;
       // Test logic when fed data
       expect(watchList[3],
         "Spiky_usage should still be tracked "
       ).to.exist;
       expect(watchList[1].cpu,
         "decreasing_usage should a. be #2 and b. have new CPU value"
       ).to.equal(91);

       // Its only been 5 min
       expect(process_watch.reportHighUsageProcess(),
           "Warn list should NOT give warnings since its only been 5 min"
         ).to
         .equal(
           'issues exist');
       //expect().to.equal('');
     });
     it("Test logic when fed 20 minutes newer data ", function () {
       // Alter the process variables and 'age' them
       let twentyMinutesNewer = ((new Date().getTime()) + (20 * 60 *
         1000));
       testPIDs = [{
         name: 'high_usage_ps',
         pid: 1,
         cpu: 100,
         memory: 1001337,
         elapsed: 0,
         timestamp: twentyMinutesNewer
       }, {
         name: 'low_usage_ps',
         pid: 2,
         cpu: 15,
         memory: 1001337,
         elapsed: 0,
         timestamp: twentyMinutesNewer
       }, {
         name: 'mid_usage_ps',
         pid: 3,
         cpu: 51,
         memory: 1001337,
         elapsed: 0,
         timestamp: twentyMinutesNewer
       }, {
         name: 'spiky_usage_ps',
         pid: 4,
         cpu: 10,
         memory: 1001337,
         elapsed: 0,
         timestamp: twentyMinutesNewer
       }, {
         name: 'decreasing_usage_ps',
         pid: 5,
         cpu: 88,
         memory: 1001337,
         elapsed: 0,
         timestamp: twentyMinutesNewer
       }];
       // Send the new 'aged' variable ? 
       process_watch.init(psLookup, pidusage)
       // Run check again
       process_watch.checkProcess();
       let watchList = process_watch.reportProcesses();
       expect(watchList, "Processes should be in watch list ").to
         .exist;
       // Test logic when fed data
       expect(watchList[3],
         "Spiky_usage should now be dropped as its old and low usage "
       ).to.not.exist;
       expect(watchList[1].cpu,
         "decreasing_usage should a. be #2 and b. have new CPU value"
       ).to.equal(88);

       // Note: ps lastDetectTime only tracks from their addition to WARN list.
       // Time spent in Watch list doesn't count 
       expect(process_watch.reportHighUsageProcess(),
           "Since processes in warn list for 15 min, should be reported"
         ).to
         .include(
           'This process may be problematic');

       // ~How often is reported
       let reportTime = ((new Date().getTime()) + (25 * 60 *
         1000));
       expect(process_watch.reportHighUsageProcess(reportTime),
           "Since processes reported only 25 min ago, should not be reported"
         ).to
         .equal(
           'issues exist');
       reportTime = ((new Date().getTime()) + (110 * 60 *
         1000));
       expect(process_watch.reportHighUsageProcess(reportTime),
           "Since processes reported 95 min ago, should be reported"
         ).to
         .include(
           'This process may be problematic');
     });

     it("Test logic when fed 4 hours newer data ", function () {
       // Alter the process variables  'age' them

       //High usage stay
       //mid and decreasing should age out
       //decreasing should low-cpu drop out
       let time = ((new Date().getTime()) + (4 * 60 * 60 *
         1000));
       testPIDs = [{
         name: 'high_usage_ps',
         pid: 1,
         cpu: 100,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'low_usage_ps',
         pid: 2,
         cpu: 24,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'mid_usage_ps',
         pid: 3,
         cpu: 48,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'spiky_usage_ps',
         pid: 4,
         cpu: 10,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'decreasing_usage_ps',
         pid: 5,
         cpu: 21,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }];
       // Send the new 'aged' variables ? 
       process_watch.init(psLookup, pidusage)
       process_watch.checkProcess(time);
       //process_watch.checkProcess();
       let watchList = process_watch.reportProcesses(time);
       expect(watchList, "Processes should be in watch list ").to
         .exist;
       //High usage stay
       //mid should age out
       //decreasing should low-cpu drop out
       expect(watchList[1],
         "This shouldn't be tracked, either aged or cpu out"
       ).to.not.exist;


       expect(watchList[0].name,
         "high_usage_ps should be only tracked ps "
       ).to.equal("high_usage_ps");

       expect(watchList[1],
         "high_usage_ps should be only tracked ps "
       ).to.not.exist;

       let report = process_watch.reportHighUsageProcess(time +
         1000);

       expect(report,
           "mid_usage_ps should age out because it's below add and after delete"
         ).to.not
         .include('mid_usage_ps');
       expect(report, "good cpu behavior out ").to.not
         .include('decreasing_usage_ps');

       expect(report, "should be reported").to.include(
         'high_usage_ps');
     });
   });
   describe("-> Unix Process Check ", function () {
     it("Test logic when fed unix stype data ", function () {

       // want logic to pick up 
       // high, spiky, and decreasing

       let time = ((new Date().getTime()) + (5.7 * 60 * 60 *
         1000));
       testPIDs = [{
         name: 'high_usage_ps',
         pid: 1,
         cpu: 1,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'low_usage_ps',
         pid: 2,
         cpu: .24,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'mid_usage_ps',
         pid: 3,
         cpu: .49,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'spiky_usage_ps',
         pid: 4,
         cpu: .88,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }, {
         name: 'decreasing_usage_ps',
         pid: 5,
         cpu: .6,
         memory: 44444444,
         elapsed: 0,
         timestamp: time
       }];
       // Send the new 'unix' variables
       process_watch.init(psLookup, pidusage)
       // Run check again
       debugger;
       process_watch.checkProcess(time);
       process_watch.checkProcess(time);
       //process_watch.checkProcess(time);
       //process_watch.checkProcess();
       // high, spiky, and decreasing
       let watchList = process_watch.reportProcesses(time);
       expect(watchList, "Processes should be in watch list ").to
         .exist;



       expect(watchList[0].name,
         "high_usage_ps should be tracked "
       ).to.equal("high_usage_ps");

       expect(watchList[2],
         "high, spiky, and decreasing should be tracked "
       ).to.exist;

       let report = process_watch.reportHighUsageProcess(time);

       expect(report,
           "mid_usage_ps should age out because it's below add and after delete"
         ).to.not
         .include('mid_usage_ps');
       expect(report, "good cpu behavior out ").to.not
         .include('decreasing_usage_ps');

       expect(report, "should be reported").to.include(
         'high_usage_ps');

     });
     // Test logic when fed data
     /* 
     it("", function () {
       // ~~removed after x time?
       // ~~removed after cpu below x usage?
       expect(.to.equal(''));
     });

     it("", function () {
       // Test data feed
       // ~examine structure of pslookup and current-process
       expect(.to.equal(''));
     });

     it("", function () {
       // Test error handling 
       // ~feed bad data
       expect(.to.equal(''));
     });
     it("", function () {
       // Test feed to bot manager 
       // ~feed bad data
       expect(.to.equal(''));
     }); */
   });
 });
