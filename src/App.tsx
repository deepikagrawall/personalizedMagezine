import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QrCode, 
  ShieldCheck, 
  User, 
  ArrowLeft, 
  Info, 
  CheckCircle2, 
  Download, 
  Heart,
  ChevronRight,
  CreditCard,
  History,
  LayoutGrid,
  Settings,
  LogOut,
  Save,
  Trash2,
  Plus,
  Loader2,
  FileText,
  Upload,
  Eye,
  FileUp,
  AlertCircle,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// ═══════════════════════════════════════════════════════════
// FIREBASE HUB
// ═══════════════════════════════════════════════════════════

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const googleProvider = new GoogleAuthProvider();

// Connection Test as per instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'configs', 'main'));
    console.log("Firebase connection established.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase is offline. Check your configuration.");
    }
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS & TYPES
// ═══════════════════════════════════════════════════════════

enum AppState {
  HOME,
  SCANNER,
  PROCESSING,
  SUCCESS,
  UNLOCKED,
  ADMIN
}

interface AppConfig {
  recipientName: string;
  homeHeading: string;
  birthdaySurpriseTitle: string;
  birthdaySurpriseSub: string;
  unlockedHeading: string;
  unlockedSubHeading: string;
  unlockedMessage: string;
  pdfUrl: string;
  unlockCode: string;
  lastUpdated?: any;
}

const DEFAULT_CONFIG: AppConfig = {
  recipientName: "Legendary User",
  homeHeading: "Secure Birthday Reveal Pending.",
  birthdaySurpriseTitle: "Birthday Surprise",
  birthdaySurpriseSub: "Verification required",
  unlockedHeading: "Happy Birthday!",
  unlockedSubHeading: "A Token of Gratitude.",
  unlockedMessage: `Dearest Friend,\n\nThis special reveal marks a moment of pure celebration. You are a certified legend in our book. Thank you for all the incredible memories!`,
  pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  unlockCode: "BD-LGND-26"
};

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

const StatusBar = () => (
  <div className="flex justify-between items-center px-4 py-1.5 bg-white sticky top-0 z-[100] border-b border-soft-gray">
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      <span className="text-[9px] font-bold">12:45</span>
    </div>
    <div className="flex gap-1 items-center">
      <div className="w-3 h-1.5 bg-slate-300 rounded-[0.5px]" />
      <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
    </div>
  </div>
);

const BottomNav = () => (
  <div className="fixed bottom-0 left-0 w-full bg-white border-t border-soft-gray px-6 py-2 flex justify-between items-center z-[100]">
    <div className="flex flex-col items-center gap-0.5 opacity-40">
      <LayoutGrid size={16} />
      <span className="text-[8px] font-medium font-sans">Home</span>
    </div>
    <div className="flex flex-col items-center gap-0.5 text-paytm-blue">
      <QrCode size={16} />
      <span className="text-[8px] font-bold font-sans">Scanner</span>
    </div>
    <div className="flex flex-col items-center gap-0.5 opacity-40">
      <History size={16} />
      <span className="text-[8px] font-medium font-sans">History</span>
    </div>
  </div>
);

const FintechCard = ({ children, className = "", onClick = undefined }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl card-shadow border border-soft-gray overflow-hidden ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
  >
    {children}
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN SECTIONS
// ═══════════════════════════════════════════════════════════

const HomeScreen = ({ onStartScan, onAdmin, config, ...props }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full bg-soft-gray flex flex-col overflow-hidden"
  >
    <div className="bg-paytm-dark pt-6 pb-10 px-6 shrink-0">
      <div className="flex justify-between items-center text-white mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
            <User size={20} />
          </div>
          <div>
            <p className="text-[9px] opacity-60 uppercase tracking-widest font-black leading-none">Security Portal</p>
            <h1 className="text-sm font-black mt-1 leading-tight">{config.recipientName}</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onAdmin} className="p-2 -m-2 text-white/20 hover:text-white transition-colors" title="Admin Settings">
            <Settings size={20} />
          </button>
          <ShieldCheck size={22} className="text-paytm-blue" />
        </div>
      </div>

      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-white space-y-2"
      >
        <span className="text-[8px] bg-paytm-blue/30 text-paytm-blue px-3 py-1 rounded-full font-black tracking-widest">ECO-ENCRYPTED V4</span>
        <h2 className="text-xl font-black leading-tight tracking-tight whitespace-pre-line">{config.homeHeading}</h2>
      </motion.div>
    </div>

    <div className="px-5 -mt-6 space-y-4 flex-1 pb-10 overflow-y-auto no-scrollbar">
      <FintechCard className="p-5 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-paytm-light flex items-center justify-center text-2xl shadow-inner">
               🎁
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm leading-tight uppercase tracking-tight">{config.birthdaySurpriseTitle}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{config.birthdaySurpriseSub}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-none">Status</p>
            <p className="text-xs font-black text-paytm-blue mt-1 leading-none">LOCKED</p>
          </div>
        </div>

        <button 
          onClick={onStartScan}
          className="w-full py-4 bg-paytm-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-opacity-95 transition-all active:scale-[0.97] shadow-xl shadow-paytm-blue/30"
        >
          <QrCode size={16} />
          Authenticate Reveal
        </button>
        <div className="mt-4 flex items-center justify-center gap-2 text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none">
          <ShieldCheck size={10} className="text-paytm-blue" />
          End-to-End Secure
        </div>
      </FintechCard>

      <div className="grid grid-cols-2 gap-3">
        <FintechCard className="p-4 flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-soft-gray flex items-center justify-center text-paytm-blue">
            <CreditCard size={14} />
          </div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pin Required</span>
        </FintechCard>
        <FintechCard className="p-4 flex flex-col items-center gap-2">
           <div className="w-8 h-8 rounded-full bg-soft-gray flex items-center justify-center text-paytm-blue">
            <Info size={14} />
          </div>
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Guidelines</span>
        </FintechCard>
      </div>

      <div className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl">
        <div className="flex items-center gap-2 mb-1.5">
           <div className="w-1 h-3 bg-paytm-blue rounded-full" />
           <span className="text-[8px] font-bold text-slate-800 uppercase tracking-tight">Security Alert</span>
        </div>
        <p className="text-[8px] text-slate-400 leading-normal">
          The reveal is intended for the recipient only. Ensure you are in a private area before scanning.
        </p>
      </div>
    </div>
  </motion.div>
);

const ScannerScreen = ({ onScanSuccess, onBack, ...props }) => {
  const [isDetected, setIsDetected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDetected(true);
      setTimeout(onScanSuccess, 1200);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onScanSuccess]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 bg-black z-50 flex flex-col h-full overflow-hidden"
    >
      <div className="absolute top-6 left-4 z-[60] flex items-center gap-2 text-white">
        <button onClick={onBack} className="p-1 bg-white/10 rounded-full">
          <ArrowLeft size={14} />
        </button>
        <span className="font-bold text-[10px] uppercase tracking-widest">Scanner</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: isDetected ? [1, 1.05, 1] : [1, 1.02, 1],
              opacity: isDetected ? 0.6 : 0.3
            }}
            transition={{ duration: isDetected ? 0.4 : 4, repeat: isDetected ? 0 : Infinity }}
            className="w-full h-full bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center"
          />
        </div>

        <div className="relative z-10 w-56 h-56 border border-white/20 rounded-[1.5rem] flex items-center justify-center overflow-hidden">
          <motion.div 
            animate={{ 
              opacity: isDetected ? [0.2, 1, 0.2] : 1,
              backgroundColor: isDetected ? 'rgba(0, 186, 242, 0.2)' : 'transparent'
            }}
            className="scanner-line z-20" 
          />
          
          <div className="qr-corner top-2.5 left-2.5 border-t-2 border-l-2 rounded-tl-[0.8rem]" />
          <div className="qr-corner top-2.5 right-2.5 border-t-2 border-r-2 rounded-tr-[0.8rem]" />
          <div className="qr-corner bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl-[0.8rem]" />
          <div className="qr-corner bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br-[0.8rem]" />

          <div className="w-32 h-32 bg-white/5 backdrop-blur-sm rounded-xl flex items-center justify-center relative">
            <motion.div 
              animate={{ 
                scale: isDetected ? 1.2 : 1,
                color: isDetected ? '#00BAF2' : 'rgba(255,255,255,0.2)'
              }}
              className="transition-colors duration-300"
            >
              <QrCode size={40} />
            </motion.div>
            
            {isDetected && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 bg-paytm-blue/20 flex items-center justify-center rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-paytm-blue flex items-center justify-center text-white">
                  <CheckCircle2 size={16} />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="absolute bottom-12 w-full text-center px-8">
          <p className="text-white/80 text-[10px] font-medium leading-tight">
            {isDetected ? 'Identity verified. Processing...' : 'Align QR within frame to verify access.'}
          </p>
        </div>
      </div>

      <div className="bg-black/80 backdrop-blur-md py-4 flex justify-around items-center px-4 border-t border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
          <ShieldCheck size={16} />
        </div>
        <div className="w-12 h-12 rounded-full bg-paytm-blue flex items-center justify-center text-white shadow-[0_0_10px_#00BAF2]">
          <QrCode size={24} />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
          <History size={16} />
        </div>
      </div>
    </motion.div>
  );
};

const ProcessingScreen = ({ config, ...props }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center"
  >
    <div className="relative mb-6">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-2 border-soft-gray border-t-paytm-blue rounded-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <ShieldCheck size={24} className="text-paytm-blue" />
      </div>
    </div>
    
    <div className="space-y-2">
      <h2 className="text-xl font-black text-paytm-dark uppercase tracking-tight">Identifying Target...</h2>
      <p className="text-paytm-blue font-black text-xs uppercase tracking-[0.3em] mt-2">{config.recipientName}</p>
      <p className="text-slate-400 text-[9px] max-w-[240px] mt-4 font-medium">Authenticating secure reveal protocol through biometric encryption.</p>
    </div>

    <div className="mt-8 w-full max-w-[200px] space-y-1.5">
      <div className="flex justify-between items-center py-1.5 border-b border-soft-gray">
        <span className="text-[8px] text-slate-500">Security</span>
        <span className="text-[8px] font-bold text-slate-800 uppercase tracking-tighter">Verified</span>
      </div>
    </div>
  </motion.div>
);

const SuccessScreen = ({ onComplete, config, ...props }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[110] bg-upi-green flex flex-col items-center justify-center p-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
      >
        <CheckCircle2 size={40} className="text-upi-green" />
      </motion.div>

      <div className="space-y-2 text-white">
        <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Access Granted</h2>
        <p className="text-white font-black text-xs uppercase tracking-[0.2em] pt-2">{config.recipientName} Confirmed</p>
        <p className="text-white/30 font-bold text-[9px] mt-6 tracking-widest uppercase">Protocol: SURPRISE_V1_INITIATED</p>
      </div>

      <div className="mt-6 w-full max-w-[240px] bg-black/10 rounded-lg p-3 border border-white/10">
        <div className="flex justify-between items-center">
           <span className="text-white/60 text-[8px] uppercase">Payload</span>
           <span className="text-white font-bold text-[10px] tracking-tighter">LEGENDARY SURPRISE</span>
        </div>
      </div>
    </motion.div>
  );
};

const UnlockedScreen = ({ config, ...props }) => {
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00BAF2', '#002E6E', '#FFFFFF']
    });
  }, []);

  const handleOpenPdf = () => {
    if (config.pdfUrl) {
      window.open(config.pdfUrl, '_blank');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-paytm-dark flex flex-col h-full overflow-hidden"
    >
      <div className="pt-4 pb-2 px-5 shrink-0 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-paytm-blue" />
          <div className="flex flex-col">
            <h3 className="text-white text-xs font-black italic font-serif leading-none tracking-tight">{config.recipientName}: {config.unlockedHeading}</h3>
            <p className="text-white/40 text-[10px] font-serif italic mt-0.5">{config.unlockedSubHeading}</p>
          </div>
        </div>
        
        <div className="bg-paytm-blue/10 border border-paytm-blue/20 px-3 py-1 rounded-lg flex flex-col items-center">
          <span className="text-[6px] font-black text-paytm-blue uppercase tracking-widest mb-0.5">Key</span>
          <span className="font-mono text-[11px] font-black text-white leading-none">{config.unlockCode}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-slate-900 border-b border-white/5 relative"
        >
          {config.pdfUrl ? (
            <iframe 
              src={config.pdfUrl} 
              className="w-full h-full border-none"
              title="PDF Content"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 p-8 text-center italic">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest">No Content Found</p>
            </div>
          )}
        </motion.div>
      </div>

      <div className="px-4 py-2 shrink-0 flex items-center justify-between bg-black/60 backdrop-blur-xl">
         <button 
           onClick={handleOpenPdf}
           className="text-[9px] font-black text-white/50 hover:text-white uppercase tracking-[0.1em] transition-colors"
         >
           Full Resolution Reveal
         </button>
         <div className="flex gap-6">
            <button onClick={() => window.print()} className="text-[9px] font-black text-white/70 uppercase tracking-widest flex items-center gap-2">
               <History size={12} /> Print
            </button>
            <button onClick={handleOpenPdf} className="text-[9px] font-black text-paytm-blue uppercase tracking-widest flex items-center gap-2">
               <Download size={12} /> Archive
            </button>
         </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ config, onSave, onBack, user, ...props }) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(config.pdfUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError("Please upload a valid PDF file.");
      return;
    }

    if (file.size > 1000 * 1024) { // Firestore limit is 1MB
      setUploadError("File is too large for the database (Max 1MB). Please use the 'Manual Asset URL' below for larger PDFs.");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData({ ...formData, pdfUrl: base64 });
      setPdfPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  if (previewMode) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
        <div className="bg-paytm-blue p-3 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Active Preview</span>
          </div>
          <button 
            onClick={() => setPreviewMode(false)}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[9px] font-black uppercase transition-colors"
          >
            Close Viewer
          </button>
        </div>
        <div className="flex-1 relative overflow-hidden bg-slate-100 p-4 lg:p-8">
          <div className="mx-auto max-w-[400px] h-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[40px] border-[12px] border-slate-900 overflow-hidden bg-white relative">
             <HomeScreen config={formData} onStartScan={() => {}} onAdmin={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-0 z-[200] bg-slate-50 flex flex-col overflow-hidden text-slate-800"
    >
      <div className="bg-paytm-dark p-4 flex items-center justify-between text-white shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-black text-xs uppercase tracking-wider">Experience Builder</h2>
            <p className="text-[9px] text-white/40 font-bold uppercase">Personalize your reveal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setPreviewMode(true)}
            className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-95"
            title="Live Preview"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => signOut(auth)} 
            className="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 no-scrollbar">
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-paytm-blue to-blue-600 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
           </div>
           <div>
              <p className="text-sm font-black text-slate-900 leading-none mb-1">{user?.displayName || 'Creative Director'}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{user?.email}</p>
              </div>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black uppercase text-paytm-blue tracking-[0.2em]">01. Welcome Screen</h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Recipient Name</label>
              <input 
                type="text"
                value={formData.recipientName || ''}
                onChange={e => setFormData({...formData, recipientName: e.target.value})}
                placeholder="Target Identity Name"
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-paytm-blue outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-paytm-blue/5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Greeting Text</label>
              <textarea 
                value={formData.homeHeading || ''}
                onChange={e => setFormData({...formData, homeHeading: e.target.value})}
                placeholder="What should it say at first?"
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-paytm-blue outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-paytm-blue/5"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Card Header</label>
                <input 
                  type="text"
                  value={formData.birthdaySurpriseTitle || ''}
                  onChange={e => setFormData({...formData, birthdaySurpriseTitle: e.target.value})}
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-paytm-blue transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Card Subtext</label>
                <input 
                  type="text"
                  value={formData.birthdaySurpriseSub || ''}
                  onChange={e => setFormData({...formData, birthdaySurpriseSub: e.target.value})}
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-paytm-blue transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black uppercase text-paytm-blue tracking-[0.2em]">02. The Reveal</h3>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Success Title</label>
              <input 
                type="text"
                value={formData.unlockedHeading || ''}
                onChange={e => setFormData({...formData, unlockedHeading: e.target.value})}
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-paytm-blue transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Document Title</label>
              <input 
                type="text"
                value={formData.unlockedSubHeading || ''}
                onChange={e => setFormData({...formData, unlockedSubHeading: e.target.value})}
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-paytm-blue transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Manifesto / Letter</label>
              <textarea 
                value={formData.unlockedMessage || ''}
                onChange={e => setFormData({...formData, unlockedMessage: e.target.value})}
                placeholder="The core surprise content..."
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-paytm-blue outline-none transition-all shadow-sm"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reveal Document (PDF)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${pdfPreviewUrl ? 'border-paytm-blue bg-paytm-blue/5' : 'border-slate-200 bg-white hover:border-paytm-blue hover:bg-slate-50'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/pdf"
                    className="hidden" 
                  />
                  {pdfPreviewUrl ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-paytm-blue/20 flex items-center justify-center text-paytm-blue">
                        <FileText size={24} />
                      </div>
                      <p className="text-[10px] font-black text-paytm-blue uppercase tracking-widest">Document Armed</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPdfPreviewUrl(null);
                          setFormData({...formData, pdfUrl: ''});
                        }}
                        className="absolute top-3 right-3 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileUp size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Drop or Click</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 leading-none">PDF Document (Max 1MB)</p>
                      </div>
                    </>
                  )}
                </div>
                {uploadError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded-lg border border-red-100 mt-2"
                  >
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold">{uploadError}</span>
                  </motion.div>
                )}
              </div>

              {pdfPreviewUrl && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Live Preview</label>
                  <div className="h-40 border-2 border-slate-100 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg group relative">
                    <iframe 
                      src={pdfPreviewUrl} 
                      className="w-full h-full pointer-events-none scale-[0.5] origin-top opacity-60" 
                      title="PDF Preview"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                      <button 
                         type="button"
                         onClick={() => window.open(pdfPreviewUrl, '_blank')}
                         className="flex items-center gap-2 px-4 py-2 bg-white text-paytm-dark rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                      >
                        <Eye size={14} /> View Full
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Manual Asset URL (Optional)</label>
                <div className="relative">
                   <input 
                    type="url"
                    value={(formData.pdfUrl?.startsWith('data:') ? '' : formData.pdfUrl) || ''}
                    onChange={e => setFormData({...formData, pdfUrl: e.target.value})}
                    placeholder="https://example.com/file.pdf"
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold outline-none focus:border-paytm-blue pr-12 transition-all"
                  />
                  <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-paytm-blue/30" size={18} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Secret Keycode</label>
                <input 
                  type="text"
                  value={formData.unlockCode || ''}
                  onChange={e => setFormData({...formData, unlockCode: e.target.value})}
                  className="w-full p-4 bg-paytm-dark text-white rounded-2xl text-sm font-black outline-none focus:ring-4 focus:ring-paytm-blue/20 transition-all font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Public Reveal Direct Link</label>
              <div className="p-4 bg-paytm-blue/5 border-2 border-dashed border-paytm-blue/20 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                  <p className="text-[10px] font-mono text-paytm-blue truncate">
                    {window.location.origin}/?reveal={formData.unlockCode}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/?reveal=${formData.unlockCode}`;
                    navigator.clipboard.writeText(url);
                    alert("Reveal link copied to clipboard!");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-paytm-blue text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-paytm-blue/20 hover:scale-105 transition-transform"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight px-1 italic">
                * Share this link to allow anyone to bypass the scanner and view the PDF directly.
              </p>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex gap-4 z-[210] max-w-md mx-auto ring-1 ring-black/5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
             <button 
              type="button"
              onClick={onBack}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
             >
               Discard
             </button>
             <button 
              type="submit"
              disabled={saving}
              className="flex-[2] py-4 bg-paytm-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-paytm-blue/40 active:scale-[0.97] transition-all disabled:opacity-50"
             >
               {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
               {saving ? 'Publishing...' : 'Save & Sync'}
             </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN APP ENGINE
// ═══════════════════════════════════════════════════════════

export default function App() {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen for Auth changes
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', u.uid));
          if (adminDoc.exists()) {
            setIsAdmin(true);
          } else if (u.email === 'deeagrawal078@gmail.com') {
            // Bootstrap admin for the user
            await setDoc(doc(db, 'admins', u.uid), { email: u.email, role: 'admin' });
            setIsAdmin(true);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `admins/${u.uid}`);
        }
      } else {
        setIsAdmin(false);
      }
    });

    // Listen for Config changes
    const unsubConfig = onSnapshot(doc(db, 'configs', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppConfig;
        setConfig(data);
        
        // Handle deep-linking
        const params = new URLSearchParams(window.location.search);
        const urlCode = params.get('reveal') || params.get('code');
        if (urlCode && urlCode.toUpperCase() === data.unlockCode.toUpperCase()) {
          setState(AppState.UNLOCKED);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'configs/main');
    });

    return () => {
      unsubAuth();
      unsubConfig();
    };
  }, []);

  const startScan = () => setState(AppState.SCANNER);
  
  const handleScanSuccess = () => {
    setState(AppState.PROCESSING);
    setTimeout(() => {
      setState(AppState.SUCCESS);
    }, 3000);
  };

  const handleReveal = () => setState(AppState.UNLOCKED);

  const goHome = () => setState(AppState.HOME);

  const handleAdminAccess = async () => {
    if (isAdmin) {
      setState(AppState.ADMIN);
      return;
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      
      if (u) {
        try {
          // Immediate check/bootstrap
          const adminDocRef = doc(db, 'admins', u.uid);
          const adminSnap = await getDoc(adminDocRef);
          
          if (adminSnap.exists() || u.email === 'deeagrawal078@gmail.com') {
            if (u.email === 'deeagrawal078@gmail.com' && !adminSnap.exists()) {
              // Bootstrap the record automatically
              await setDoc(adminDocRef, { email: u.email, role: 'admin' });
            }
            setIsAdmin(true);
            setState(AppState.ADMIN);
          } else {
            alert(`Access Denied: ${u.email} is not registered as an admin.`);
            await signOut(auth);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `admins/${u.uid}`);
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Authentication failed: " + error.message);
      }
    }
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    try {
      await setDoc(doc(db, 'configs', 'main'), {
        ...newConfig,
        lastUpdated: new Date().toISOString()
      });
      alert("Changes saved successfully!");
      setState(AppState.HOME);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'configs/main');
    }
  };

  return (
    <main className="relative h-screen bg-white font-sans max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col">
      <StatusBar />
      
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {state === AppState.HOME && (
            <HomeScreen 
              key="home" 
              onStartScan={startScan} 
              onAdmin={handleAdminAccess} 
              config={config}
            />
          )}
          
          {state === AppState.SCANNER && (
            <ScannerScreen key="scanner" onScanSuccess={handleScanSuccess} onBack={goHome} />
          )}

          {state === AppState.PROCESSING && (
            <ProcessingScreen key="processing" config={config} />
          )}

          {state === AppState.SUCCESS && (
            <SuccessScreen key="success" onComplete={handleReveal} config={config} />
          )}

          {state === AppState.UNLOCKED && (
            <UnlockedScreen key="unlocked" config={config} />
          )}

          {state === AppState.ADMIN && isAdmin && (
            <AdminDashboard 
              key="admin" 
              config={config} 
              onSave={handleSaveConfig} 
              onBack={goHome}
              user={user}
            />
          )}
        </AnimatePresence>
      </div>

      {(state === AppState.HOME) && <BottomNav />}

      {/* Realistic App Backdrop (Visual Only) */}
      <div className="fixed inset-0 -z-50 bg-slate-100 hidden md:block" />
    </main>
  );
}
