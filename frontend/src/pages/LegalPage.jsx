import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  AlertTriangle, 
  HelpCircle, 
  Truck, 
  FileText, 
  Compass, 
  BookOpen, 
  HeartHandshake, 
  ShieldAlert, 
  Users,
  Lock,
  FileCheck
} from 'lucide-react';

const LegalPage = () => {
  const { pathname } = useLocation();

  // Dynamic merchant information
  const legalName = "BL BATTLE";
  const udyamNumber = "UDYAM-AP-18-0065432";
  const registeredAddress = "Hussainapuram Street, Peapully Mandal, Kurnool District, Andhra Pradesh - 518221";
  const supportEmail = "bloodlinebattle7@gmail.com";
  const lastUpdated = "July 03, 2026";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const getContent = () => {
    switch (pathname) {
      case '/about':
        return {
          title: "About Us",
          icon: <Compass className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>Welcome to <strong>{legalName}</strong> (blbattle.in), a premium competitive esports platform designed for passionate mobile gamers in India.</p>
              <p>Our mission is to establish a secure, fair, and adrenaline-fueled environment where players of all skill levels can register for daily matches, showcase their strategies in Free Fire custom room lobbies, and claim cash rewards based entirely on their skill, performance, and match placement.</p>
              
              <h3 className="text-white font-bold text-base uppercase tracking-wider mt-4">Our Vision</h3>
              <p>We believe in elevating mobile esports from a casual hobby into an structured competition. By utilizing automated statistics recording, transparent rule enforcement, secure wallets, and structured prize distribution systems, we remove the friction usually associated with custom mobile tournaments.</p>

              <h3 className="text-white font-bold text-base uppercase tracking-wider mt-4">Corporate & Merchant Registry</h3>
              <div className="rounded-xl border border-gaming-border bg-gaming-card/45 p-6 space-y-3">
                <p><strong>Legal Entity Name:</strong> {legalName}</p>
                <p><strong>Udyam Registration Number:</strong> {udyamNumber}</p>
                <p><strong>Registered Operating Address:</strong> {registeredAddress}</p>
                <p><strong>Platform Status:</strong> Registered Skill-Based Competitive Gaming Agency</p>
              </div>
            </div>
          )
        };

      case '/terms':
        return {
          title: "Terms and Conditions",
          icon: <FileText className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
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
                <h3 className="text-white font-bold text-base uppercase tracking-wider">4. Tournament Credits Wallet</h3>
                <p>BL Battle uses a virtual wallet system (1 Credit = 1 INR). Tournament credits are deducted from your balance upon registering for a lobby. Once a lobby starts, entry fees are non-refundable unless the match is officially cancelled by the system or hosts.</p>
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
          lastUpdated,
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
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Wallet Deposits</h3>
                <p>All deposits made to purchase Tournament Credits are final and non-refundable once successfully processed by the payment gateway. You can use your credits to join tournaments and claim cash prizes.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Match Cancellations & Refunds</h3>
                <p>If a tournament or lobby is cancelled by the host, or if the host fails to publish Custom Room Credentials (ID & Password) within 15 minutes of the scheduled match time, all participants will receive a 100% automated refund of their entry fee back to their virtual wallet.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Withdrawals</h3>
                <p>Winnings and cash rewards earned from matches can be withdrawn directly to your bank account or UPI ID. The minimum withdrawal limit is **50 Credits** (equivalent to ₹50). Withdrawals are processed by the administrator within a few hours of submission after completing mandatory KYC verification.</p>
              </section>
            </div>
          )
        };

      case '/shipping':
        return {
          title: "Shipping & Delivery Policy",
          icon: <Truck className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Digital Delivery Only</h3>
                <p>BL Battle operates solely as an online gaming and tournament platform. We do not sell, ship, or deliver any physical products. Therefore, no physical shipping is required for any transaction on this platform.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Tournament Credits Delivery</h3>
                <p>Upon a successful transaction on the payment gateway, purchased Tournament Credits are credited instantly to your digital wallet on the platform. The processing is real-time, and you will see the updated balance immediately on your wallet dashboard.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Match Credentials Dispatch</h3>
                <p>Room credentials (Room ID and Password) for joined matches are delivered digitally to your registered email address and appear directly on the registered tournament details page 10-15 minutes prior to the scheduled match start time.</p>
              </section>
            </div>
          )
        };

      case '/responsible-gaming':
        return {
          title: "Responsible Gaming",
          icon: <HeartHandshake className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>Competitive esports should always remain a fun, positive, and skill-based activity. At <strong>{legalName}</strong>, we are committed to promoting responsible gaming and ensuring safety practices for all mobile competitors.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Play for Fun and Skill</h3>
                <p>Matches hosted on our platform are skill-based tournaments. Success depends on strategy, quick reflexes, and teamwork. There is no element of luck or chance. Winning matches is not guaranteed and requires active competitive play.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Age Restrictions</h3>
                <p>You must be at least **18 years of age** or have explicit parental consent to deposit funds, join cash-reward tournaments, or initiate withdrawals on BL Battle.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Spend and Time Limits</h3>
                <p>Set a personal budget for purchasing Tournament Credits and stick to it. Do not play under financial stress. If you feel you are spending too much time or money on competitive gaming, we encourage you to take breaks or contact support for temporary account limits.</p>
              </section>
            </div>
          )
        };

      case '/kyc-policy':
        return {
          title: "KYC Verification Policy",
          icon: <FileCheck className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>To prevent fraud, comply with payment gateway regulations, and protect payouts, <strong>{legalName}</strong> enforces a strict Know Your Customer (KYC) compliance standard.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Mandatory Verification</h3>
                <p>All users must complete KYC verification before they are eligible to initiate cash withdrawals from their wallet balance. KYC is not required for casual registration, but is required once a withdrawal request is requested.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Details Collected</h3>
                <p>To verify your identity, we collect your Legal Full Name (matching your ID), Date of Birth, PAN Card details (if applicable), and your UPI ID/Bank account coordinates. You may also be requested to upload a copy of your Aadhaar card or PAN for document verification.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Processing Times</h3>
                <p>Once submitted via your Account Settings panel, submissions are placed in a queue. Our administration logs review and approve/reject profiles within 12 to 24 hours.</p>
              </section>
            </div>
          )
        };

      case '/aml-policy':
        return {
          title: "Anti-Money Laundering (AML) Policy",
          icon: <Lock className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>At <strong>{legalName}</strong>, we maintain a zero-tolerance policy against money laundering, terrorist financing, and suspicious financial transactions.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Wallet and Deposit Routing</h3>
                <p>Deposited Tournament Credits can only be used to participate in competitive matches. Direct transfers between player accounts are not supported. Winnings can only be settled to verification-linked bank accounts or UPI handles matching the KYC profile name.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Fraud Prevention & Account Banning</h3>
                <p>We actively monitor match histories, IP logs, and withdrawal details. The detection of duplicate accounts, mock payment confirmations, chargeback manipulations, or suspicious payouts will lead to immediate account suspension, hardware bans, and reporting to relevant financial authorities.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">3. Payout Verification Audit Trails</h3>
                <p>All tournament prize allocations require manual host or admin verification. Audit logs containing transaction IDs, timestamp metrics, and administrator credentials are logged to protect financial operations.</p>
              </section>
            </div>
          )
        };

      case '/cookie-policy':
        return {
          title: "Cookie Policy",
          icon: <BookOpen className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>This Cookie Policy explains how BL Battle uses cookies and similar technologies to recognize you when you visit our website.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. What are Cookies?</h3>
                <p>Cookies are small data files stored on your computer or mobile device. They help us remember your active session token (JSON Web Token), display preferences, and save dashboard statistics so you do not have to log in repeatedly.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Managing Cookies</h3>
                <p>Most browsers accept cookies by default. You can change your browser settings to block or delete cookies at any time; however, blocking cookies will disable login and wallet authorization functionalities on our platform.</p>
              </section>
            </div>
          )
        };

      case '/community-guidelines':
        return {
          title: "Community Guidelines",
          icon: <Users className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>BL Battle is a competitive arena built on mutual respect and sportsmanship. We require all players to adhere to these community guidelines:</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Sportsmanship</h3>
                <p>Be respectful to other competitors, hosts, and chat administrators. Toxic comments, hate speech, cyberbullying, or harassment in tournament boards or match chats is strictly banned.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Match Room Integrity</h3>
                <p>Do not share custom room IDs or passwords with players who have not registered for the lobby. Teaming up with adversaries in solo matches, match-fixing, or deliberate self-eliminations is strictly forbidden.</p>
              </section>
            </div>
          )
        };

      case '/fair-play':
        return {
          title: "Fair Play Policy",
          icon: <ShieldAlert className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>Fair competition is the foundation of esports. At BL Battle, we utilize manual checks and observer logs to guarantee absolute fair play.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Prohibited Software</h3>
                <p>The usage of third-party programs, auto-aim scripts, modified APKs, ESP overlays, recoil-reduction macros, or emulator bypasses is strictly banned. Any user detected using such tools will be immediately barred and their hardware ID logged.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. Verification Logs</h3>
                <p>Observers are placed inside custom game lobbies to review game integrity. Winnings are subject to match logs inspection. If a winner is suspected of cheating, their prizes are frozen pending manual gameplay video review.</p>
              </section>
            </div>
          )
        };

      case '/disclaimer':
        return {
          title: "Skill-Based Gaming Disclaimer",
          icon: <HelpCircle className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p><strong>BL Battle</strong> (blbattle.in) hosts skill-based electronic sports tournaments exclusively. Under Indian law (specifically the Public Gambling Act, 1867), games of skill are legally protected and exempt from betting restrictions.</p>
              
              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">1. Game of Skill Definition</h3>
                <p>Free Fire matches depend on player strategy, reaction speed, weapon mastery, maps awareness, and team communication. These components constitute a game of skill, as victory is determined by training and mechanical performance, not chance.</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-white font-bold text-base uppercase tracking-wider">2. State Restrictions</h3>
                <p>Although games of skill are legal nationally, state laws in Andhra Pradesh, Assam, Odisha, Sikkim, Nagaland, Telangana, and Karnataka may restrict entry into paid tournaments. If you reside in one of these restricted states, you must not register for cash prize matches.</p>
              </section>
            </div>
          )
        };

      case '/contact':
      default:
        return {
          title: "Contact Us",
          icon: <Mail className="text-gaming-accent h-8 w-8" />,
          lastUpdated,
          body: (
            <div className="space-y-6 text-gaming-text">
              <p>For any inquiries, customer support, or billing concerns related to your transaction deposits and withdrawals, please reach out to our support administration:</p>
              
              <div className="mt-4 rounded-xl border border-gaming-border bg-gaming-card/45 p-6 space-y-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <Mail className="text-gaming-accent h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gaming-text">Support Email</p>
                    <p className="text-white font-semibold text-sm">{supportEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-gaming-accent h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gaming-text">Operating Support Hours</p>
                    <p className="text-white font-semibold text-sm">{supportEmail ? "10:00 AM - 10:00 PM IST (Monday - Sunday)" : ""}</p>
                  </div>
                </div>
                <div className="border-t border-gaming-border/60 pt-4 mt-2 space-y-2 text-xs">
                  <p><strong>Merchant Legal Entity:</strong> {legalName}</p>
                  <p><strong>Udyam Registration Number:</strong> {udyamNumber}</p>
                  <p><strong>Registered Address:</strong> {registeredAddress}</p>
                </div>
              </div>

              <p className="text-xs">We strive to respond to all emails and resolve ticket queries within **24 to 48 hours**.</p>
            </div>
          )
        };
    }
  };

  const { title, icon, lastUpdated: updateTime, body } = getContent();

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
            <p className="text-[10px] text-gaming-text uppercase font-semibold mt-1">Last Updated: {updateTime}</p>
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
          <span className="text-gaming-text/60">{legalName} Esports</span>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
