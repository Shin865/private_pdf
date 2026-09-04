import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Merge from './pages/Merge';
import Split from './pages/Split';
import Compress from './pages/Compress';
import Rotate from './pages/Rotate';
import PageEditor from './pages/PageEditor';
import Convert from './pages/Convert';
import Watermark from './pages/Watermark';
import PdfToOffice from './pages/PdfToOffice';
import OcrPage from './pages/OcrPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merge" element={<Merge />} />
          <Route path="/split" element={<Split />} />
          <Route path="/compress" element={<Compress />} />
          <Route path="/rotate" element={<Rotate />} />
          <Route path="/pages" element={<PageEditor />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/watermark" element={<Watermark />} />
          <Route path="/pdf-to-office" element={<PdfToOffice />} />
          <Route path="/ocr" element={<OcrPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
