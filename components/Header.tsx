
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white bg-opacity-80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-center items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Gemini Fun Factory
        </h1>
      </div>
    </header>
  );
};

export default Header;
