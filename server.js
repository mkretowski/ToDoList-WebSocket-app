const express = require('express');
const app = express();
const path = require('path');
const socket = require('socket.io');
let tasks = [];

app.use(express.static(path.join(__dirname, '/client'))); // Serve static files from the React app
app.use(express.urlencoded({ extended: false })); //x-www-form-urlencoded

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/client/index.html'));
});

app.use((req, res) => {
  res.status(404).send('404 not found...');
});

const server = app.listen(process.env.PORT || 8000, () => {
  console.log('Server is running on port: 8000');
});

const io = socket(server);

io.on('connection', (socket) => {
  console.log('New client! Its id - ' + socket.id);
  socket.emit('updateTasks', tasks);

  socket.on('addTask', (task) => {
    tasks.push(task);
    console.log('Task ' + task.name + ' has been added');
    socket.broadcast.emit('addTask', task);
  });
  socket.on('removeTask', (id) => {
    const index = tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      const { name } = tasks.splice(index, 1)[0];
      const messageContent = 'Task ' + name + ' has been removed';
      console.log(messageContent);
    }
    socket.broadcast.emit('removeTask', id);
  });

  socket.on('editTask', (newData) => {
    tasks = tasks.map((task) => (task.id === newData.id ? { ...task, name: newData.name } : task));
    socket.broadcast.emit('updateTasks', tasks);
  });

  socket.on('disconnect', () => {
    console.log('Oh, socket ' + socket.id + ' has left');
  });
  console.log("I've added a listener on message and disconnect events \n");
});
