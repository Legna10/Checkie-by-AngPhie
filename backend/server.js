const express = require("express"); 
const app = express(); 
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const PORT = 5000; //define port that will run
const DATA_FILE = path.join(__dirname, "data.json"); //path json file

//mastiin json, jadi kalau ga ada isinya bakal otomatis ginii
let data = {
  tasks: [],
  stickies: [],
  taskId: 1,
  stickyId: 1
};

//read or fetch json
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8"); 
      data = JSON.parse(raw); 
    } catch (err) {
      console.error("Error reading data file:", err); 
    }
  } else {
    saveData();
  }
}

//saving data to json 
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.use(cors()); //Allow requests from frontend browsers with different origins
app.use(express.json()); //Enable middleware to read JSON body from request.
app.use(express.static(path.join(__dirname, "../frontend"))); //

app.get("/index.js", (req, res) => {
  res.sendFile(path.join(__dirname, "index.js"));
});

//todo CRUD
//read or fetch
app.get("/api/tasks", (req, res) => {
  res.json(data.tasks);
});

//create or add new data
app.post("/api/tasks", (req, res) => {
  const task = { id: data.taskId++, ...req.body };
  data.tasks.push(task);
  saveData();
  res.status(201).json(task); //request successful and data was created
});

//update or edit by id
app.put("/api/tasks/:id", (req, res) => {
  const id = req.params.id;
  const task = data.tasks.find(t => t.id == id);
  if (!task) return res.status(404).send("Task not found");

  if ("completed" in req.body) task.completed = req.body.completed;
  if ("text" in req.body) task.text = req.body.text;
  if ("dueDate" in req.body) task.dueDate = req.body.dueDate;
  if ("priority" in req.body) task.priority = req.body.priority;
  if ("tag" in req.body) task.tag = req.body.tag;

  saveData();
  res.json(task);
});

//delete by id
app.delete("/api/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  data.tasks = data.tasks.filter(task => task.id !== id);
  saveData();
  res.sendStatus(204); //request successfully processed
});


//Sticky wall CRUD//
//read or fetch existing data
app.get("/api/stickies", (req, res) => {
  res.json(data.stickies);
}); 

//create or add new data
app.post("/api/stickies", (req, res) => {
  const note = { id: data.stickyId++, ...req.body };
  data.stickies.push(note);
  saveData();
  res.status(201).json(note); //request successful and data was created
});

//update or edit by id
app.put("/api/stickies/:id", (req, res) => {
  const id = req.params.id;
  const note = data.stickies.find(n => n.id == id);
  if (!note) return res.status(404).send("Sticky not found");

  note.title = req.body.title;
  note.body = req.body.body;

  saveData();
  res.json(note);
}); 

//delete by id
app.delete("/api/stickies/:id", (req, res) => {
  const id = parseInt(req.params.id);
  data.stickies = data.stickies.filter(note => note.id !== id);
  saveData();
  res.sendStatus(204); //request successfully processed
});

//run server
loadData();
app.listen(PORT, () => {
  console.log(` Backend running on http://localhost:${PORT}`);
});
