const express = require('express');
const apiRouter = express();

const employeesRouter = require('./employees.js');
apiRouter.use('/employees', employeesRouter);

//const seriesRouter = require('./series.js');
//apiRouter.use('/series', seriesRouter);


//apiRouter.get('/artists',(req,res,send) =>{
//  res.sendStatus(200);
//});


module.exports = apiRouter;
