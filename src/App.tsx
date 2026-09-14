/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Clock, 
  Stethoscope, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Clock3,
  Trash2,
  Users,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import doctorAvatar from "./assets/images/doctor_avatar_1783414966441.jpg";

// ==========================================
// ⚙️ تهيئة الإعدادات ورابط الـ Webhook
// ==========================================
// رابط الـ Webhook الخاص بنظام العيادة (رابط الإنتاج)
const WEBHOOK_URL = "https://auramedflow.online/webhook/8595aadf-c252-4292-9d66-f6069f7215f2";

export default function App() {
  // --- حالات الساعة الحية بتوقيت الجزائر ---
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  // --- حالات زر الاستدعاء والاتصال ---
  const [isSending, setIsSending] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [statusType, setStatusType] = useState<"idle" | "loading" | "success" | "failed" | "warning">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // --- إعدادات الصوت وسجل الاستدعاء ---
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [patientHistory, setPatientHistory] = useState<{ id: number; patientNo: number; time: string; date: string; status: string }[]>([]);
  const [nextPatientNumber, setNextPatientNumber] = useState(1);

  // --- فتح وإغلاق لوحة المساعدة البرمجية ---
  const [showHelp, setShowHelp] = useState(false);

  // --- حالات النص فوق الزر والتعطيل الدائم للمنطق المطلوب ---
  const [buttonTextAbove, setButtonTextAbove] = useState("جاهز لاستدعاء مريض جديد؟");
  const [isButtonPermanentlyDisabled, setIsButtonPermanentlyDisabled] = useState(false);

  // 1. حساب وقت وتاريخ الجزائر بدقة متناهية
  const getAlgiersTime = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Algiers",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return formatter.format(new Date());
    } catch (e) {
      const now = new Date();
      return now.toLocaleTimeString("en-US", { hour12: false });
    }
  };

  const getAlgiersDate = () => {
    try {
      const formatter = new Intl.DateTimeFormat("ar-DZ", {
        timeZone: "Africa/Algiers",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return formatter.format(new Date());
    } catch (e) {
      return new Date().toLocaleDateString("ar-DZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // تحديث الساعة الحية كل ثانية
  useEffect(() => {
    setTime(getAlgiersTime());
    setDate(getAlgiersDate());

    const clockTimer = setInterval(() => {
      setTime(getAlgiersTime());
      setDate(getAlgiersDate());
    }, 1000);

    return () => clearInterval(clockTimer);
  }, []);

  // 2. تحميل البيانات المخزنة محلياً عند بدء التشغيل
  useEffect(() => {
    const savedHistory = localStorage.getItem("clinic_call_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setPatientHistory(parsed);
        if (parsed.length > 0) {
          const maxNum = Math.max(...parsed.map((item: any) => item.patientNo), 0);
          setNextPatientNumber(maxNum + 1);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    
    const savedSound = localStorage.getItem("clinic_sound_enabled");
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }
  }, []);

  // حفظ سجل الاستدعاء محلياً عند تحديثه
  const saveHistoryToLocal = (newHistory: typeof patientHistory) => {
    setPatientHistory(newHistory);
    localStorage.setItem("clinic_call_history", JSON.stringify(newHistory));
  };

  // 3. نغمة تنبيه طبية فاخرة ومحترفة عند استدعاء المريض (تسلسل نغمات مع خفوت تدريجي - Web Audio API)
  const playMedicalChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const playTone = (freq: number, startTime: number, duration: number, volume: number, type: OscillatorType = "sine") => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);

        // هجوم ناعم وخفوت تدريجي متناسق (Attack & Exponential Decay)
        gainNode.gain.setValueAtTime(0.001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // تسلسل نغمات طبي ثلاثي متناغم ومحترف (E5 -> A5 -> C6) مع نغمة دافئة محيطية
      playTone(659.25, now, 0.35, 0.12, "sine");        // E5 (النغمة الأولى)
      playTone(880.00, now + 0.15, 0.45, 0.15, "sine");  // A5 (النغمة الثانية)
      playTone(1046.50, now + 0.32, 0.75, 0.18, "sine"); // C6 (النغمة الثالثة الممتدة)
      playTone(329.63, now + 0.15, 0.8, 0.04, "triangle"); // E4 (هارمونيك دافئ في الخلفية)
    } catch (e) {
      console.error("Audio Context playback failed", e);
    }
  };

  // 4. دالة معالجة زر "المريض التالي" وإرسال الـ Webhook
  const handleCallNextPatient = async () => {
    if (isSending || isCooldown) return;

    setIsSending(true);
    setStatusType("loading");
    setStatusMessage("جاري إرسال الطلب واستدعاء المريض...");
    
    playMedicalChime();

    const currentPatientNum = nextPatientNumber;
    const callTime = getAlgiersTime();
    const callDate = getAlgiersDate();

    const payload = {
      action: "next_patient",
      patientNumber: currentPatientNum,
      clinicName: "عيادة طبيب محمد",
      calledAt: new Date().toISOString(),
      algiersTime: callTime,
      algiersDate: callDate,
    };

    try {
      if (!WEBHOOK_URL) {
        setStatusType("warning");
        setStatusMessage("⚠️ لم يتم تهيئة رابط Webhook في الكود. تم التحديث محلياً للاختبار البصري.");
        
        const newRecord = {
          id: Date.now(),
          patientNo: currentPatientNum,
          time: callTime,
          date: callDate,
          status: "warning"
        };
        const updatedHistory = [newRecord, ...patientHistory].slice(0, 50);
        saveHistoryToLocal(updatedHistory);
        setNextPatientNumber(currentPatientNum + 1);

        triggerCooldown();
        return;
      }

      // إرسال الطلب عبر وكيل السيرفر لتجاوز قيود CORS للمتصفحات
      const response = await fetch("/api/call-patient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhookUrl: WEBHOOK_URL,
          payload: payload
        }),
      });

      if (response.ok) {
        let webhookStatus = "";
        try {
          const resData = await response.json();
          // 1. Try parsing from resData.data
          if (resData && resData.data) {
            try {
              const parsedData = JSON.parse(resData.data);
              if (parsedData && parsedData.status) {
                webhookStatus = String(parsedData.status).toLowerCase().trim();
              }
            } catch (e) {
              if (resData.data && resData.data.status) {
                webhookStatus = String(resData.data.status).toLowerCase().trim();
              }
            }
          }
          // 2. Try parsing from resData itself
          if (!webhookStatus && resData && resData.status) {
            webhookStatus = String(resData.status).toLowerCase().trim();
          }
          // 3. Fallback to check substrings
          if (!webhookStatus && resData && typeof resData.data === "string") {
            if (resData.data.includes('"status":"success"') || resData.data.includes("'status': 'success'")) {
              webhookStatus = "success";
            } else if (resData.data.includes('"status":"completed"') || resData.data.includes("'status': 'completed'")) {
              webhookStatus = "completed";
            }
          }
        } catch (e) {
          console.error("Error reading JSON from response:", e);
        }

        // تطبيق الشروط بناءً على حالة الـ Webhook بشكل صارم ومفصول:
        if (webhookStatus === "completed") {
          // 1. لا يوجد مرضى اليوم
          setButtonTextAbove("لا يوجد مرضى اليوم");
          setIsButtonPermanentlyDisabled(true);
          
          // إخفاء التنبيه الأخضر تماماً ومنع ظهوره
          setStatusType("idle");
          setStatusMessage("");
        } else {
          // 2. تمت مناداة المريض / جاهز لاستدعاء مريض جديد
          setButtonTextAbove("جاهز لاستدعاء مريض جديد؟");
          setIsButtonPermanentlyDisabled(false);
          
          // إظهار التنبيه الأخضر بالأسفل
          setStatusType("success");
          setStatusMessage(`✅ تم استدعاء المريض رقم ${currentPatientNum} بنجاح!`);
          
          // إضافة الاستدعاء إلى السجل وزيادة رقم المريض القادم
          const newRecord = {
            id: Date.now(),
            patientNo: currentPatientNum,
            time: callTime,
            date: callDate,
            status: "success"
          };
          const updatedHistory = [newRecord, ...patientHistory].slice(0, 50);
          saveHistoryToLocal(updatedHistory);
          setNextPatientNumber(currentPatientNum + 1);
        }
      } else {
        let errorDetails = "";
        try {
          const errJson = await response.json();
          if (errJson && errJson.error) {
            errorDetails = `: ${errJson.error}`;
          }
        } catch (e) {
          // Response is not JSON
        }
        
        setStatusType("failed");
        setStatusMessage(`❌ فشل الاستدعاء من الخادم (الرمز: ${response.status})${errorDetails}`);
      }
    } catch (error) {
      console.error("Network error sending webhook:", error);
      setStatusType("failed");
      setStatusMessage("❌ فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.");
    } finally {
      triggerCooldown();
    }
  };

  const triggerCooldown = () => {
    setIsSending(false);
    setIsCooldown(true);
    setCooldownRemaining(3);

    const countdownInterval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClearHistory = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في تصفير اللوحة ومسح سجل الاستدعاءات بالكامل؟")) {
      saveHistoryToLocal([]);
      setNextPatientNumber(1);
      setStatusType("idle");
      setStatusMessage("");
      setButtonTextAbove("جاهز لاستدعاء مريض جديد؟");
      setIsButtonPermanentlyDisabled(false);
    }
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem("clinic_sound_enabled", String(newVal));
  };

  return (
    <div 
      id="main-container"
      dir="rtl" 
      className={`min-h-screen bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] bg-slate-50/70 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 lg:p-10 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-950 relative overflow-x-hidden`}
    >
      {/* المؤثرات السينمائية الخلفية (Premium Ambient Glow) */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-blue-400/8 to-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35vw] h-[35vw] bg-gradient-to-tr from-emerald-300/6 to-teal-400/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[25vw] h-[25vw] bg-violet-400/5 rounded-full blur-[110px] pointer-events-none" />
      
      {/* شريط الإعدادات السريع العلوي */}
      <header id="app-header" className="w-full max-w-5xl mx-auto flex justify-between items-center py-2 px-2 mb-4 md:mb-6 shrink-0">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur text-blue-700 px-4 py-2 rounded-full shadow-[0_4px_24px_rgba(15,23,42,0.03)] border border-slate-100/80">
          <Stethoscope className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">القسم الطبي المباشر</span>
        </div>
        
        <div className="flex gap-2">
          {/* زر كتم الصوت */}
          <button
            id="sound-toggle-btn"
            onClick={toggleSound}
            className="p-2 sm:p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-blue-600 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer"
            title={soundEnabled ? "كتم صوت التنبيه" : "تفعيل صوت التنبيه"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
          </button>

          {/* زر المساعدة البرمجية حول الـ Webhook */}
          <button
            id="help-toggle-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 sm:p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 hover:text-blue-600 shadow-[0_4px_20px_rgba(15,23,42,0.02)] hover:shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all duration-300 cursor-pointer"
            title="إرشادات إعداد الربط البرمجي"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* لوحة تحكم شبكة بينتو (Bento Grid Dashboard) */}
      <main id="main-content" className="w-full max-w-5xl mx-auto flex-1 flex flex-col justify-center gap-5 sm:gap-6 w-full my-auto py-2">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 w-full">
          
          {/* البطاقة 1: ترويسة العيادة (Bento Span 2) */}
          <div 
            id="clinic-header-card" 
            className="md:col-span-2 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200/70 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 p-6 sm:p-7 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-50/70 rounded-full blur-3xl -mr-16 -mt-16 opacity-70 pointer-events-none" />
            
            <div className="w-20 h-26 sm:w-24 sm:h-30 bg-slate-50 rounded-[16px] flex items-center justify-center border-2 border-white shadow-md ring-4 ring-slate-100/80 shrink-0 overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
              <img 
                src={doctorAvatar} 
                alt="الطبيب" 
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="text-center sm:text-right flex-1">
              <span className="bg-sky-50 text-sky-800 px-3 py-1 rounded-full text-xs font-bold border border-sky-100/80 inline-block mb-2">عيادة معتمدة</span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                عيادة طبيب محمد
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 leading-relaxed">
                قسم الاستقبال وتنظيم الدور • اللوحة الذكية للمرضى حياً
              </p>
            </div>
          </div>

          {/* البطاقة 2: الساعة الحية بتوقيت الجزائر (Bento Span 1) - تدرج طبي كحلي فاخر */}
          <div 
            id="algiers-clock-card" 
            className="md:col-span-1 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-[24px] shadow-[0_10px_30px_rgba(15,23,42,0.12)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.2)] hover:-translate-y-0.5 p-6 sm:p-7 flex flex-col justify-center items-center text-center relative overflow-hidden border border-white/10 transition-all duration-300"
          >
            {/* مؤشر البث الحي الفخم */}
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span className="text-[9px] font-black text-emerald-400 tracking-widest">LIVE</span>
            </div>

            <Clock3 className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 pointer-events-none" />

            <div className="text-[10px] text-sky-200/80 font-bold uppercase tracking-widest mb-2">
              توقيت الجزائر الآن
            </div>

            <div className="font-mono text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-100 via-blue-50 to-white py-1">
              {time || "00:00:00"}
            </div>

            <div className="text-xs text-sky-200/90 font-medium mt-2 bg-white/10 px-3 py-1 rounded-[12px] border border-white/10 backdrop-blur-sm">
              {date || "جاري جلب التاريخ..."}
            </div>
          </div>

          {/* البطاقة 3: لوحة التحكم الرئيسية بالاستدعاء (Bento Span 2) */}
          <div 
            id="main-action-card" 
            className="md:col-span-2 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200/70 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 p-6 sm:p-7 flex flex-col justify-between items-center text-center relative transition-all duration-300 min-h-[260px] md:min-h-[290px]"
          >
            <div className="w-full mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">{buttonTextAbove}</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
                سيتم إرسال إشعار فوري وتنبيه شاشات العيادة ورابط الـ Webhook
              </p>
            </div>

            <div className="w-full flex flex-col items-center gap-3 sm:gap-4 my-2">
              {/* زر الاستدعاء الضخم والجذاب والفاخر */}
              <button
                id="next-patient-btn"
                onClick={handleCallNextPatient}
                disabled={isSending || isCooldown || isButtonPermanentlyDisabled}
                className={`w-full max-w-[380px] py-3.5 sm:py-4 px-6 font-extrabold text-base sm:text-lg md:text-xl rounded-[16px] flex items-center justify-center gap-3 transition-all duration-300 border cursor-pointer relative overflow-hidden ${
                  isButtonPermanentlyDisabled
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none"
                    : isSending
                    ? "bg-sky-50 text-sky-600 border-sky-100 cursor-not-allowed shadow-none"
                    : isCooldown
                    ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white border-0 shadow-[0_8px_25px_rgba(37,99,235,0.22)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.32)] hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {isButtonPermanentlyDisabled ? (
                  <>
                    <UserPlus className="w-5 h-5 opacity-40" />
                    <span>المريض التالي</span>
                  </>
                ) : isSending ? (
                  <div className="flex items-center gap-2.5">
                    <svg className="animate-spin h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>جاري الاستدعاء...</span>
                  </div>
                ) : isCooldown ? (
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-slate-400 animate-pulse" />
                    <span>متاح بعد ({cooldownRemaining}ث)</span>
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>المريض التالي</span>
                  </>
                )}

                {/* مؤشر تنازلي مرئي */}
                {isCooldown && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-slate-200 transition-all duration-1000 ease-linear"
                    style={{ width: `${(cooldownRemaining / 3) * 100}%` }}
                  />
                )}
              </button>

              {/* المريض التالي المرتقب */}
              <div className="text-slate-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <span>المريض التالي المتوقع:</span>
                <span className="bg-sky-50 text-sky-700 px-3 py-0.5 rounded-full border border-sky-100 text-xs font-bold">
                  الرقم {nextPatientNumber}
                </span>
              </div>
            </div>

            {/* رسالة حالة الـ Webhook أسفل الزر */}
            <div className="w-full mt-3 min-h-[36px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {statusType !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    id="status-area"
                    className={`py-2 px-4 rounded-[12px] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs ${
                      statusType === "loading"
                        ? "bg-slate-50 text-slate-600 border border-slate-100"
                        : statusType === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : statusType === "failed"
                        ? "bg-rose-50 text-rose-700 border border-rose-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {statusType === "loading" && (
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {statusType === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {statusType === "failed" && <XCircle className="w-4 h-4 text-rose-600" />}
                    {statusType === "warning" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                    <span>{statusMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* البطاقة 4: إحصائيات وقائمة الانتظار وحالة الدور (Bento Span 1) */}
          <div 
            id="stats-history-card" 
            className="md:col-span-1 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200/70 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 min-h-[260px] md:min-h-[290px]"
          >
            {/* إحصائية الاستدعاءات الفاخرة */}
            <div className="text-center flex flex-col items-center w-full">
              <div className="w-10 h-10 bg-sky-50 rounded-[12px] flex items-center justify-center text-sky-600 shadow-inner border border-sky-100/60 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 tracking-tight py-0.5">
                {Math.max(0, nextPatientNumber - 1)}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                إجمالي الاستدعاءات اليوم
              </div>

              {/* منحنى بياني انسيابي ونحيف جداً يمثل تدفق واستدعاءات العيادة */}
              <div className="w-full h-6 mt-2 relative overflow-visible">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="50%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                    <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Filled Area under the curve */}
                  <path
                    d="M0,25 C15,12 25,28 45,10 C65,24 80,6 100,20 C110,14 115,16 120,8 L120,30 L0,30 Z"
                    fill="url(#sparkline-fill)"
                  />
                  {/* The main stroke path */}
                  <path
                    d="M0,25 C15,12 25,28 45,10 C65,24 80,6 100,20 C110,14 115,16 120,8"
                    fill="none"
                    stroke="url(#sparkline-grad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {/* Pulsing endpoint indicator */}
                  <circle cx="120" cy="8" r="3" fill="#0284c7" className="animate-pulse" />
                  <circle cx="120" cy="8" r="6" fill="#0284c7" fillOpacity="0.3" className="animate-ping" />
                </svg>
              </div>
            </div>

            {/* سجل الاستدعاءات الأحدث */}
            <div className="mt-3 flex-1 flex flex-col justify-end w-full">
              <div className="bg-slate-50/80 border border-slate-100 rounded-[16px] p-3 sm:p-3.5 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>آخر استدعاءات للمرضى</span>
                  </span>
                  
                  {patientHistory.length > 0 && (
                    <button
                      id="clear-history-btn"
                      onClick={handleClearHistory}
                      className="text-slate-400 hover:text-rose-600 transition-colors text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                      title="مسح السجل بالكامل"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>تصفير</span>
                    </button>
                  )}
                </div>

                <div className="max-h-20 sm:max-h-24 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
                  {patientHistory.length === 0 ? (
                    <div className="text-center py-1.5 text-slate-400 text-xs">
                      لا يوجد أي استدعاءات حالية.
                    </div>
                  ) : (
                    patientHistory.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs bg-white p-1.5 sm:p-2 rounded-[10px] border border-slate-100 shadow-xs">
                        <span className="font-bold text-slate-700">المريض رقم {item.patientNo}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{item.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* لوحة مساعدة وإرشادات إعداد الـ Webhook قابلة للفتح والغلق - تظهر أسفل الـ Bento ككتلة إضافية */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div id="developer-guide-card" className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-xl text-xs sm:text-sm leading-relaxed flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center gap-2 text-sm sm:text-base">
                    💡 دليل المطور لإعداد الـ Webhook
                  </span>
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="text-slate-400 hover:text-white font-bold bg-slate-800 px-3 py-1 rounded-xl cursor-pointer transition-colors border border-slate-700/50 text-xs"
                  >
                    إغلاق
                  </button>
                </div>
                <p className="text-slate-300">
                  يمكنك ربط لوحة استدعاء المرضى هذه بتطبيقات خارجية كـ (Discord، Slack، أو Make) لتلقي دور المريض التالي حياً فور نقر الزر.
                </p>
                <div className="bg-black/40 rounded-xl p-3.5 font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto select-all leading-normal">
                  {"// الخطوة: ابحث عن هذا المتغير في ملف src/App.tsx وتحديثه بالرابط الحقيقي:"}
                  <br />
                  {"const WEBHOOK_URL = \"https://your-webhook-endpoint.com/xyz\";"}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  📌 يقوم التطبيق بإرسال طلب <span className="text-emerald-400 font-bold">POST</span> بترميز <span className="text-emerald-400 font-bold">JSON</span> يحتوي على تفاصيل رقم المريض المستدعى، اسم العيادة، والتوقيت المحلي الدقيق للجزائر.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ذيل الصفحة البسيط */}
      <footer id="app-footer" className="w-full text-center py-3 mt-4 border-t border-slate-200/40 text-slate-400 text-xs sm:text-sm leading-relaxed shrink-0">
        <p className="font-bold text-slate-500/90">لوحة تحكم عيادة طبيب محمد © {new Date().getFullYear()}</p>
        <p className="text-xs text-slate-400/60 mt-0.5">تصميم Bento Grid متكامل متجاوب يدعم توقيت الجزائر والـ Webhook</p>
      </footer>
    </div>
  );
}