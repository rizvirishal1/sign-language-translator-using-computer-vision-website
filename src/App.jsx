//imports...
import { BrowserRouter } from 'react-router';
import { Navigate } from 'react-router';
import { Route } from 'react-router';
import { Routes } from 'react-router';
//layout
import MainLayout from './layout/Main Layout/MainLayout.jsx';
//pages
import Sign2Text from './pages/Sign2Text/Sign2Text.jsx';
import Text2Sign from './pages/Text2Sign/Text2Sign.jsx';
//styles
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/sign2text" element={<MainLayout><Sign2Text /></MainLayout>} />
          <Route path="/text2sign" element={<MainLayout><Text2Sign /></MainLayout>} />
          <Route path="*" element={<Navigate to="/sign2text" />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App;