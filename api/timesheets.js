const sqlite3 = require('sqlite3');
//Note that since we are using this route to send HTTP requests
//affecting the "timesheets" of a given "employee", we must pass along
//the 'employeeId' parameter from the parent router to be used in manipulating
//the appropriate row in our 'Timesheet' SQL table

//Also the following code line is required in merging our router's parameters
//with its parent router (employeeRouter)
const timesheetRouter =  require('express').Router({mergeParams:true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetRouter.get('/',(req,res,next) =>{
  db.all('SELECT * FROM Timesheet where employee_id = $employeeId',
  {$employeeId:req.params.employeeId}, (err,row) =>{
    if (err){
      //Logs any error to the console if there is one
      //then extis function
      console.log(err);
      return;
    }
    else{
      //If selection is valid, returns all timesheet in a
      //JSON object as a property of the response body
      res.status(200).json({timesheets:row});
    }
  })
})

timesheetRouter.post('/', (req, res, next) => {
            const newTimesheet = req.body.timesheet;
            if (!newTimesheet.hours || !newTimesheet.rate ||
                !newTimesheet.date) {
                console.log("INVALID Timesheet");
                return res.status(400).send();
            }

            db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId',
            {$employeeId: req.params.employeeId},
            (err, row) => {
                if (err) {
                    console.log(err);
                }
                if (row = undefined) {
                    console.log('BAD Employee ID');
                    return res.status(400).send();
                }
                const sql = 'INSERT INTO Timesheet (hours,rate,date,employee_id) VALUES ($hours,$rate,$date,$employee_id)';
                const values = {
                    $hours: newTimesheet.hours,
                    $date: newTimesheet.date,
                    $rate:newTimesheet.rate,
                    $employee_id: req.params.employeeId
                };

                db.run(sql, values, function(err) {
                    if (err) {
                        console.log(err);
                        return res.sendStatus(400);
                    }
                    db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, function(err, row) {
                        if (!row) {
                            return res.sendStatus(400);
                        } else {
                            res.status(201).json({timesheet: row});
                        };
                    })
                });
            });
});

timesheetRouter.param("timesheetId",(req,res,next,timesheetId) =>{
  //Note that passing along timesheetId as an argument means it is
  //already declared as a string variable (even as a number "1")
  //This is ok as we will be using it in an SQL string query
  const sql = 'SELECT * FROM Timesheet where Timesheet.id=$timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql,values, function (err,row) {
    if (err){
      //Logs any error to the console if there is one
      console.log(err);
      return;
    }
    else if(row === undefined){
      return res.sendStatus(404);
    }
     //Execute if no errors in sqlite query
      //Calls next middleware function

      //Attaches the timesheetId to our request parameters
      req.params.timesheetId = timesheetId;

      //Note that if this was req.body, it would overwrite our req.body in a
      //PUT request to 'timesheet/:id'
      //The tests call for our object to be appended to res.body
      //but it can also be attached to another key in the req or res Objects
      //that are not in use
      res.body = {timesheet:row};
      next();
  })
})

timesheetRouter.put('/:timesheetId',(req,res,next) =>{
  const newTimesheet = req.body.timesheet;

  if (!newTimesheet.hours || !newTimesheet.rate ||
      !newTimesheet.date){
      console.log("BAD Update");
      return res.status(400).send();
    }
  else{
    //The SQL standard says that strings must use 'single quotes',
    //and identifiers (such as table and column names), when quoted, must use "double quotes".
    //For compatibility with MySQL, SQLite also allows to use single quotes for identifiers
    //and double quotes for strings, but only when the context makes the meaning unambiguous.
    //To avoid problems, just try to stick to the standard...
    const sql = 'UPDATE "Timesheet" SET "hours" = $hours, "date" = $date,"rate" = $rate WHERE Timesheet.id = $id';

    const values = {
      $id: req.params.timesheetId,
      $hours: newTimesheet.hours,
      $rate: newTimesheet.rate,
      $date: newTimesheet.date,
    };

    db.run(sql, values, function(error) {
      if (error) {
        next(error);
      } else {
        //Note that the our previously declared 'values' Object cannot be used in
        //our db.get statement as the json Object must ONLY contain values used in our
        //SQLite query in order to function appropriately
        db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $id', {$id: req.params.timesheetId}, (error, updatedTimesheet) => {
          return res.status(200).json({timesheet: updatedTimesheet});
        });
      }
    });
  }
})

timesheetRouter.delete('/:timesheetId',(req,res,next) =>{
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $id';
  const values = {$id: req.params.timesheetId};
  db.run(sql, values, function(error) {
    if (error) {
      console.log(error);
    } else {
      db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $id',{$id : req.params.timesheetId}, (error, deletedTimesheet) => {
        if(error){
          console.log(error);
        }
        else if(deletedTimesheet !== undefined){
          console.log('DELETE unsuccessful');
          return;
        }
        return res.status(204).send();
      });
    }
  });
})


module.exports = timesheetRouter;
