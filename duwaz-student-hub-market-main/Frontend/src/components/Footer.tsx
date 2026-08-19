
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-duwaz-black text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Duwaz.</h3>
            <p className="mb-4 text-gray-300">
              Supporting student businesses and communities across South Africa.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-duwaz-light-brown transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-gray-300 hover:text-duwaz-light-brown transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/create-shop" className="text-gray-300 hover:text-duwaz-light-brown transition-colors">
                  Create Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-duwaz-light-brown transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-2">
              <li className="text-gray-300">
                Email: info@duwaz.co.za
              </li>
              <li className="text-gray-300">
                Phone: +27 12 345 6789
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 mt-6 text-sm text-gray-400 text-center">
          <p>&copy; {currentYear} Duwaz Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
