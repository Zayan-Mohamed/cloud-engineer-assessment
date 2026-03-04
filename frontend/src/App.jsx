import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  // 1. Read (View list of records)
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}tasks/`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. Create & Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // We use FormData because we are handling file uploads
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) {
      formData.append('file_attachment', file);
    }

    try {
      if (editingId) {
        // Update existing record
        await axios.patch(`${API_URL}tasks/${editingId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setEditingId(null);
      } else {
        // Create new record
        await axios.post(`${API_URL}tasks/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refresh list
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  // Populate form for editing
  const handleEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setFile(null); // Force user to re-upload if they want to change the file
  };

  // 3. Delete
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}tasks/${id}/`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Cloud Engineer CRUD App</h1>
      
      {/* Form Section */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Task Title (Required)" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
        <textarea 
          placeholder="Description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
        />
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files[0])} 
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          {editingId ? 'Update Task' : 'Add Task'}
        </button>
        {editingId && (
          <button type="button" onClick={() => {
            setEditingId(null); setTitle(''); setDescription(''); setFile(null);
          }}>Cancel Edit</button>
        )}
      </form>

      {/* List Section */}
      <h2>Task List</h2>
      {tasks.length === 0 ? <p>No tasks found.</p> : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li key={task.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{task.title}</h3>
              <p>{task.description}</p>
              {task.file_attachment && (
                <p><a href={task.file_attachment} target="_blank" rel="noopener noreferrer">View Attached File (S3)</a></p>
              )}
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleEdit(task)} style={{ marginRight: '10px' }}>Edit</button>
                <button onClick={() => handleDelete(task.id)} style={{ color: 'red' }}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
