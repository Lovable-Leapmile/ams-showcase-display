import React from 'react';
import amsLogo from '@/assets/ams-logo.png';
import appLinkImage from '@/assets/applink.png';

const NoTraysScreen: React.FC = () => {
  return (
    <div 
      className="h-screen flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: '#E5F0F0' }}
    >
      {/* AMS Logo */}
      <div className="mb-8 xl:mb-12">
        <img 
          src={amsLogo} 
          alt="AMS Logo" 
          className="max-w-sm xl:max-w-md max-h-64 xl:max-h-80 object-contain transition-transform duration-300 hover:scale-105" 
        />
      </div>
      
      {/* Message */}
      <div className="text-center text-gray-700 mb-8 xl:mb-12">
        <p className="text-xl xl:text-2xl font-medium mb-4">
          No trays are in Stations
        </p>
        <p className="text-lg xl:text-xl text-gray-600">
          Retrieve Tray from App
        </p>
      </div>
      
      {/* Enhanced QR Code for 4K Displays */}
      <div className="relative">
        <div className="bg-white p-6 xl:p-8 rounded-2xl shadow-lg border-2 border-gray-200 hover:border-teal-300 transition-colors duration-300">
          <img 
            src={appLinkImage} 
            alt="App Link QR Code" 
            className="w-48 h-48 xl:w-72 xl:h-72 2xl:w-96 2xl:h-96 object-contain mx-auto"
          />
        </div>
        
        {/* QR Code Label */}
        <div className="text-center mt-4 xl:mt-6">
          <p className="text-sm xl:text-base text-gray-600 font-medium">
            Scan to access AMS App
          </p>
        </div>
      </div>
      
      {/* Subtle animation indicator */}
      <div className="mt-8 xl:mt-12 flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 xl:w-3 xl:h-3 bg-teal-400 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default NoTraysScreen;