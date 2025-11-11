
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
// html2canvas is not strictly used in PDF generation, only for screenshot type uses. It can be removed if not needed elsewhere.
// Keeping it as it was in the original file, but commented out if not used.
// import html2canvas from 'html2canvas'; 
import { ColoringPage } from '../types';
import { generateColoringPageImage } from '../services/geminiService';
import { NUMBER_OF_COLORING_PAGES } from '../constants';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

// Placeholder for sound files. In a real application, you would host these files
// (e.g., in a `/public/sounds` directory) and provide their correct paths.
// For this example, we'll use generic paths.
const BUTTON_CLICK_SOUND_SRC = '/sounds/button-click.mp3'; // e.g., a short, subtle click sound
const PAGE_COMPLETE_SOUND_SRC = '/sounds/page-chime.mp3'; // e.g., a gentle chime sound

const ImageGenerator: React.FC = () => {
  const [theme, setTheme] = useState<string>('');
  const [childName, setChildName] = useState<string>('');
  const [coloringPages, setColoringPages] = useState<ColoringPage[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false); // Overall loading for initial generation
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false); // Loading for PDF download
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPage, setSelectedPage] = useState<ColoringPage | null>(null);


  const coloringBookRef = useRef<HTMLDivElement>(null); // Not directly used for PDF content, but for general reference.

  // Refs for audio elements
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const pageCompleteSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements once when the component mounts
    clickSoundRef.current = new Audio(BUTTON_CLICK_SOUND_SRC);
    pageCompleteSoundRef.current = new Audio(PAGE_COMPLETE_SOUND_SRC);

    // Optionally set volume to keep sounds subtle
    if (clickSoundRef.current) clickSoundRef.current.volume = 0.3;
    if (pageCompleteSoundRef.current) pageCompleteSoundRef.current.volume = 0.3;
  }, []); // Empty dependency array ensures this runs only once

  const playClickSound = () => {
    if (clickSoundRef.current) {
      // Set currentTime to 0 to allow the sound to play again immediately
      // if the button is clicked in quick succession.
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(e => console.warn("Error playing click sound:", e));
    }
  };

  const playPageCompleteSound = () => {
    if (pageCompleteSoundRef.current) {
      pageCompleteSoundRef.current.currentTime = 0;
      pageCompleteSoundRef.current.play().catch(e => console.warn("Error playing page complete sound:", e));
    }
  };

  const pagePrompts = useCallback((name: string, theme: string): string[] => [
    `A ${theme} character waving, for ${name} to color`,
    `A fun scene with a ${theme} creature playing, for ${name} to color`,
    `A simple landscape featuring ${theme} elements, for ${name} to color`,
    `A vehicle or object related to ${theme}, for ${name} to color`,
    `A group of cute ${theme} characters, for ${name} to color`,
  ], []);

  const generateSinglePage = async (pageId: string, prompt: string, pageIndex: number) => {
    // Update the specific page's loading state
    setColoringPages(prevPages =>
      prevPages.map(p => p.id === pageId ? { ...p, isGenerating: true, error: undefined } : p)
    );

    try {
      const imageUrl = await generateColoringPageImage(prompt);
      setColoringPages(prevPages =>
        prevPages.map(p => p.id === pageId ? { ...p, imageUrl, isGenerating: false, error: undefined } : p)
      );
      playPageCompleteSound(); // Play sound after each page generation completes
    } catch (err) {
      console.error(`Error generating page ${pageIndex + 1} (${pageId}):`, err);
      setColoringPages(prevPages =>
        prevPages.map(p => p.id === pageId ? { ...p, error: `Failed: ${(err as Error).message}`, isGenerating: false, imageUrl: undefined } : p)
      );
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound(); // Play sound on generate button click
    setError(null);
    if (!theme || !childName) {
      setError('Please provide both a theme and a child\'s name.');
      return;
    }

    setIsGeneratingAll(true);
    setColoringPages([]); // Clear previous pages
    const initialPrompts = pagePrompts(childName, theme);
    const initialPages: ColoringPage[] = initialPrompts.map((prompt, index) => ({
      id: `page-${index + 1}`,
      prompt: prompt,
      isGenerating: true,
      imageUrl: undefined,
      error: undefined,
    }));
    setColoringPages(initialPages);

    for (let i = 0; i < initialPages.length; i++) {
      // Use a brief delay to allow React to update the UI with the "isGenerating" state
      // before blocking with the API call. This makes the spinners appear more responsively.
      await new Promise(resolve => setTimeout(resolve, 50)); 
      await generateSinglePage(initialPages[i].id, initialPages[i].prompt, i);
    }
    setIsGeneratingAll(false);
  };

  const handleRetry = async (pageId: string) => {
    playClickSound(); // Play sound on retry button click
    setError(null); // Clear overall error if any
    const pageToRetry = coloringPages.find(p => p.id === pageId);
    if (pageToRetry) {
      await generateSinglePage(pageToRetry.id, pageToRetry.prompt, coloringPages.indexOf(pageToRetry));
    }
  };


  const handleDownloadPdf = async () => {
    playClickSound(); // Play sound on download button click
    if (coloringPages.length === 0 || coloringPages.some(page => page.isGenerating || page.error)) {
      alert('Please wait for all pages to generate successfully before downloading, or retry failed pages!');
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10; // 1cm margin
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      // 1. Add Cover Page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(48);
      doc.setTextColor(50, 50, 50); // Dark grey

      doc.text('Coloring Adventures!', pageWidth / 2, pageHeight / 3, { align: 'center' });

      doc.setFontSize(24);
      doc.setFont('helvetica', 'normal');
      doc.text(`for ${childName}`, pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.text(`Theme: ${theme}`, pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });

      // Add a simple border or decorative element
      doc.setDrawColor(100, 100, 200); // Blueish border
      doc.setLineWidth(2);
      doc.rect(margin, margin, contentWidth, contentHeight, 'S');

      // 2. Add Coloring Pages
      for (const page of coloringPages) {
        if (!page.imageUrl) continue; // Skip pages that failed or are still generating

        doc.addPage();
        // Add a title for the page
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text(page.prompt, pageWidth / 2, margin + 5, { align: 'center' });

        // Add image (scaling to fit with aspect ratio maintained)
        const img = new Image();
        img.src = page.imageUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        let finalImgWidth = contentWidth;
        let finalImgHeight = (imgHeight / imgWidth) * finalImgWidth;

        if (finalImgHeight > contentHeight - 20) { // Adjust for prompt text and title
          finalImgHeight = contentHeight - 20;
          finalImgWidth = (imgWidth / imgHeight) * finalImgHeight;
        }

        const x = (pageWidth - finalImgWidth) / 2;
        const y = (pageHeight - finalImgHeight) / 2 + 10; // Shift down slightly to account for title

        doc.addImage(page.imageUrl, 'PNG', x, y, finalImgWidth, finalImgHeight, undefined, 'FAST');

        // Add border around each coloring page content
        doc.setDrawColor(150, 150, 150); // Light grey border
        doc.setLineWidth(1);
        doc.rect(margin, margin, contentWidth, contentHeight, 'S');
      }

      doc.save(`${childName}-${theme}-coloring-book.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to create PDF: ${(err as Error).message}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const openModal = (page: ColoringPage) => {
    playClickSound();
    setSelectedPage(page);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    playClickSound();
    setIsModalOpen(false);
    setSelectedPage(null);
  };

  const overallLoading = isGeneratingAll || isDownloadingPdf;

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-3xl font-bold text-gray-700 mb-6 text-center">Create a Custom Coloring Book!</h2>

      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4 mb-8">
        <div>
          <label htmlFor="theme" className="block text-gray-700 text-sm font-bold mb-2">
            Theme (e.g., "space dinosaurs", "friendly monsters"):
          </label>
          <input
            type="text"
            id="theme"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Enter a fun theme"
            required
            disabled={overallLoading}
          />
        </div>
        <div>
          <label htmlFor="childName" className="block text-gray-700 text-sm font-bold mb-2">
            Child's Name:
          </label>
          <input
            type="text"
            id="childName"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter child's name"
            required
            disabled={overallLoading}
          />
        </div>
        <Button type="submit" fullWidth disabled={overallLoading}>
          {isGeneratingAll ? 'Generating...' : 'Generate Coloring Book'}
        </Button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative w-full max-w-md mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isGeneratingAll && coloringPages.length === 0 && <LoadingSpinner />}

      {coloringPages.length > 0 && (
        <div className="mt-8 w-full max-w-4xl">
          <h3 className="text-2xl font-bold text-gray-700 mb-4 text-center">Your Coloring Pages!</h3>
          <div ref={coloringBookRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {coloringPages.map((page) => (
              <div
                key={page.id}
                className="bg-white p-4 rounded-xl shadow-md flex flex-col items-center animate-fade-in"
                // Conditional class for cursor and hover effect if clickable (has imageUrl)
                onClick={page.imageUrl && !page.isGenerating ? () => openModal(page) : undefined}
                tabIndex={page.imageUrl && !page.isGenerating ? 0 : -1}
                role={page.imageUrl && !page.isGenerating ? "button" : undefined}
                aria-label={page.imageUrl && !page.isGenerating ? `View larger image of ${page.prompt}` : undefined}
              >
                <p className="text-gray-600 text-center mb-2 text-sm italic">{page.prompt}</p>
                {page.isGenerating && <LoadingSpinner />}
                {page.error && (
                  <div className="text-red-500 text-sm text-center mb-2">
                    {page.error}
                    <Button onClick={() => handleRetry(page.id)} variant="secondary" size="sm" className="mt-2">
                      Retry
                    </Button>
                  </div>
                )}
                {page.imageUrl && !page.isGenerating && (
                  <img
                    src={page.imageUrl}
                    alt={page.prompt}
                    className="w-full h-auto rounded-lg border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={handleDownloadPdf} disabled={overallLoading || coloringPages.some(p => p.isGenerating || !p.imageUrl)} size="lg" className="px-8 py-3">
              {isDownloadingPdf ? 'Preparing PDF...' : 'Download Coloring Book PDF'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal for image preview */}
      {isModalOpen && selectedPage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 relative max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h3 id="modal-title" className="text-2xl font-bold text-gray-800 mb-4 text-center">
              {selectedPage.prompt}
            </h3>
            <div className="flex justify-center mb-4">
              <img
                src={selectedPage.imageUrl}
                alt={selectedPage.prompt}
                className="max-w-full max-h-[70vh] rounded-lg border border-gray-200 object-contain"
              />
            </div>
            <div className="text-center">
              <Button onClick={closeModal} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;