const sqlite3 = require('sqlite3');
const express = require('express');
const employeeRouter = express();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = require('./timesheets.js');
employeeRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeeRouter.get('/',(req,res,next) =>{
    db.all('SELECT * FROM Employee where Employee.is_current_employee = 1', (err,row) =>{
      if (err){
        //Logs any error to the console if there is one
        //then extis function
        console.log(err);
        return;
      }
      else{
        //If selection is valid, returns all employees in a
        //JSON object as a property of the response body
        res.status(200).json({employees:row});
      }
    })
})

employeeRouter.post('/', (req, res, next) => {
const newEmployee = req.body.employee;
const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position,$wage,$isCurrentEmployee)';
  const values =   {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $isCurrentEmployee: isCurrentEmployee};

  db.run(sql,values,
  function(err) {
    if (err) {
      console.log(err);
      return res.sendStatus(400);
    }
    db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
    (err, row) => {
      if (!row) {
        return res.sendStatus(400);
        }
      res.status(201).send({ employee: row });
    });
  })
});

employeeRouter.param("employeeId",(req,res,next,id) =>{
  const employeeId = id;
  const sql = 'SELECT * FROM Employee where Employee.id=$employeeId';
  const values = {$employeeId: employeeId};
  db.get(sql,values, function (err,row) {
    if (err){
      //Logs any error to the console if there is one
      //then calls next to continue printing out other
      //existant errors
      console.log(err);
      return;
    }
    else if(row === undefined){
      //console.log("Row Non-Existant");
      return res.sendStatus(404);
    }
     //Execute if no errors in sqlite query
      //Calls next middleware function
      req.params.id = employeeId;

      //Attaches employee object with row properties
      //to our response body
      //Note that if this was req.body, it would overwrite our req.body in a
      //PUT request to 'employee/:id'
      //The tests call for our object to be appended to res.body
      //but it can also be attached to another key in the req or res Objects
      //that are not in use
      res.body = {employee:row};
      next();
  })
})

employeeRouter.get('/:employeeId',(req,res,next) =>{
  res.status(200).json(res.body);
})

employeeRouter.put('/:employeeId',(req,res,next) =>{
  const newEmployee = req.body.employee;

  if (!newEmployee.name || !newEmployee.position ||
    !newEmployee.wage){
      console.log("BAD Update");
      return res.status(400).send();
    }
  else{
    //The SQL standard says that strings must use 'single quotes',
    //and identifiers (such as table and column names), when quoted, must use "double quotes".
    //For compatibility with MySQL, SQLite also allows to use single quotes for identifiers
    //and double quotes for strings, but only when the context makes the meaning unambiguous.
    //To avoid issues, just try to stick to the standard...
    const sql = 'UPDATE "Employee" SET "name" = $name, "position" = $position,"wage" = $wage WHERE Employee.id = $id';

    const values = {
      $id: req.params.id,
      $name: newEmployee.name,
      $position: newEmployee.position,
      $wage: newEmployee.wage
    };

    db.run(sql, values, function(error) {
      if (error) {
        next(error);
      } else {
        //Note that the our previously declared 'values' Object cannot be used in
        //our db.get statement as the json Object must ONLY contain values used in our
        //SQLite query in order to function appropriately
        db.get('SELECT * FROM Employee WHERE Employee.id = $id', {$id: req.params.id}, (error, updatedEmployee) => {
          return res.status(200).json({employee: updatedEmployee});
        });
      }
    });
  }
})

employeeRouter.delete('/:employeeId',(req,res,next) =>{
  const sql = `UPDATE Employee
  SET is_current_employee = 0 WHERE Employee.id = $id`;
  const values = {$id: req.params.id};
  db.run(sql, values, function(error) {
    if (error) {
      console.log(error);
    } else {
      db.get('SELECT * FROM Employee WHERE Employee.id = $id', values, (error, updatedEmployee) => {
        return res.status(200).json({employee: updatedEmployee});
      });
    }
  });
})


module.exports = employeeRouter;
