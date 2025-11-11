
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white bg-opacity-80 backdrop-blur-md shadow-sm p-4 mt-8">
      <div className="max-w-4xl mx-auto text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Gemini Fun Factory. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
