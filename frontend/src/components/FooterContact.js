import React from 'react';
import { FaEnvelope, FaPhone, FaFax, FaMapMarkerAlt } from 'react-icons/fa';
import '../index.css';

const FooterContact = () => {
  return (
    <div className="container">
      <div className="card">
        <h1 className="mb-4">Контактная информация</h1>
        <div className="row">
          <div className="col-12 mb-4">
            <p className="contact-item">
              <FaMapMarkerAlt className="footer-icon" /> <strong>Юридический адрес:</strong><br />
              196143, г. Санкт-Петербург, вн.тер.г. муниципальный округ Звездное, пл. Победы, д. 2, литера А, помещ.
              1-Н, кабинет 422
            </p>
            <p className="contact-item">
              <FaMapMarkerAlt className="footer-icon" /> <strong>Адрес для корреспонденции:</strong><br />
              117447, г. Москва, ул. Большая Черемушкинская, д. 13, стр. 3
            </p>
            <p className="contact-item">
              <FaPhone className="footer-icon" /> <strong>Телефон:</strong><br />
              <span className="contact-text">(499) 580-10-00; (812) 455-03-00</span>
            </p>
            <p className="contact-item">
              <FaFax className="footer-icon" /> <strong>Факс:</strong><br />
              <span className="contact-text">(499) 580-10-22; (812) 455-04-00</span>
            </p>
            <p className="contact-item">
              <FaEnvelope className="footer-icon" /> <strong>Электронная почта:</strong><br />
              <span className="contact-text">gazprominform@inform.gazprom.ru</span>
            </p>
            <p className="contact-item">
              <FaEnvelope className="footer-icon" /> <strong>Электронная почта пресс-службы:</strong><br />
              <span className="contact-text">news@inform.gazprom.ru</span>
            </p>
          </div>
          <div className="col-12 mb-4">
            <div className="yandex-map-container">
              <a
                href="https://yandex.ru/maps/org/ooo_gazprom_yediny_raschetny_tsentr/155786863645/?utm_medium=mapframe&utm_source=maps"
                className="yandex-map-link"
                style={{ top: '0px' }}
              >
              </a>
              <a
                href="https://yandex.ru/maps/2/saint-petersburg/category/oil_and_gas_company/184106690/?utm_medium=mapframe&utm_source=maps"
                className="yandex-map-link"
                style={{ top: '20px' }}
              >
              </a>
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=30.325367%2C59.843470&mode=poi&poi%5Bpoint%5D=30.325257%2C59.843215&poi%5Buri%5D=ymapsbm1%3A%2F%2Forg%3Foid%3D155786863645&z=17.97"
                width="100%"
                height="400"
                frameBorder="1"
                allowFullScreen
                style={{ position: 'relative' }}
                title="Яндекс Карта: Санкт-Петербург, пл. Победы, д. 2"
              ></iframe>
            </div>
          </div>
          <div className="col-12">
            <p>
              <strong>Полное фирменное наименование:</strong><br />
              Общество с ограниченной ответственностью «Газпром информ»
            </p>
            <p>
              <strong>Сокращенное фирменное наименование:</strong><br />
              ООО «Газпром информ»
            </p>
            <h4>Регистрационная информация:</h4>
            <p>
              <strong>ОГРН:</strong> 1097746469303<br />
              <strong>ИНН:</strong> 7727696104
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterContact;