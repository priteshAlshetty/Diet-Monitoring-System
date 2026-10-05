import { Leaf } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <span className="footer__brand"><Leaf size={18} /> MyDiet</span>
      <span>DMS Diet Monitoring System</span>
      <span>© {new Date().getFullYear()} MyDiet. All rights reserved.</span>
    </footer>
  );
}
