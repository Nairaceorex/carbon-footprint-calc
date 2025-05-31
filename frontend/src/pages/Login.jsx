import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials); // Line ~14
      localStorage.setItem('token', response.access_token);
      navigate('/calculator');
    } catch (err) {
      setError(err.detail || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-600">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
          <label className="block text-gray-700">Username</label>
      <input
        type="text"
        name="username"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        placeholder="Username"
        className="w-full p-2 border rounded"
      />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Password</label>
      <input
        type="password"
        name="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        placeholder="Password"
        className="w-full p-2 border rounded"
      />
      </div>
      <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Login</button>
    </form>
    </div>
  );
}

export default Login;