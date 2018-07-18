const sqlite3 = require('sqlite3');
const express = require('express');
const employeesRouter = express();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');


employeesRouter.get('/',(req,res,next) =>{
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

employeesRouter.post('/', (req, res, next) => {
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

employeesRouter.param("employeeId",(req,res,next,id) =>{
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

employeesRouter.get('/:employeeId',(req,res,next) =>{
  res.status(200).json(res.body);
})

module.exports = employeesRouter;
