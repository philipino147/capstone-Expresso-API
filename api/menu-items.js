const sqlite3 = require('sqlite3');
//Note that since we are using this route to send HTTP requests
//affecting the "menu items" of a given "menu", we must pass along
//the 'menuId' parameter from the parent router to be used in manipulating
//the appropriate row in our 'MenuItem' SQL table

//Also the following code line is required in merging our router's parameters
//with its parent router (menuRouter)
const menuItemRouter =  require('express').Router({mergeParams:true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.get('/',(req,res,next) =>{
  db.all('SELECT * FROM MenuItem where menu_id = $menuId',
  {$menuId:req.params.menuId}, (err,row) =>{
    if (err){
      //Logs any error to the console if there is one
      //then extis function
      console.log(err);
      return;
    }
    else{
      //If selection is valid, returns all menuItem in a
      //JSON object as a property of the response body
      res.status(200).json({menuItems:row});
    }
  })
})

menuItemRouter.post('/', (req, res, next) => {
            const newMenuItem = req.body.menuItem;
            if (!newMenuItem.name || !newMenuItem.description ||
                !newMenuItem.inventory || !newMenuItem.price) {
                console.log("INVALID Menu Item");
                return res.status(400).send();
            }

            db.get('SELECT * FROM Menu WHERE Menu.id = $menuId',
            {$menuId: req.params.menuId},
            (err, row) => {
                if (err) {
                    console.log(err);
                }
                if (row = undefined) {
                    console.log('BAD Menu ID');
                    return res.status(400).send();
                }
                const sql = 'INSERT INTO MenuItem (name, description,inventory,price,menu_id) VALUES ($name, $description,$inventory,$price,$menu_id)';
                const values = {
                    $name: newMenuItem.name,
                    $description: newMenuItem.description,
                    $inventory:newMenuItem.inventory,
                    $price: newMenuItem.price,
                    $menu_id: req.params.menuId
                };

                db.run(sql, values, function(err) {
                    if (err) {
                        console.log(err);
                        return res.sendStatus(400);
                    }
                    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, function(err, row) {
                        if (!row) {
                            return res.sendStatus(400);
                        } else {
                            res.status(201).json({menuItem: row});
                        };
                    })
                });
            });
});

menuItemRouter.param("menuItemId",(req,res,next,menuItemId) =>{
  //Note that passing along menuItemId as an argument means it is
  //already declared as a string variable (even as a number "1")
  //This is ok as we will be using it in an SQL string query
  const sql = 'SELECT * FROM MenuItem where MenuItem.id=$menuItemId';
  const values = {$menuItemId: menuItemId};
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

      //Attaches the menuItemId to our request parameters
      req.params.menuItemId = menuItemId;

      //Note that if this was req.body, it would overwrite our req.body in a
      //PUT request to 'menuItem/:id'
      //The tests call for our object to be appended to res.body
      //but it can also be attached to another key in the req or res Objects
      //that are not in use
      res.body = {menuItem:row};
      next();
  })
})

menuItemRouter.put('/:menuItemId',(req,res,next) =>{
  const newMenuItem = req.body.menuItem;

  if (!newMenuItem.name || !newMenuItem.description ||
      !newMenuItem.inventory || !newMenuItem.price){
      console.log("BAD Update");
      return res.status(400).send();
    }
  else{
    //The SQL standard says that strings must use 'single quotes',
    //and identifiers (such as table and column names), when quoted, must use "double quotes".
    //For compatibility with MySQL, SQLite also allows to use single quotes for identifiers
    //and double quotes for strings, but only when the context makes the meaning unambiguous.
    //To avoid problems, just try to stick to the standard...
    const sql = 'UPDATE "MenuItem" SET "name" = $name, "description" = $description,"inventory" = $inventory, "price" = $price WHERE MenuItem.id = $id';

    const values = {
      $id: req.params.menuItemId,
      $name: newMenuItem.name,
      $description: newMenuItem.description,
      $inventory: newMenuItem.inventory,
      $price: newMenuItem.price
    };

    db.run(sql, values, function(error) {
      if (error) {
        next(error);
      } else {
        //Note that the our previously declared 'values' Object cannot be used in
        //our db.get statement as the json Object must ONLY contain values used in our
        //SQLite query in order to function appropriately
        db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $id', {$id: req.params.menuItemId}, (error, updatedMenuItems) => {
          return res.status(200).json({menuItem: updatedMenuItems});
        });
      }
    });
  }
})

menuItemRouter.delete('/:menuItemId',(req,res,next) =>{
  const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $id';
  const values = {$id: req.params.menuItemId};
  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $id',{$id : req.params.menuItemId}, (error, deletedMenuItem) => {
        if(error){
          console.log(error);
        }
        return res.status(204).send();
      });
    }
  });
})


module.exports = menuItemRouter;
