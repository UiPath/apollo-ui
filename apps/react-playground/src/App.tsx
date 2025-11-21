import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppContainer } from './App.styles';
import { Breadcrumb } from './components/Breadcrumb';
import { Sidebar } from './components/Sidebar';
import { ThemeProvider } from './contexts/ThemeContext';
import { Borders } from './pages/Borders';
import { Colors } from './pages/Colors';
import { ComponentsWIP } from './pages/ComponentsWIP';
import { CoreHome } from './pages/CoreHome';
import { CssVariables } from './pages/CssVariables';
import { Fonts } from './pages/Fonts';
import { Icons } from './pages/Icons';
import { MainHome } from './pages/MainHome';
import { Screens } from './pages/Screens';
import { Shadows } from './pages/Shadows';
import { Spacing } from './pages/Spacing';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContainer>
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <Breadcrumb onMenuClick={() => setIsSidebarOpen(true)} />
          <Routes>
            <Route path="/" element={<MainHome />} />
            <Route path="/core" element={<CoreHome />} />
            <Route path="/core/css-variables" element={<CssVariables />} />
            <Route path="/core/colors" element={<Colors />} />
            <Route path="/core/fonts" element={<Fonts />} />
            <Route path="/core/spacing" element={<Spacing />} />
            <Route path="/core/shadows" element={<Shadows />} />
            <Route path="/core/borders" element={<Borders />} />
            <Route path="/core/icons" element={<Icons />} />
            <Route path="/core/screens" element={<Screens />} />
            <Route path="/components" element={<ComponentsWIP />} />
          </Routes>
        </AppContainer>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
