import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const AuthPage = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [usernameValid, setUsernameValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

  const validateUsername = (name) => {
  const usernameRegex = /^[a-z0-9_]{4,20}$/;
  return usernameRegex.test(name);
  };
const validatePassword = (pwd) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(pwd);
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // const formattedusername = username
    // .trim()
    // .replace(/\s+/g, ' ')
    // .split(' ')
    // .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    // .join(' ');
    // //if (!formattedusername) return setError('username is required');
    // setUsername(formattedusername);

    try {
      if (isLogin) {
        await login({ username, password });
      } else {
        // console.log('Sending registration request to:', 'http://localhost:5000/register');
        // console.log('Request payload:', { username, password });

        const response = await axios.post('https://notesappserver-u4v5.onrender.com/auth/register', { username, password });
        console.log('Registration response:', response.data);

        setSuccessMessage('Registration successful! Logging you in...');
        console.log('Attempting automatic login with:', { username, password });
        await new Promise(resolve => setTimeout(resolve, 3000));
        await login({ username, password }); // Automatically log in after registration
      }
    } catch (error) {
      setError(
        error.response?.data?.error || 'Request Failed'
      );
      console.error('Authentication error:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };
  /* in case to remove title-> min-h-screen flex items-center justify-center bg-gray-50*/
  return (
  
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
    <h1 className="text-3xl font-semibold text-gray-800 mt-12 mb-8">
    AI Powered Notes Application
  </h1>
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600">
            {isLogin
              ? 'Sign in to continue'
              : 'Get started with your AI-powered notes'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-600 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1 relative">
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) =>{const input = e.target.value.toLowerCase().replace(/\s/g, '');
                 setUsername(input);  
                 setUsernameValid(validateUsername(input)); 
                }}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
              <UserIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            {!usernameValid && (
  <p className="text-sm text-red-500 mt-1">
    Username must be 4-20 characters, lowercase letters, numbers, or underscores only.
  </p>
)}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) =>{  
                  const pwd = e.target.value;
                  setPassword(pwd);
                  setPasswordValid(validatePassword(pwd));
                }}
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
              <LockClosedIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            </div>
            {!passwordValid && (
  <p className="text-sm text-red-500 mt-1">
    Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
  </p>
)}
          </div>

          <div>
            <button
              type="submit"
            disabled={isLoading || !usernameValid || !passwordValid}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
               <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;