import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Mail, AlertTriangle, HelpCircle, Truck, FileText } from 'lucide-react';

const LegalPage = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const getContent = () => {
    switch (pathname) {
      case '/terms':
        return {
          title: "Terms and Conditions",
          icon: <FileText className="text-gaming-accent h-8 w-8" />,
          lastUpdated: "June 30, 2026",
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Agreement to Terms</h3>
                <p>Welcome to BL Battle (blbattle.in). By accessing or using our platform, registering accounts, participating in Free Fire custom room tournaments, or using our virtual wallet services, you agree to be bound by these Terms and Conditions.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Account Registration</h3>
                <p>To register and participate, you must provide your true details, including a valid Email address, your Free Fire Unique UID, and your Free Fire In-Game Name (IGN). You are solely responsible for the safety of your password and credentials.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Fair Play and Anti-Cheat Policy</h3>
                <p>We enforce a strict zero-tolerance policy against cheating. The use of hacks, scripts, modified game files, or third-party tools that offer an unfair advantage will lead to immediate account suspension, hardware UID bans, and the complete forfeiture of all virtual coins in your wallet.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">4. Virtual Wallet & Entry Fees</h3>
                <p>BL Battle uses a virtual wallet coin system (1 Coin = 1 INR). Entry fees are deducted from your balance upon registering for a lobby. Once a lobby starts, entry fees are non-refundable unless the match is officially cancelled by the system or hosts.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">5. Limitation of Liability</h3>
                <p>BL Battle is an independent gaming hub and is not affiliated, associated, or endorsed by Garena Free Fire. We are not responsible for in-game client bugs, server connectivity issues, or game-client crashes.</p>
              </section>
            </div>
          )
        };

      case '/privacy':
        return {
          title: "Privacy Policy",
          icon: <ShieldCheck className="text-gaming-accent h-8 w-8" />,
          lastUpdated: "June 30, 2026",
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Information We Collect</h3>
                <p>We collect details you directly input during registration or profile updates, specifically your username, email address, password hash, Free Fire UID, and In-Game Name. Transaction records of payments made via payment gateways are also saved securely for audits.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. How We Use Information</h3>
                <p>Your details are used solely to run your account, verify game room entries, process deposits and payouts, and dispatch transaction or room notifications via email.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Data Security</h3>
                <p>Your account passwords are cryptographically salted and hashed using bcrypt. Access to your transaction data is protected by secure backend JSON Web Token validation. We do not sell or trade user information with third-party marketing brokers.</p>
              </section>
            </div>
          )
        };

      case '/refunds':
        return {
          title: "Refund & Cancellation Policy",
          icon: <AlertTriangle className="text-gaming-accent h-8 w-8" />,
          lastUpdated: "June 30, 2026",
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Wallet Deposits</h3>
                <p>All deposits made to the wallet are final and non-refundable once successfully processed by the payment gateway (Instamojo). You can use your coins to join tournaments and claim cash prizes.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Match Cancellations & Refunds</h3>
                <p>If a tournament or lobby is cancelled by the host, or if the host fails to publish Custom Room Credentials (ID & Password) within 15 minutes of the scheduled match time, all participants will receive a 100% automated refund of their entry fee back to their virtual wallet.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Withdrawals</h3>
                <p>Winnings and cash rewards earned from matches can be withdrawn directly to your bank account or UPI ID. The minimum withdrawal limit is **50 Coins** (equivalent to ₹50). Withdrawals are processed by the administrator within a few hours of submission.</p>
              </section>
            </div>
          )
        };

      case '/shipping':
        return {
          title: "Shipping & Delivery Policy",
          icon: <Truck className="text-gaming-accent h-8 w-8" />,
          lastUpdated: "June 30, 2026",
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Digital Delivery Only</h3>
                <p>BL Battle operates solely as an online gaming and tournament platform. We do not sell, ship, or deliver any physical products. Therefore, no physical shipping is required for any transaction on this platform.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Instamojo Coins Delivery</h3>
                <p>Upon a successful transaction on Instamojo, purchased coins are credited instantly to your digital wallet on the platform. The processing is real-time, and you will see the updated balance immediately on your **Wallet** dashboard.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Match Credentials Dispatch</h3>
                <p>Room credentials (Room ID and Password) for joined matches are delivered digitally to your registered email address and appear directly on the registered tournament details page 10-15 minutes prior to the scheduled match start time.</p>
              </section>
            </div>
          )
        };

      case '/contact':
      default:
        return {
          title: "Contact Us",
          icon: <Mail className="text-gaming-accent h-8 w-8" />,
          lastUpdated: "June 30, 2026",
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>For any inquiries, customer support, or billing concerns related to your transaction deposits and withdrawals, please reach out to our admin command center:</p>
              
              <div className="mt-4 rounded-xl border border-gaming-border bg-gaming-card/45 p-6 space-y-4 max-w-lg">
                <div className="flex items-center gap-3">
                  <Mail className="text-gaming-accent h-5 w-5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gaming-text">Support Email</p>
                    <p className="text-white font-semibold text-sm">bloodlinebattle7@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-gaming-accent h-5 w-5" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gaming-text">Operating Hours</p>
                    <p className="text-white font-semibold text-sm">10:00 AM - 10:00 PM IST (Monday - Sunday)</p>
                  </div>
                </div>
              </div>

              <p className="text-xs">We strive to respond to all emails and resolve ticket queries within **24 to 48 hours**.</p>
            </div>
          )
        };
    }
  };

  const { title, icon, lastUpdated, body } = getContent();

  return (
    <div className="min-h-screen bg-gaming-dark py-12 px-4 md:px-8">
      <div className="mx-auto max-w-4xl glass-panel border border-gaming-border rounded-2xl p-6 md:p-10 shadow-card animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-gaming-border pb-6 mb-8">
          <div className="p-3 rounded-xl bg-gaming-accent/10 border border-gaming-accent/20">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-wider glow-text-blue font-gaming">
              {title}
            </h1>
            <p className="text-[10px] text-gaming-text uppercase font-semibold mt-1">Last Updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm md:text-base leading-relaxed space-y-6">
          {body}
        </div>

        {/* Footer Back Button */}
        <div className="mt-10 border-t border-gaming-border pt-6 flex justify-between items-center text-xs">
          <Link to="/" className="text-gaming-accent hover:underline font-semibold">
            &larr; Back to Arena
          </Link>
          <span className="text-gaming-text/60">BL Battle Esports</span>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
