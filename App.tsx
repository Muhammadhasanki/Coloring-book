
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageGenerator from './components/ImageGenerator';
import Chatbot from './components/Chatbot';
import Button from './components/Button';
import { AppSection } from './types';
import { initializePdfWorker } from './utils/pdfWorkerSetup';

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.COLORING_BOOK_GENERATOR);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when section changes
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSection]);

  useEffect(() => {
    initializePdfWorker();
  }, []);

  return (
    <div ref={topRef} className="min-h-screen flex flex-col">
      <Header />

      <nav className="sticky top-[80px] sm:top-[76px] md:top-[72px] lg:top-[68px] z-10 bg-white bg-opacity-90 backdrop-blur-sm shadow-md p-3">
        <div className="max-w-xl mx-auto flex justify-center space-x-4">
          <Button
            onClick={() => setCurrentSection(AppSection.COLORING_BOOK_GENERATOR)}
            variant={currentSection === AppSection.COLORING_BOOK_GENERATOR ? 'primary' : 'secondary'}
            className="w-full sm:w-auto"
          >
            Coloring Book Generator
          </Button>
          <Button
            onClick={() => setCurrentSection(AppSection.CHATBOT)}
            variant={currentSection === AppSection.CHATBOT ? 'primary' : 'secondary'}
            className="w-full sm:w-auto"
          >
            AI Chat
          </Button>
        </div>
      </nav>

      <main className="flex-grow p-4 md:p-8">
        {currentSection === AppSection.COLORING_BOOK_GENERATOR ? (
          <ImageGenerator />
        ) : (
          <Chatbot />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
