const express = require('express');
const apiRouter = express();

const employeeRouter = require('./employees.js');
apiRouter.use('/employees', employeeRouter);

const menuRouter = require('./menu.js');
apiRouter.use('/menus', menuRouter);
//const seriesRouter = require('./series.js');
//apiRouter.use('/series', seriesRouter);


//apiRouter.get('/artists',(req,res,send) =>{
//  res.sendStatus(200);
//});


module.exports = apiRouter;
