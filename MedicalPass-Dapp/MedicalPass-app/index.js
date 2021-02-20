var express = require("express");
var fs = require("fs");
var app = express();

var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("src"));
app.use(express.static("../MedicalPass-contract/build/contracts"));


app.get('/', function (req, res) {
    res.render('index.html');
  });
app.get("/ClincRecord", function(req,res){
  let content = fs.readFileSync("db/Record.json");
  let cursor = JSON.parse(content);
  let board = {};

  for (index in cursor){
    board[cursor[index].Doc] = cursor[index];
  }
  
  console.log(board);
  res.send(board);
})

app.post("/UpdateClincRecord",function(req,res){
  let add = req.body.Address;
  let status = req.body.Status;
  let content = fs.readFileSync("db/Record.json");
  let cursor = JSON.parse(content);
  let newData={
    Doc:add,
    Status:status
  }
  cursor.push(newData);
  fs.writeFile("./db/Record.json",JSON.stringify(cursor),err => {
    if (err) throw err;
    console.log("Done");
  })
})


  
app.listen(3000, function () {
    console.log('Auction Dapp listening on port 3000!');
  });