import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Navbar from './components/Navbar';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto py-8 mt-[57px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            </Route>
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
