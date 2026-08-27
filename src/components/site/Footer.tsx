import { Link } from "@tanstack/react-router";

const logo = "/media/33191-removebg-preview.png";

export function Footer() {
  return (
    <>
      <footer className="bg-[#1a0d0d] text-cream/90">
        <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-4">
          <div>
            <img src={logo} alt="Retro Natural Products" className="h-32 w-auto bg-cream rounded-md p-2 mb-4 object-contain" />
<p className="text-gold font-display text-sm mt-3 tracking-wide">IN ANDHRA PRADESH AND TELANGANA</p>
          </div>
          <div>
            <h4 className="text-gold font-display text-lg mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-gold">Home</Link></li>
              <li><Link to="/shop" className="hover:text-gold">Shop</Link></li>
              <li><Link to="/about" className="hover:text-gold">About</Link></li>
              <li><Link to="/wholesale" className="hover:text-gold">Wholesale</Link></li>
              <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gold font-display text-lg mb-4">Policies</h4>
            <ul className="space-y-2 text-sm text-left">
              <li><Link to="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-gold">Terms & Conditions</Link></li>
              <li><Link to="/shipping" className="hover:text-gold">Shipping & Returns</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-gold font-display text-lg mb-4">Reach Us</h4>
            <ul className="space-y-2 text-sm text-cream/80">
              <li className="flex gap-2"><i className="fas fa-building text-gold mt-1" /> <span><strong className="text-cream">'RETRO' Natural Products</strong><br />Shop G9, H.no 19, Eeco Valley Apartments, opposite Jana Priya Nile valley, PJR Layout, MADHAVAPURI HILLS, Ameenpur, Hyderabad-500050</span></li>
              <li className="flex gap-2"><i className="fas fa-phone text-gold mt-1" /> +91 81212 73912</li>
              <li className="flex gap-2"><i className="fas fa-envelope text-gold mt-1" /> retronaturalproducts@gmail.com</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.instagram.com/retro.natural.products?igsi=MXhjdGljdDY1dmhuaw==" target="_blank" rel="noreferrer" className="h-9 w-9 grid place-items-center rounded-full border border-gold/40 hover:bg-gold hover:text-brand transition"><i className="fab fa-instagram" /></a>
              <a href="https://www.facebook.com/share/1GgA3znuLD/" target="_blank" rel="noreferrer" className="h-9 w-9 grid place-items-center rounded-full border border-gold/40 hover:bg-gold hover:text-brand transition"><i className="fab fa-facebook-f" /></a>
              <a href="https://wa.me/918121273912" target="_blank" rel="noreferrer" className="h-9 w-9 grid place-items-center rounded-full border border-gold/40 hover:bg-gold hover:text-brand transition"><i className="fab fa-whatsapp" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
          © {new Date().getFullYear()} Retro Natural Products. All rights reserved.
        </div>
      </footer>
    </>
  );
}
