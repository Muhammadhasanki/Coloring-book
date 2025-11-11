
import { jsPDF } from 'jspdf';

// This function attempts to set up the optional web worker for jspdf.
// It's not strictly necessary for basic functionality but can improve performance
// for larger PDFs by offloading work to a background thread.
export function initializePdfWorker() {
  try {
    // Only attempt to set up if running in a browser environment
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      // jspdf by default looks for the worker script at 'jspdf.worker.js'
      // relative to the main script. For CDN/bundled setups, this might need
      // to be explicitly pointed to. For simple local setups, it might just work.
      // If you're bundling, ensure jspdf.worker.js is copied to your output.
      // For this example, we're assuming jspdf's default behavior, which often means
      // it won't find the worker unless specifically configured or if it's on a CDN
      // that hosts the worker alongside.
      // In a real build, you might need:
      // jsPDF.worker = 'path/to/jspdf.worker.js';
      console.log('Attempting to initialize jsPDF worker (if available).');
    }
  } catch (error) {
    console.warn('Could not initialize jsPDF worker:', error);
  }
}
