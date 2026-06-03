import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  MessageSquare, X, Send, Volume2, VolumeX, 
  ChevronRight, Trophy, Wallet, Key, PhoneCall, HelpCircle, RefreshCw
} from 'lucide-react';

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Play Web Audio synth blip
  const playSynthSound = () => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.12);
    } catch (err) {
      console.warn("Failed to play synth sound:", err);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Load initial welcome message
  const initChat = () => {
    const gamerName = user?.freeFireName || user?.username || 'Gamer';
    const walletText = user ? ` (Current Balance: ${user.walletBalance || 0} Coins)` : '';
    
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: `Greetings, **${gamerName}**! 🎮\nWelcome to the **BL Battle** Arena Hub. I am your tactical support assistant.\n\nHow can I help you dominate today?${walletText}`,
        isIntro: true
      }
    ]);
  };

  useEffect(() => {
    initChat();
  }, [user]);

  // Response mapping based on queries or rules
  const rules = [
    {
      keywords: /(deposit|add money|payment|pay|cash|razorpay|upi)/i,
      title: "💳 Deposits & Wallet Options",
      response: `To deposit money into your account:
1. Navigate to the **Wallet** page.
2. Enter the amount of coins you want to purchase (1 Coin = 1 INR).
3. Click **Add Money** to trigger the secure **Razorpay Gateway**.
4. Complete payment using UPI, NetBanking, Credit/Debit cards. Your coins are credited instantly!`,
      navigation: { label: "Go to Wallet", path: "/wallet" }
    },
    {
      keywords: /(withdraw|payout|earnings|transfer|redeem|bank|paytm)/i,
      title: "💵 Withdraw Winnings",
      response: `To transfer your winnings to your bank account:
1. Navigate to the **Wallet** page.
2. Scroll to the **Withdraw Winnings** section.
3. Ensure you have at least **50 Coins** (minimum withdrawal limit).
4. Enter your UPI ID or Payment Details and the amount.
5. Submit the request. Admin verifies and processes payouts securely within a few hours!`,
      navigation: { label: "Go to Wallet", path: "/wallet" }
    },
    {
      keywords: /(room|id|password|credentials|how to join|join match)/i,
      title: "🔑 Room Credentials & Joining",
      response: `Here is the protocol to join your registered match:
1. Match Room ID and Password will be provided **10 to 15 minutes** before the scheduled start time.
2. Go to the registered tournament page. The details appear under the **Room Credentials** section.
3. Simultaneously, an automatic email notification will be dispatched containing the Room Credentials.
4. Copy the Room ID, open Free Fire, search for the Custom Room, and enter the password to join!`,
      navigation: { label: "Browse Tournaments", path: "/" }
    },
    {
      keywords: /(kill|per kill|rewards|point system|rules)/i,
      title: "🏆 Per-Kill Rewards & Rules",
      response: `For BR Ranked Tournaments on BL Battle, we use an advanced per-kill reward mechanism:
- Every kill you secure in the custom room grants you a specific coin reward (e.g. 5 Coins per kill).
- This is tracked automatically by our system upon match completion.
- Coin rewards are dispatched straight to your wallet. You don't need to win the match to earn coins!`,
      navigation: { label: "Check Ranks", path: "/leaderboard" }
    },
    {
      keywords: /(otp|verification|verify|not receiving|welcome mail|email)/i,
      title: "⚙️ Email & OTP Verification",
      response: `If you are having troubles receiving OTP verification or welcome emails:
1. Check your **Spam/Junk folder** in your email provider.
2. Verify that your entered email address is 100% correct in settings.
3. Our server uses official SMTP servers to deliver verified verification codes. If issues persist, try requesting another code or contact support.`,
      navigation: { label: "Profile Settings", path: "/settings" }
    },
    {
      keywords: /(support|contact|admin|help|whatsapp|phone|email)/i,
      title: "📞 Admin Support & Assistance",
      response: `Need a direct channel to our command center?
- **Email:** support@blbattle.in
- **Active Hours:** 10:00 AM - 10:00 PM IST
- **Resolutions:** Registration corrections, payment disputes, custom squad setups. Let us know and we'll resolve it instantly!`,
      navigation: null
    },
    {
      keywords: /(leaderboard|rankings|standing|top player)/i,
      title: "🥇 Leaderboards & Standings",
      response: `Want to see who is leading the arena?
- Navigate to the **Ranks** page to see the top-earning gamers.
- Total Earnings, Matches Played, and total Kills are calculated dynamically. Get to the top for ultimate bragging rights!`,
      navigation: { label: "View Leaderboard", path: "/leaderboard" }
    }
  ];

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    // Append User Message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    
    // Simulate Typing response delay
    setTimeout(() => {
      // Find Matching Rule
      let matchedRule = null;
      for (const rule of rules) {
        if (rule.keywords.test(text)) {
          matchedRule = rule;
          break;
        }
      }

      let botMsg = {};
      if (matchedRule) {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          title: matchedRule.title,
          text: matchedRule.response,
          navigation: matchedRule.navigation
        };
      } else {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: `Target not recognized! 📡 I couldn't match your query in my tactical database. Try one of the quick modules below or rephrase your question.`,
          showOptions: true
        };
      }

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      playSynthSound();
    }, 700);
  };

  const handleQuickOptionClick = (optionKey, optionLabel) => {
    // Show user choice in chat
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: optionLabel
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let matchedRule = null;
      
      switch (optionKey) {
        case 'tournaments':
          matchedRule = rules.find(r => r.keywords.test('room'));
          break;
        case 'wallet':
          matchedRule = rules.find(r => r.keywords.test('deposit'));
          break;
        case 'kills':
          matchedRule = rules.find(r => r.keywords.test('kill'));
          break;
        case 'otp':
          matchedRule = rules.find(r => r.keywords.test('otp'));
          break;
        case 'support':
          matchedRule = rules.find(r => r.keywords.test('support'));
          break;
        default:
          break;
      }

      let botMsg = {};
      if (matchedRule) {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          title: matchedRule.title,
          text: matchedRule.response,
          navigation: matchedRule.navigation
        };
      } else {
        botMsg = {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Tactical data error: option response not loaded. How else can I assist?",
          showOptions: true
        };
      }

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      playSynthSound();
    }, 600);
  };

  const handleReset = () => {
    initChat();
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          playSynthSound();
        }}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gaming-accent text-black shadow-neon transition-all hover:scale-110 hover:shadow-neon-hover duration-300"
        title="BL Battle Assistant"
        id="chatbot-fab"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-spin-once" />
        ) : (
          <MessageSquare className="h-6 w-6 animate-pulse" />
        )}
      </button>

      {/* Chat Window Box */}
      {isOpen && (
        <div 
          className="fixed bottom-40 right-4 left-4 md:left-auto md:bottom-24 md:right-6 z-50 flex h-[480px] w-auto md:w-96 flex-col rounded-2xl glass-panel border border-gaming-accent/20 shadow-card animate-fade-in-up duration-300 overflow-hidden"
          id="chatbot-window"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-gaming-border bg-gaming-dark/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <div className="absolute -inset-0.5 -z-10 animate-ping rounded-full bg-emerald-500/50" />
              </div>
              <div>
                <h4 className="font-gaming text-sm font-bold uppercase tracking-wider text-white glow-text-blue">
                  BL Battle Assistant
                </h4>
                <p className="text-[10px] text-gaming-text font-semibold uppercase">Tactical Support Bot</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset/Refresh */}
              <button 
                onClick={handleReset}
                className="text-gaming-text hover:text-white transition-colors"
                title="Reset Chat"
              >
                <RefreshCw size={14} />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gaming-text hover:text-white transition-colors"
                title={isMuted ? "Unmute Bot" : "Mute Bot"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  playSynthSound();
                }}
                className="text-gaming-text hover:text-white transition-colors ml-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm font-medium leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gaming-accent/10 text-gaming-accent border border-gaming-accent/30 rounded-tr-none'
                      : 'bg-gaming-card/85 text-white border border-gaming-border rounded-tl-none'
                  }`}
                >
                  {/* Message Title */}
                  {msg.title && (
                    <div className="mb-1 font-bold text-gaming-accent uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-gaming-border pb-1">
                      {msg.title}
                    </div>
                  )}
                  {/* Message Text with simple formatting */}
                  <div className="whitespace-pre-line text-gaming-light">
                    {msg.text.split('**').map((chunk, index) => 
                      index % 2 === 1 ? <strong key={index} className="text-white font-bold">{chunk}</strong> : chunk
                    )}
                  </div>

                  {/* Navigation Buttons inside bubbles */}
                  {msg.navigation && (
                    <button
                      onClick={() => {
                        navigate(msg.navigation.path);
                        setIsOpen(false);
                      }}
                      className="mt-3.5 flex w-full items-center justify-center gap-1 rounded-lg bg-gaming-accent py-1.5 text-xs font-bold text-black shadow-neon transition-all hover:shadow-neon-hover"
                    >
                      {msg.navigation.label} <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                {/* Show Initial suggestions / category buttons */}
                {msg.isIntro && (
                  <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                    <button
                      onClick={() => handleQuickOptionClick('tournaments', '🏆 Room & Match Info')}
                      className="flex items-center gap-2 rounded-xl border border-gaming-border bg-gaming-card p-2.5 text-left text-[11px] font-semibold text-gaming-text hover:border-gaming-accent hover:text-white transition-all hover:-translate-y-0.5 duration-200"
                    >
                      <Key size={14} className="text-gaming-accent" />
                      <span>Room & Matches</span>
                    </button>
                    <button
                      onClick={() => handleQuickOptionClick('wallet', '💳 Deposit Details')}
                      className="flex items-center gap-2 rounded-xl border border-gaming-border bg-gaming-card p-2.5 text-left text-[11px] font-semibold text-gaming-text hover:border-gaming-accent hover:text-white transition-all hover:-translate-y-0.5 duration-200"
                    >
                      <Wallet size={14} className="text-gaming-accent" />
                      <span>Deposits & UPI</span>
                    </button>
                    <button
                      onClick={() => handleQuickOptionClick('kills', '🎖️ Per-Kill Payouts')}
                      className="flex items-center gap-2 rounded-xl border border-gaming-border bg-gaming-card p-2.5 text-left text-[11px] font-semibold text-gaming-text hover:border-gaming-accent hover:text-white transition-all hover:-translate-y-0.5 duration-200"
                    >
                      <Trophy size={14} className="text-gaming-accent" />
                      <span>Kill Rewards</span>
                    </button>
                    <button
                      onClick={() => handleQuickOptionClick('otp', '✉️ OTP & Settings')}
                      className="flex items-center gap-2 rounded-xl border border-gaming-border bg-gaming-card p-2.5 text-left text-[11px] font-semibold text-gaming-text hover:border-gaming-accent hover:text-white transition-all hover:-translate-y-0.5 duration-200"
                    >
                      <HelpCircle size={14} className="text-gaming-accent" />
                      <span>OTP & Email</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Dynamic typing dots */}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-gaming-card/85 text-gaming-text border border-gaming-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gaming-accent [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gaming-accent [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gaming-accent" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Helper Tags / Chips just above Input bar */}
          <div className="px-4 py-1.5 border-t border-gaming-border bg-gaming-dark/40 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button 
              onClick={() => handleSendMessage("How do I deposit money?")}
              className="px-2.5 py-1 rounded-full border border-gaming-border bg-gaming-card/50 text-[10px] text-gaming-text hover:border-gaming-accent hover:text-white transition-all"
            >
              Add Money
            </button>
            <button 
              onClick={() => handleSendMessage("How to withdraw winnings?")}
              className="px-2.5 py-1 rounded-full border border-gaming-border bg-gaming-card/50 text-[10px] text-gaming-text hover:border-gaming-accent hover:text-white transition-all"
            >
              Withdraw
            </button>
            <button 
              onClick={() => handleSendMessage("Where is custom room credentials?")}
              className="px-2.5 py-1 rounded-full border border-gaming-border bg-gaming-card/50 text-[10px] text-gaming-text hover:border-gaming-accent hover:text-white transition-all"
            >
              Room ID/Password
            </button>
            <button 
              onClick={() => handleSendMessage("Not receiving welcome email or OTP code")}
              className="px-2.5 py-1 rounded-full border border-gaming-border bg-gaming-card/50 text-[10px] text-gaming-text hover:border-gaming-accent hover:text-white transition-all"
            >
              No OTP
            </button>
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 border-t border-gaming-border bg-gaming-dark/80 px-4 py-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything tactical..."
              className="flex-grow rounded-xl border border-gaming-border bg-gaming-card px-3 py-2 text-xs md:text-sm text-white placeholder-gaming-text/60 focus:border-gaming-accent focus:outline-none focus:ring-0"
              id="chatbot-input"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gaming-accent text-black transition-all hover:scale-105 active:scale-95 shadow-neon"
              id="chatbot-send-btn"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
