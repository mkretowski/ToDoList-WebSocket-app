import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
const App = () => {
  const [socket, setSocket] = useState(undefined);
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTaskName, setEditedTaskName] = useState('');

  // initialize the socket connection when the component mounts
  useEffect(() => {
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);
    newSocket.on('removeTask', (id) => removeTask(id));
    newSocket.on('addTask', (id) => addTask(id));
    newSocket.on('updateTasks', (tasks) => {
      updateTasks(tasks);
    });
    return () => {
      newSocket.disconnect(); // disconnect from the server when the component unmounts
    };
  }, []);

  const removeTask = (id) => {
    setTasks((tasks) => tasks.filter((task) => task.id !== id));
  };

  const addTask = (task) => {
    setTasks((tasks) => [...tasks, task]);
  };

  const updateTasks = (tasks) => {
    setTasks(tasks);
  };

  const editTask = (name, id) => {
    setEditedTaskName(name);
    setIsEditing(id);
  };

  const submitForm = () => {
    const taskId = uuidv4();
    addTask({ name: taskName, id: taskId });
    socket.emit('addTask', { name: taskName, id: taskId });
    setTaskName('');
  };

  const saveEditedTask = (id, newName) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, name: newName } : task)));
    setIsEditing(false);
    socket.emit('editTask', { id: id, name: newName });
  };

  return (
    <div className='App'>
      <header>
        <h1>ToDoList.app</h1>
      </header>

      <section className='tasks-section' id='tasks-section'>
        <h2>Tasks</h2>

        <ul className='tasks-section__list' id='tasks-list'>
          {tasks.map((task) => (
            <li className='task' key={task.id}>
              {isEditing === task.id ? (
                <>
                  <input
                    className='text-input'
                    type='text'
                    value={editedTaskName}
                    onChange={(e) => setEditedTaskName(e.target.value)}
                  />
                  <button className='btn' onClick={() => saveEditedTask(task.id, editedTaskName)}>
                    Save
                  </button>
                  <button
                    className='btn'
                    onClick={() => {
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className='task-name'>{task.name}</span>
                  <div>
                    <button
                      className='btn'
                      onClick={(e) => {
                        e.preventDefault();
                        editTask(task.name, task.id);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className='btn btn--red'
                      onClick={(e) => {
                        e.preventDefault();
                        socket.emit('removeTask', task.id);
                        removeTask(task.id);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        <form
          id='add-task-form'
          onSubmit={(e) => {
            e.preventDefault();
            submitForm();
          }}
        >
          <input
            className='text-input'
            autoComplete='off'
            type='text'
            placeholder='Type your description'
            id='task-name'
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
          <button className='btn' type='submit'>
            Add
          </button>
        </form>
      </section>
    </div>
  );
};

export default App;
