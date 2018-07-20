const sqlite3 = require('sqlite3');
const express = require('express');
const menuRouter = express();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const menuItemsRouter = require('./menu-items.js');
menuRouter.use('/:menuId/menu-items', menuItemsRouter);

menuRouter.get('/',(req,res,next) =>{
    db.all('SELECT * FROM Menu', (err,row) =>{
      if (err){
        //Logs any error to the console if there is one
        //then extis function
        //Note that 'throwing' an error will cause Javascript to stop
        //functioning also
        console.log(err);
        return;
      }
      else{
        //If selection is valid, returns all menus in a
        //JSON object as a property of the response body
        res.status(200).json({menus:row});
      }
    })
})

menuRouter.post('/', (req, res, next) => {
const newMenu = req.body.menu;

  const sql = 'INSERT INTO Menu (title) VALUES ($title)';
  const values =   {$title:newMenu.title,};

  db.run(sql,values,
  function(err) {
    if (err) {
      console.log(err);
      return res.sendStatus(400);
    }
    db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
    (err, row) => {
      if (!row) {
        return res.sendStatus(400);
        }
      res.status(201).send({ menu: row });
    });
  })
});

menuRouter.param("menuId",(req,res,next,id) =>{
  const menuId = id;
  const sql = 'SELECT * FROM Menu where Menu.id=$menuId';
  const values = {$menuId: menuId};
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
      req.params.menuId = menuId;

      //Attaches menu object with row properties
      //to our response body
      //Note that if this was req.body, it would overwrite our req.body in a
      //PUT request to 'menu/:id'
      //The tests call for our object to be appended to res.body
      //but it can also be attached to another key in the req or res Objects
      //that are not in use
      res.body = {menu:row};
      next();
  })
})

menuRouter.get('/:menuId',(req,res,next) =>{
  res.status(200).json(res.body);
})

menuRouter.put('/:menuId',(req,res,next) =>{
  const newMenu = req.body.menu;
  if (!newMenu.title){
      console.log("BAD Update");
      return res.status(400).send();
    }
  else{
    //The SQL standard says that strings must use 'single quotes',
    //and identifiers (such as table and column names), when quoted, must use "double quotes".
    //For compatibility with MySQL, SQLite also allows to use single quotes for identifiers
    //and double quotes for strings, but only when the context makes the meaning unambiguous.
    //To avoid issues, just try to stick to the standard...
    const sql = 'UPDATE "Menu" SET "title" = $title WHERE Menu.id = $id';

    const values = {
      $id: req.params.menuId,
      $title: newMenu.title
    };

    db.run(sql, values, function(error) {
      if (error) {
        next(error);
      } else {
        //Note that the our previously declared 'values' Object cannot be used in
        //our db.get statement as the json Object must ONLY contain values used in our
        //SQLite query in order to function appropriately
        db.get('SELECT * FROM Menu WHERE Menu.id = $id', {$id: req.params.menuId}, (error, updatedMenu) => {
          return res.status(200).json({menu: updatedMenu});
        });
      }
    });
  }
})

menuRouter.delete('/:menuId',(req,res,next) =>{
  db.get('SELECT * FROM MenuItem WHERE menu_id = $menuId',{$menuId:req.params.menuId},
  function(error,row){
    if(error){
      console.log(err);
      return;
    }
    else if(row){
      console.log("There's a menu item with our Menu's ID!");
      return res.sendStatus(400);
    }
  const sql = 'DELETE FROM Menu WHERE Menu.id = $id';
  const values = {$id: req.params.menuId};
  db.run(sql, values, function(error) {
    if (error) {
      console.log(error);
      return;
    } else {
      db.get('SELECT * FROM Menu WHERE Menu.id = $id',{$id : req.params.menuId}, (error, deletedMenu) => {
        if(error){
          console.log(error);
        }
        return res.status(204).send();
      });
    }
  });
})
})


module.exports = menuRouter;
