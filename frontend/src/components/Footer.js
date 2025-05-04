import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Gazprom Careers. All rights reserved.</p>
        <p>Contact us: <a href="mailto:careers@gazprom.com" className="text-white">careers@gazprom.com</a></p>
      </div>
    </footer>
  );
};

export default Footer;