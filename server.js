const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');


const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(errorHandler());
app.use(morgan('dev'));

const apiRouter = require('./api/api.js');
app.use('/api',apiRouter);

app.listen(PORT, () => {
  console.log(`Server is listening for requests at port ${PORT}`);
});

module.exports = app;
