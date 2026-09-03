import React from "react";
import backgroundImage from "../assets/background.jpeg";

const AppBackground = ({ children }) => {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      {children}
    </div>
  );
};

export default AppBackground;
