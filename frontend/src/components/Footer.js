import React from 'react';
import { FaEnvelope, FaPhone, FaFacebook, FaTwitter, FaLinkedin, FaTelegram, FaVk, FaOdnoklassniki, FaTiktok } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../index.css';

const Footer = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${className || ''}`}>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-logo">Газпром Карьера</h3>
            <p>Присоединяйтесь к нашей команде и стройте карьеру в ведущей энергетической компании.</p>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Навигация</h4>
            <ul className="footer-links">
              <li><Link to="/about">О компании</Link></li>
              <li><Link to="/contact">Контакты</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Связаться с нами</h4>
            <p>
              <FaEnvelope className="footer-icon" />{' '}
              <a href="mailto:shishaghoul@gmail.com" className="footer-contact-link">
                shishaghoul@gmail.com
              </a>
            </p>
            <p>
              <FaPhone className="footer-icon" />{' '}
              <a href="tel:+79282209343" className="footer-contact-link">
                +7 (928) 220-93-43
              </a>
            </p>
            <div className="footer-social">
              <a href="https://vk.com/kaelthaas" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaVk className="social-icon" />
              </a>
              <a href="https://t.me/kael_thaas" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaTelegram className="social-icon" />
              </a>
              <a href="https://ok.ru/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaOdnoklassniki className="social-icon" />
              </a>
              <a href="https://www.tiktok.com/@gazprom_777_" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaTiktok className="social-icon" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {currentYear} «Газпром Карьера». Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;